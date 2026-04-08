package com.marketingtool.memory;

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
@Table(name = "swipe_file_entries", schema = "core")
@Getter
@Setter
@NoArgsConstructor
public class SwipeFileEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(nullable = false)
    private String type;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> content;

    @Column(name = "campaign_objective_id")
    private UUID campaignObjectiveId;

    @Column(name = "tags", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private java.util.List<String> tags;

    private String platform;

    @Column(name = "source_run_id")
    private UUID sourceRunId;

    @Column(nullable = false)
    private boolean saved = true;

    @Column(nullable = false)
    private boolean archived = false;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
