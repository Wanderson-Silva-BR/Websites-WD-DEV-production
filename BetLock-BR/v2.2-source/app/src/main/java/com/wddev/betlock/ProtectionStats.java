package com.wddev.betlock;

import android.content.Context;
import android.content.SharedPreferences;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

final class ProtectionStats {
    private static final String PREFS = "betlock_stats";
    private static final String DAY = "stats_day";
    private static final String BET_TOTAL = "blocked_bets_total";
    private static final String AD_TOTAL = "blocked_ads_total";
    private static final String BET_TODAY = "blocked_bets_today";
    private static final String AD_TODAY = "blocked_ads_today";
    private static final String PROTECTED_MS = "protected_ms_total";

    private final SharedPreferences prefs;
    private long lastProtectionTick;

    ProtectionStats(Context context) {
        prefs = context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        resetDayIfNeeded();
        lastProtectionTick = System.currentTimeMillis();
    }

    synchronized void blockedBet() { resetDayIfNeeded(); inc(BET_TOTAL, BET_TODAY); }
    synchronized void blockedAd() { resetDayIfNeeded(); inc(AD_TOTAL, AD_TODAY); }

    private void inc(String total, String today) {
        prefs.edit().putLong(total, prefs.getLong(total, 0) + 1)
                .putLong(today, prefs.getLong(today, 0) + 1).apply();
    }

    synchronized void tickProtection() {
        long now = System.currentTimeMillis();
        long delta = Math.max(0, Math.min(now - lastProtectionTick, 5 * 60_000L));
        lastProtectionTick = now;
        if (delta > 0) prefs.edit().putLong(PROTECTED_MS, prefs.getLong(PROTECTED_MS, 0) + delta).apply();
    }

    long betTotal() { return prefs.getLong(BET_TOTAL, 0); }
    long adTotal() { return prefs.getLong(AD_TOTAL, 0); }
    long betToday() { resetDayIfNeeded(); return prefs.getLong(BET_TODAY, 0); }
    long adToday() { resetDayIfNeeded(); return prefs.getLong(AD_TODAY, 0); }
    long protectedMs() { return prefs.getLong(PROTECTED_MS, 0); }

    private void resetDayIfNeeded() {
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        String stored = prefs.getString(DAY, "");
        if (!today.equals(stored)) {
            prefs.edit().putString(DAY, today).putLong(BET_TODAY, 0).putLong(AD_TODAY, 0).apply();
        }
    }
}
