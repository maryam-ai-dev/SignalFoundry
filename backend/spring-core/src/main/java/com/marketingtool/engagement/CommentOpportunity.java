package com.marketingtool.engagement;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Entity
@Table(name = "comment_opportunities", schema = "core")
@Getter
@Setter
@NoArgsConstructor
public class CommentOpportunity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(name = "run_id")
    private UUID runId;

    @Column(name = "source_post_id", nullable = false)
    private String sourcePostId;

    @Column(nullable = false)
    private String platform;

    @Column(name = "post_summary", columnDefinition = "text")
    private String postSummary;

    @Column(name = "post_url")
    private String postUrl;

    @Column(name = "relevance_score")
    private double relevanceScore;

    @Column(name = "engagement_intent")
    private String engagementIntent;

    @Column(name = "campaign_objective_id")
    private UUID campaignObjectiveId;

    @Column(name = "goal_fit_score")
    private Double goalFitScore;

    @Column(name = "intent_type")
    private String intentType;

    @Column(name = "cta_type")
    private String ctaType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.OPEN;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (expiresAt == null) expiresAt = createdAt.plus(24, ChronoUnit.HOURS);
    }

    public enum Status {
        OPEN, DRAFT_READY, APPROVED, REJECTED, EXPIRED
    }
}
