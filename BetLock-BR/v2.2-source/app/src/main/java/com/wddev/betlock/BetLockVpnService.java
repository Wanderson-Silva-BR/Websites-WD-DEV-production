package com.wddev.betlock;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.VpnService;
import android.os.Build;
import android.os.ParcelFileDescriptor;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.util.Arrays;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

public class BetLockVpnService extends VpnService {
    static final String ACTION_START = "com.wddev.betlock.START";
    static final String ACTION_RELOAD = "com.wddev.betlock.RELOAD";
    static final String ACTION_UPDATE = "com.wddev.betlock.UPDATE";
    static final String PREF_ACTIVE = "vpn_active";
    private static final int NOTIFICATION_ID = 8801;
    private static final String CHANNEL_ID = "betlock_protection";
    private static final String VIRTUAL_DNS = "10.77.0.2";
    private static final String VIRTUAL_CLIENT = "10.77.0.1";

    private final AtomicBoolean running = new AtomicBoolean(false);
    private final DomainMatcher betMatcher = new DomainMatcher();
    private final DomainMatcher adMatcher = new DomainMatcher();
    private ParcelFileDescriptor tun;
    private ExecutorService ioExecutor;
    private ScheduledExecutorService updater;
    private BlocklistRepository repo;
    private ProtectionStats stats;
    private SharedPreferences prefs;

    @Override public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        prefs = getSharedPreferences(BlocklistRepository.PREFS, MODE_PRIVATE);
        repo = new BlocklistRepository(this, betMatcher, adMatcher);
        stats = new ProtectionStats(this);
        repo.loadLocal();
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(NOTIFICATION_ID, buildNotification("Proteção ativa"));
        String action = intent == null ? ACTION_START : intent.getAction();
        if (ACTION_RELOAD.equals(action)) { repo.loadLocal(); return START_STICKY; }
        if (ACTION_UPDATE.equals(action)) { ensureSchedulers(); updater.execute(this::safeUpdate); return START_STICKY; }
        if (running.compareAndSet(false, true)) startVpn();
        return START_STICKY;
    }

    private void startVpn() {
        try {
            Builder b = new Builder().setSession("BetLock BR 2.2")
                    .setMtu(1500).addAddress(VIRTUAL_CLIENT, 32)
                    .addDnsServer(VIRTUAL_DNS).addRoute(VIRTUAL_DNS, 32).setBlocking(true);
            tun = b.establish();
            if (tun == null) throw new IllegalStateException("VPN não autorizada");
            prefs.edit().putBoolean(PREF_ACTIVE, true).apply();
            ioExecutor = Executors.newSingleThreadExecutor(r -> new Thread(r, "BetLock-DNS"));
            ioExecutor.execute(this::packetLoop);
            ensureSchedulers();
            updater.scheduleWithFixedDelay(this::safeUpdate, 2, 12 * 60 * 60, TimeUnit.SECONDS);
            updater.scheduleWithFixedDelay(stats::tickProtection, 1, 1, TimeUnit.MINUTES);
        } catch (Exception e) { repo.saveError(e); stopSelf(); }
    }

    private synchronized void ensureSchedulers() {
        if (updater == null || updater.isShutdown()) updater = Executors.newSingleThreadScheduledExecutor(r -> new Thread(r, "BetLock-Lists"));
    }

    private void packetLoop() {
        byte[] buffer = new byte[32767];
        try (FileInputStream in = new FileInputStream(tun.getFileDescriptor());
             FileOutputStream out = new FileOutputStream(tun.getFileDescriptor())) {
            while (running.get()) {
                int n = in.read(buffer);
                if (n <= 0) continue;
                DnsPacket.Query q = DnsPacket.parseIpv4UdpDns(buffer, n);
                if (q == null) continue;
                boolean blockBet = betMatcher.isBlocked(q.host);
                boolean blockAd = !blockBet && prefs.getBoolean(BlocklistRepository.KEY_AD_ENABLED, true) && adMatcher.isBlocked(q.host);
                byte[] dnsResponse;
                if (blockBet) { stats.blockedBet(); dnsResponse = DnsPacket.nxdomain(q.dnsPayload); }
                else if (blockAd) { stats.blockedAd(); dnsResponse = DnsPacket.nxdomain(q.dnsPayload); }
                else { dnsResponse = forwardDns(q.dnsPayload); if (dnsResponse == null) continue; }
                out.write(DnsPacket.buildIpv4UdpResponse(q, dnsResponse));
            }
        } catch (Exception e) { if (running.get()) repo.saveError(e); }
    }

    private byte[] forwardDns(byte[] payload) {
        String[] resolvers = {"1.1.1.1", "1.0.0.1"};
        for (String resolver : resolvers) {
            try (DatagramSocket socket = new DatagramSocket()) {
                protect(socket);
                socket.setSoTimeout(4500);
                socket.send(new DatagramPacket(payload, payload.length, InetAddress.getByName(resolver), 53));
                byte[] buf = new byte[4096];
                DatagramPacket response = new DatagramPacket(buf, buf.length);
                socket.receive(response);
                return Arrays.copyOf(response.getData(), response.getLength());
            } catch (Exception ignored) {}
        }
        return null;
    }

    private void safeUpdate() {
        try {
            repo.updateFromInternet();
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.notify(NOTIFICATION_ID, buildNotification("Proteção ativa • listas atualizadas"));
        } catch (Exception e) { repo.saveError(e); }
    }

    private Notification buildNotification(String text) {
        Intent open = new Intent(this, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL_ID) : new Notification.Builder(this);
        boolean ad = prefs == null || prefs.getBoolean(BlocklistRepository.KEY_AD_ENABLED, true);
        String suffix = ad ? " • BET + AdBlock" : " • BET";
        return b.setSmallIcon(R.drawable.ic_shield).setContentTitle("BetLock BR").setContentText(text + suffix)
                .setOngoing(true).setOnlyAlertOnce(true).setContentIntent(pi).build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel c = new NotificationChannel(CHANNEL_ID, "Proteção BetLock", NotificationManager.IMPORTANCE_LOW);
            c.setDescription("Bloqueio local de apostas e, opcionalmente, anúncios");
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(c);
        }
    }

    @Override public void onRevoke() { shutdown(); super.onRevoke(); }
    @Override public void onDestroy() { shutdown(); super.onDestroy(); }

    private synchronized void shutdown() {
        if (!running.getAndSet(false)) return;
        stats.tickProtection();
        prefs.edit().putBoolean(PREF_ACTIVE, false).apply();
        if (updater != null) updater.shutdownNow();
        if (ioExecutor != null) ioExecutor.shutdownNow();
        if (tun != null) { try { tun.close(); } catch (Exception ignored) {} tun = null; }
    }
}
