package com.marketingtool.research;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TrackedCompetitorRepository extends JpaRepository<TrackedCompetitor, UUID> {
    List<TrackedCompetitor> findByWorkspaceIdAndActiveTrue(UUID workspaceId);
}
