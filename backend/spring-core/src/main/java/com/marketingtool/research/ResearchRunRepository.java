package com.marketingtool.research;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ResearchRunRepository extends JpaRepository<ResearchRun, UUID> {

    List<ResearchRun> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);

    boolean existsByWorkspaceIdAndQueryTextAndStatusInAndCreatedAtAfter(
            UUID workspaceId, String queryText, List<ResearchRun.Status> statuses, Instant after);
}
