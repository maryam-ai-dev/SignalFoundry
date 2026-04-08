package com.marketingtool.workflow;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Entity
@Table(name = "scheduled_refreshes", schema = "core")
@Getter
@Setter
@NoArgsConstructor
public class ScheduledRefresh {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(name = "target_type", nullable = false)
    private String targetType;

    @Column(name = "target_id", nullable = false)
    private UUID targetId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Cadence cadence = Cadence.DAILY;

    @Column(name = "last_run_at")
    private Instant lastRunAt;

    @Column(name = "next_run_at", nullable = false)
    private Instant nextRunAt;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (nextRunAt == null) nextRunAt = Instant.now().plus(cadenceHours(), ChronoUnit.HOURS);
    }

    public long cadenceHours() {
        return cadence == Cadence.WEEKLY ? 168 : 24;
    }

    public enum Cadence {
        DAILY, WEEKLY
    }
}
