package com.wddev.betlock;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.VpnService;
import android.os.Build;

public class BootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        if (!Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) return;
        boolean active = context.getSharedPreferences(BlocklistRepository.PREFS, Context.MODE_PRIVATE)
                .getBoolean(BetLockVpnService.PREF_ACTIVE, false);
        if (!active || VpnService.prepare(context) != null) return;
        Intent service = new Intent(context, BetLockVpnService.class).setAction(BetLockVpnService.ACTION_START);
        try { if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(service); else context.startService(service); }
        catch (Exception ignored) {}
    }
}
