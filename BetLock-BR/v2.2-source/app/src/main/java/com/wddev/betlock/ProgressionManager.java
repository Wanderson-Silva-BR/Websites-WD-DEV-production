package com.wddev.betlock;

final class ProgressionManager {
    static final class Snapshot {
        final long hours;
        final long days;
        final long xp;
        final int level;
        final String title;
        final String equipment;
        Snapshot(long hours, long days, long xp, int level, String title, String equipment) {
            this.hours = hours; this.days = days; this.xp = xp; this.level = level;
            this.title = title; this.equipment = equipment;
        }
    }

    static Snapshot fromProtectedMillis(long ms) {
        long hours = ms / 3_600_000L;
        long days = ms / 86_400_000L;
        long xp = hours * 10L + days * 100L;
        int level = 1 + (int)Math.floor(Math.sqrt(xp / 100.0));
        String title;
        if (level >= 10) title = "Sentinela";
        else if (level >= 7) title = "Guardião";
        else if (level >= 4) title = "Vigilante";
        else title = "Recruta";
        String equipment;
        if (level >= 10) equipment = "Escudo Ônix";
        else if (level >= 7) equipment = "Armadura Digital";
        else if (level >= 4) equipment = "Elmo de Proteção";
        else if (level >= 2) equipment = "Bracelete de Foco";
        else equipment = "Escudo inicial";
        return new Snapshot(hours, days, xp, level, title, equipment);
    }

    private ProgressionManager() {}
}
