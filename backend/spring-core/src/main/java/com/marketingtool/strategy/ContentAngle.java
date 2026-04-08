package com.marketingtool.strategy;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "content_angles", schema = "core")
@Getter
@Setter
@NoArgsConstructor
public class ContentAngle {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "run_id", nullable = false)
    private UUID runId;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(name = "angle_type")
    private String angleType;

    @Column(nullable = false)
    private double confidence = 0.0;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> content;

    @Column(name = "intent_type")
    private String intentType;

    @Column(name = "campaign_objective_id")
    private UUID campaignObjectiveId;

    @Column(name = "goal_fit_score")
    private Double goalFitScore;

    @Column(name = "cta_type")
    private String ctaType;

    @Column(nullable = false)
    private boolean saved = false;

    @Column(nullable = false)
    private boolean archived = false;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
