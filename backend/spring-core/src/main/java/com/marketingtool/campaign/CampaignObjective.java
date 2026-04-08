package com.marketingtool.campaign;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "campaigns", schema = "core")
@Getter
@Setter
@NoArgsConstructor
public class CampaignObjective {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "goal_type", nullable = false)
    private GoalType goalType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PAUSED;

    @Column(name = "target_audience")
    private String targetAudience;

    @Column(name = "desired_action")
    private String desiredAction;

    @Column(name = "offer_type")
    private String offerType;

    @Column(name = "cta_style")
    private String ctaStyle;

    @Column(name = "tone_guidance")
    private String toneGuidance;

    @Column(name = "success_metric")
    private String successMetric;

    @Column(name = "time_window_days")
    private int timeWindowDays = 30;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }

    public enum GoalType {
        BETA_USER_ACQUISITION, WAITLIST_GROWTH, AWARENESS,
        CREATOR_RECRUITMENT, OBJECTION_TESTING, FEATURE_VALIDATION
    }

    public enum Status {
        ACTIVE, PAUSED, COMPLETED
    }
}
