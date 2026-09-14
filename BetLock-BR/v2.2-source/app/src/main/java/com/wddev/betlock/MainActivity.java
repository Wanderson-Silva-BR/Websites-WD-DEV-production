package com.wddev.betlock;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.VpnService;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.text.format.DateFormat;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.CompoundButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Space;
import android.widget.Switch;
import android.widget.TextView;

import java.util.Date;

public class MainActivity extends Activity {
    private static final int REQ_VPN = 100;
    private static final int REQ_NOTIFICATIONS = 101;
    private TextView status, details, counters, progress;
    private Button activate;
    private Switch adSwitch;
    private SharedPreferences prefs;
    private ProtectionStats stats;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable refreshTask = new Runnable() {
        @Override public void run() { refresh(); handler.postDelayed(this, 2500); }
    };

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences(BlocklistRepository.PREFS, MODE_PRIVATE);
        stats = new ProtectionStats(this);
        setContentView(buildUi());
        refresh();
    }

    private View buildUi() {
        ScrollView scroll = new ScrollView(this);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(22), dp(28), dp(22), dp(30));
        root.setBackgroundColor(Color.rgb(9, 13, 18));
        scroll.addView(root, new ScrollView.LayoutParams(-1, -2));

        ImageView icon = new ImageView(this);
        icon.setImageResource(R.drawable.ic_shield);
        LinearLayout.LayoutParams ip = new LinearLayout.LayoutParams(dp(70), dp(70));
        ip.gravity = Gravity.CENTER_HORIZONTAL;
        icon.setLayoutParams(ip);
        root.addView(icon);

        TextView title = text("BetLock BR", 29, Color.rgb(242,246,250), true);
        title.setGravity(Gravity.CENTER_HORIZONTAL);
        title.setPadding(0, dp(10), 0, dp(2));
        root.addView(title);
        TextView version = text("Campus Beta • v2.2.0 • BET Shield + AdBlock", 14, Color.rgb(130,160,188), false);
        version.setGravity(Gravity.CENTER_HORIZONTAL);
        root.addView(version);

        addSpace(root, 20);
        LinearLayout statusCard = card(root);
        status = text("Verificando…", 20, Color.WHITE, true);
        statusCard.addView(status);
        details = text("", 13, Color.rgb(159,176,192), false);
        details.setPadding(0, dp(8), 0, 0);
        statusCard.addView(details);

        activate = primaryButton("ATIVAR PROTEÇÃO");
        activate.setOnClickListener(v -> requestVpn());
        addButton(root, activate, 16);

        LinearLayout adCard = card(root);
        adCard.addView(text("AdBlock para apps e jogos", 17, Color.WHITE, true));
        TextView adDesc = text("Bloqueia anúncios e rastreadores por DNS. Pode ser desligado temporariamente para anúncios recompensados; o bloqueio de BETs continua ativo.", 13, Color.rgb(159,176,192), false);
        adDesc.setPadding(0, dp(6), 0, dp(8));
        adCard.addView(adDesc);
        adSwitch = new Switch(this);
        adSwitch.setText("AdBlock ativado");
        adSwitch.setTextColor(Color.WHITE);
        adSwitch.setTextSize(15);
        adSwitch.setChecked(prefs.getBoolean(BlocklistRepository.KEY_AD_ENABLED, true));
        adSwitch.setOnCheckedChangeListener(this::onAdChanged);
        adCard.addView(adSwitch);

        addSpace(root, 12);
        LinearLayout statsCard = card(root);
        statsCard.addView(text("Proteção e progresso", 17, Color.WHITE, true));
        counters = text("", 15, Color.rgb(216,226,235), false);
        counters.setPadding(0, dp(8), 0, 0);
        statsCard.addView(counters);
        progress = text("", 13, Color.rgb(130,160,188), false);
        progress.setPadding(0, dp(10), 0, 0);
        statsCard.addView(progress);

        Button update = secondaryButton("Atualizar listas agora");
        update.setOnClickListener(v -> sendServiceAction(BetLockVpnService.ACTION_UPDATE));
        addButton(root, update, 12);

        Button vpn = secondaryButton("Configurar VPN sempre ativa");
        vpn.setOnClickListener(v -> {
            try { startActivity(new Intent(Settings.ACTION_VPN_SETTINGS)); }
            catch (Exception e) { startActivity(new Intent(Settings.ACTION_SETTINGS)); }
        });
        addButton(root, vpn, 4);

        TextView note = text("A proteção contra apostas não possui botão de desbloqueio dentro do app. Como toda VPN local sem root, o proprietário do Android ainda pode desativá-la ou removê-la pelas Configurações. Não ative ‘Bloquear conexões sem VPN’: esta versão roteia somente DNS.", 12, Color.rgb(145,158,170), false);
        note.setPadding(0, dp(16), 0, 0);
        root.addView(note);
        TextView privacy = text("Privacidade: filtragem local. O BetLock não envia seu histórico para servidor próprio; consultas DNS permitidas são encaminhadas para 1.1.1.1/1.0.0.1.", 12, Color.rgb(115,132,148), false);
        privacy.setPadding(0, dp(12), 0, 0);
        root.addView(privacy);
        TextView academic = text("Projeto acadêmico e experimental • Wanderson • BICT", 11, Color.rgb(98,118,137), false);
        academic.setGravity(Gravity.CENTER_HORIZONTAL);
        academic.setPadding(0, dp(22), 0, 0);
        root.addView(academic);
        return scroll;
    }

    private void onAdChanged(CompoundButton b, boolean enabled) {
        prefs.edit().putBoolean(BlocklistRepository.KEY_AD_ENABLED, enabled).apply();
        b.setText(enabled ? "AdBlock ativado" : "AdBlock pausado");
        sendServiceAction(BetLockVpnService.ACTION_RELOAD);
        refresh();
    }

    private void requestVpn() {
        Intent prep = VpnService.prepare(this);
        if (prep != null) startActivityForResult(prep, REQ_VPN); else startProtection();
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_VPN && resultCode == RESULT_OK) startProtection();
    }

    private void startProtection() {
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIFICATIONS);
        }
        sendServiceAction(BetLockVpnService.ACTION_START);
        prefs.edit().putBoolean(BetLockVpnService.PREF_ACTIVE, true).apply();
        refresh();
    }

    private void sendServiceAction(String action) {
        Intent s = new Intent(this, BetLockVpnService.class).setAction(action);
        try { if (Build.VERSION.SDK_INT >= 26) startForegroundService(s); else startService(s); }
        catch (Exception ignored) {}
    }

    @Override protected void onResume() { super.onResume(); handler.removeCallbacks(refreshTask); handler.post(refreshTask); }
    @Override protected void onPause() { handler.removeCallbacks(refreshTask); super.onPause(); }

    private void refresh() {
        if (prefs == null || status == null) return;
        boolean active = VpnService.prepare(this) == null && prefs.getBoolean(BetLockVpnService.PREF_ACTIVE, false);
        boolean ads = prefs.getBoolean(BlocklistRepository.KEY_AD_ENABLED, true);
        if (adSwitch != null && adSwitch.isChecked() != ads) adSwitch.setChecked(ads);
        if (adSwitch != null) adSwitch.setText(ads ? "AdBlock ativado" : "AdBlock pausado");

        if (active) {
            status.setText(ads ? "PROTEÇÃO ATIVA • BET + ADS" : "PROTEÇÃO ATIVA • BET");
            status.setTextColor(Color.rgb(61,220,132));
            activate.setVisibility(View.GONE);
        } else {
            status.setText("PROTEÇÃO AINDA NÃO ATIVADA");
            status.setTextColor(Color.rgb(255,92,92));
            activate.setVisibility(View.VISIBLE);
        }

        int bets = prefs.getInt(BlocklistRepository.KEY_BET_COUNT, 14);
        int adCount = prefs.getInt(BlocklistRepository.KEY_AD_COUNT, 15);
        long last = prefs.getLong(BlocklistRepository.KEY_LAST_UPDATE, 0L);
        String err = prefs.getString(BlocklistRepository.KEY_LAST_ERROR, "");
        StringBuilder d = new StringBuilder();
        d.append("• ").append(bets).append(" regras/domínios de apostas");
        d.append("\n• ").append(adCount).append(" regras/domínios de anúncios e rastreamento");
        d.append("\n• *.bet.br permanece bloqueado");
        if (last > 0) d.append("\n• Listas: ").append(DateFormat.getDateFormat(this).format(new Date(last))).append(" ").append(DateFormat.getTimeFormat(this).format(new Date(last)));
        else d.append("\n• Listas online serão baixadas após a ativação");
        if (err != null && !err.isEmpty()) d.append("\n• Aviso: ").append(err);
        details.setText(d.toString());

        counters.setText("Hoje: " + stats.betToday() + " BETs • " + stats.adToday() + " anúncios\n" +
                "Total: " + stats.betTotal() + " BETs • " + stats.adTotal() + " anúncios");
        ProgressionManager.Snapshot p = ProgressionManager.fromProtectedMillis(stats.protectedMs());
        progress.setText("Nível " + p.level + " • " + p.title + " • " + p.xp + " XP\n" +
                "Equipamento: " + p.equipment + " • proteção acumulada: " + p.hours + "h");
    }

    private LinearLayout card(LinearLayout root) {
        LinearLayout c = new LinearLayout(this);
        c.setOrientation(LinearLayout.VERTICAL);
        c.setPadding(dp(18), dp(16), dp(18), dp(16));
        c.setBackgroundResource(R.drawable.panel_bg);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.topMargin = dp(12);
        root.addView(c, lp);
        return c;
    }

    private Button primaryButton(String label) {
        Button b = new Button(this); b.setText(label); b.setTextColor(Color.rgb(9,13,18)); b.setTextSize(15);
        b.setTypeface(Typeface.DEFAULT_BOLD); b.setAllCaps(false); b.setBackgroundResource(R.drawable.button_bg); return b;
    }

    private Button secondaryButton(String label) {
        Button b = new Button(this); b.setText(label); b.setTextColor(Color.WHITE); b.setTextSize(14);
        b.setAllCaps(false); b.setBackgroundColor(Color.TRANSPARENT); return b;
    }

    private void addButton(LinearLayout root, Button b, int top) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, dp(52)); lp.topMargin = dp(top); root.addView(b, lp);
    }
    private void addSpace(LinearLayout root, int h) { Space s = new Space(this); root.addView(s, new LinearLayout.LayoutParams(1, dp(h))); }
    private TextView text(String value, int sp, int color, boolean bold) {
        TextView t = new TextView(this); t.setText(value); t.setTextSize(sp); t.setTextColor(color); t.setLineSpacing(0, 1.12f);
        if (bold) t.setTypeface(Typeface.DEFAULT_BOLD); return t;
    }
    private int dp(int n) { return Math.round(n * getResources().getDisplayMetrics().density); }
}
