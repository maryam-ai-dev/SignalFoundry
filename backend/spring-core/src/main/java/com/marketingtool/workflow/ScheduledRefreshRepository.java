package com.marketingtool.workflow;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ScheduledRefreshRepository extends JpaRepository<ScheduledRefresh, UUID> {
    List<ScheduledRefresh> findByWorkspaceId(UUID workspaceId);
    List<ScheduledRefresh> findByIsActiveTrueAndNextRunAtBefore(Instant now);
}
