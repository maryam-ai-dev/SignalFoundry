package com.marketingtool.account;

public enum DigestDay {
    MON, TUE, WED, THU, FRI, SAT, SUN;

    public static DigestDay parse(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("digestDay is required");
        }
        try {
            return DigestDay.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid digestDay: must be one of MON, TUE, WED, THU, FRI, SAT, SUN");
        }
    }
}
