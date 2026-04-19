package com.marketingtool.research;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "research_runs", schema = "core")
@Getter
@Setter
@NoArgsConstructor
public class ResearchRun {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "campaign_mode", nullable = false)
    private CampaignMode campaignMode = CampaignMode.GENERAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode", nullable = false)
    private Mode mode = Mode.SCAN;

    @Column(name = "idea_description")
    private String ideaDescription;

    @Column(name = "query_text", nullable = false)
    private String queryText;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> platforms;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @Column(name = "campaign_objective_id")
    private UUID campaignObjectiveId;

    @Column(name = "goal_context_snapshot", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> goalContextSnapshot;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (campaignMode == null) campaignMode = CampaignMode.GENERAL;
        if (mode == null) mode = Mode.SCAN;
    }

    public enum Mode {
        SCAN, VALIDATE
    }

    public enum CampaignMode {
        GENERAL, CAMPAIGN
    }

    public enum Status {
        PENDING, RUNNING, PARTIAL_ANALYSIS_READY, COMPLETED, FAILED, ARCHIVED
    }
}
