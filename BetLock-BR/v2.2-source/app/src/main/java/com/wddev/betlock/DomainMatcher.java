package com.wddev.betlock;

import java.net.IDN;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;

final class DomainMatcher {
    private final AtomicReference<Set<String>> domains =
            new AtomicReference<>(Collections.emptySet());

    void replace(Set<String> newDomains) {
        domains.set(Collections.unmodifiableSet(new HashSet<>(newDomains)));
    }

    int size() {
        return domains.get().size();
    }

    boolean isBlocked(String host) {
        String normalized = normalize(host);
        if (normalized.isEmpty()) return false;
        Set<String> current = domains.get();
        String candidate = normalized;
        while (true) {
            if (current.contains(candidate)) return true;
            int dot = candidate.indexOf('.');
            if (dot < 0) return false;
            candidate = candidate.substring(dot + 1);
        }
    }

    static String normalize(String raw) {
        if (raw == null) return "";
        String s = raw.trim().toLowerCase(Locale.ROOT);
        while (s.startsWith(".")) s = s.substring(1);
        while (s.endsWith(".")) s = s.substring(0, s.length() - 1);
        if (s.isEmpty() || s.length() > 253 || !s.contains(".")) return "";
        try {
            s = IDN.toASCII(s);
        } catch (IllegalArgumentException ignored) {
            return "";
        }
        if (!s.matches("[a-z0-9._-]+")) return "";
        return s;
    }
}
