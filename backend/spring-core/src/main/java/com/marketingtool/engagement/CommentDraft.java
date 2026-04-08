package com.marketingtool.engagement;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "comment_drafts", schema = "core")
@Getter
@Setter
@NoArgsConstructor
public class CommentDraft {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "opportunity_id", nullable = false)
    private UUID opportunityId;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(name = "draft_text", nullable = false, columnDefinition = "text")
    private String draftText;

    @Column(name = "edited_text", columnDefinition = "text")
    private String editedText;

    @Column(name = "strategy_type")
    private String strategyType;

    @Column(name = "voice_match_score")
    private Double voiceMatchScore;

    @Column(name = "confidence_level")
    private String confidenceLevel;

    @Column(name = "risk_flags", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> riskFlags;

    @Column(name = "duplicate_risk")
    private double duplicateRisk = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING_REVIEW;

    @Column(name = "requires_edit")
    private boolean requiresEdit = false;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }

    public enum Status {
        PENDING_REVIEW, APPROVED, REJECTED
    }
}
