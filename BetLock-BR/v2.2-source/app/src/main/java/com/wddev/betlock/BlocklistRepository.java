package com.wddev.betlock;

import android.content.Context;
import android.content.SharedPreferences;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

final class BlocklistRepository {
    static final String PREFS = "betlock";
    static final String KEY_BET_COUNT = "bet_domain_count";
    static final String KEY_AD_COUNT = "ad_domain_count";
    static final String KEY_LAST_UPDATE = "last_update";
    static final String KEY_LAST_ERROR = "last_error";
    static final String KEY_AD_ENABLED = "adblock_enabled";

    private static final String BET_FILE = "bet_domains.txt";
    private static final String AD_FILE = "ad_domains.txt";

    private static final Set<String> BUILTIN_BETS = new HashSet<>(Arrays.asList(
            "bet.br", "bet365.com", "betfair.com", "betano.com", "betsson.com", "sportingbet.com",
            "kto.com", "brazino777.com", "pokerstars.com", "superbet.com",
            "qq89.com", "p0l6rzz.com", "82b.vip", "888win.com"
    ));

    private static final Set<String> BUILTIN_ADS = new HashSet<>(Arrays.asList(
            "doubleclick.net", "googleadservices.com", "googlesyndication.com",
            "adcolony.com", "applovin.com", "applovinres.com", "unityads.unity3d.com",
            "vungle.com", "vungle.akadns.net", "ironsrc.com", "supersonicads.com",
            "chartboost.com", "inmobi.com", "startappservice.com", "admob.com"
    ));

    private static final String[] BET_SOURCES = new String[] {
            "https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/wildcard/gambling.mini-onlydomains.txt",
            "https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/gambling-only/hosts",
            "https://raw.githubusercontent.com/bet-blocker/bet-blocker/main/blocklist.txt"
    };

    private static final String[] AD_SOURCES = new String[] {
            "https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/wildcard/pro.mini-onlydomains.txt",
            "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts"
    };

    private final Context context;
    private final DomainMatcher betMatcher;
    private final DomainMatcher adMatcher;
    private final SharedPreferences prefs;

    BlocklistRepository(Context context, DomainMatcher betMatcher, DomainMatcher adMatcher) {
        this.context = context.getApplicationContext();
        this.betMatcher = betMatcher;
        this.adMatcher = adMatcher;
        this.prefs = this.context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (!prefs.contains(KEY_AD_ENABLED)) prefs.edit().putBoolean(KEY_AD_ENABLED, true).apply();
    }

    void loadLocal() {
        Set<String> bets = loadCategory(BET_FILE, BUILTIN_BETS);
        Set<String> ads = loadCategory(AD_FILE, BUILTIN_ADS);
        betMatcher.replace(bets);
        adMatcher.replace(ads);
        prefs.edit().putInt(KEY_BET_COUNT, bets.size()).putInt(KEY_AD_COUNT, ads.size()).apply();
    }

    private Set<String> loadCategory(String fileName, Set<String> builtins) {
        Set<String> all = new HashSet<>(builtins);
        File file = new File(context.getFilesDir(), fileName);
        if (!file.isFile()) return all;
        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                new FileInputStream(file), StandardCharsets.UTF_8), 64 * 1024)) {
            String line;
            while ((line = br.readLine()) != null) {
                String d = DomainMatcher.normalize(line);
                if (!d.isEmpty()) all.add(d);
            }
        } catch (Exception ignored) {}
        return all;
    }

    synchronized void updateFromInternet() throws Exception {
        UpdateResult bets = updateCategory(BET_SOURCES, BET_FILE, BUILTIN_BETS, 1000);
        UpdateResult ads = updateCategory(AD_SOURCES, AD_FILE, BUILTIN_ADS, 1000);
        if (bets.updated) betMatcher.replace(bets.domains);
        if (ads.updated) adMatcher.replace(ads.domains);
        if (!bets.updated && !ads.updated) throw new IllegalStateException("Nenhuma lista conseguiu ser atualizada");

        SharedPreferences.Editor e = prefs.edit();
        e.putInt(KEY_BET_COUNT, betMatcher.size());
        e.putInt(KEY_AD_COUNT, adMatcher.size());
        e.putLong(KEY_LAST_UPDATE, System.currentTimeMillis());
        if (bets.error != null || ads.error != null) {
            String warning = "Atualização parcial";
            if (bets.error != null) warning += " • BET: " + safeMessage(bets.error);
            if (ads.error != null) warning += " • Ads: " + safeMessage(ads.error);
            e.putString(KEY_LAST_ERROR, warning);
        } else e.remove(KEY_LAST_ERROR);
        e.apply();
    }

    private UpdateResult updateCategory(String[] sources, String fileName, Set<String> builtins, int minimum) {
        Set<String> merged = new HashSet<>(builtins);
        int successful = 0;
        Exception last = null;
        for (String source : sources) {
            try { downloadAndParse(source, merged); successful++; }
            catch (Exception e) { last = e; }
        }
        if (successful == 0 || merged.size() < minimum) {
            return new UpdateResult(false, merged, last != null ? last : new IllegalStateException("Lista incompleta"));
        }
        try { saveAtomic(fileName, merged); return new UpdateResult(true, merged, last); }
        catch (Exception e) { return new UpdateResult(false, merged, e); }
    }

    private void saveAtomic(String fileName, Set<String> domains) throws Exception {
        File target = new File(context.getFilesDir(), fileName);
        File temp = new File(context.getFilesDir(), fileName + ".tmp");
        try (BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(
                new FileOutputStream(temp), StandardCharsets.UTF_8), 64 * 1024)) {
            for (String domain : domains) { bw.write(domain); bw.newLine(); }
        }
        if (target.exists() && !target.delete()) throw new IllegalStateException("Falha substituindo " + fileName);
        if (!temp.renameTo(target)) throw new IllegalStateException("Falha ativando " + fileName);
    }

    private void downloadAndParse(String source, Set<String> out) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(source).openConnection();
        c.setConnectTimeout(12_000);
        c.setReadTimeout(45_000);
        c.setInstanceFollowRedirects(true);
        c.setRequestProperty("User-Agent", "BetLockBR/2.2 Android");
        c.setRequestProperty("Accept", "text/plain,*/*");
        int code = c.getResponseCode();
        if (code < 200 || code >= 300) { c.disconnect(); throw new IllegalStateException("HTTP " + code); }
        try (InputStream in = c.getInputStream();
             BufferedReader br = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8), 64 * 1024)) {
            String line;
            while ((line = br.readLine()) != null) {
                String domain = extractDomain(line);
                if (!domain.isEmpty()) out.add(domain);
            }
        } finally { c.disconnect(); }
    }

    static String extractDomain(String line) {
        if (line == null) return "";
        String s = line.trim();
        if (s.isEmpty() || s.startsWith("#") || s.startsWith("!") || s.startsWith("[") || s.startsWith("@@")) return "";
        String[] parts = s.split("\\s+");
        if (parts.length >= 2 && (parts[0].equals("0.0.0.0") || parts[0].equals("127.0.0.1") || parts[0].equals("::"))) {
            s = parts[1];
        } else if (s.startsWith("||")) {
            s = s.substring(2);
            int cut = s.indexOf('^'); if (cut >= 0) s = s.substring(0, cut);
            cut = s.indexOf('$'); if (cut >= 0) s = s.substring(0, cut);
        } else if (s.startsWith("http://") || s.startsWith("https://")) {
            try { s = URI.create(s).getHost(); } catch (Exception ignored) { return ""; }
        } else {
            int ws = firstWhitespace(s); if (ws >= 0) s = s.substring(0, ws);
        }
        if (s == null) return "";
        if (s.startsWith("*.")) s = s.substring(2);
        int slash = s.indexOf('/'); if (slash >= 0) s = s.substring(0, slash);
        int colon = s.indexOf(':'); if (colon >= 0) s = s.substring(0, colon);
        return DomainMatcher.normalize(s);
    }

    private static int firstWhitespace(String s) {
        for (int i = 0; i < s.length(); i++) if (Character.isWhitespace(s.charAt(i))) return i;
        return -1;
    }

    void saveError(Throwable e) { prefs.edit().putString(KEY_LAST_ERROR, safeMessage(e)).apply(); }
    private static String safeMessage(Throwable e) {
        if (e == null) return "Falha desconhecida";
        String msg = e.getMessage();
        return (msg == null || msg.trim().isEmpty()) ? e.getClass().getSimpleName() : msg;
    }

    private static final class UpdateResult {
        final boolean updated; final Set<String> domains; final Exception error;
        UpdateResult(boolean updated, Set<String> domains, Exception error) {
            this.updated = updated; this.domains = domains; this.error = error;
        }
    }
}
