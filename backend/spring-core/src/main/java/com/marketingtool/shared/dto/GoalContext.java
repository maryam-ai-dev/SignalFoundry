package com.marketingtool.shared.dto;

public record GoalContext(
    String goalType,
    String targetAudience,
    String desiredAction,
    String ctaStyle,
    String toneGuidance
) {}
