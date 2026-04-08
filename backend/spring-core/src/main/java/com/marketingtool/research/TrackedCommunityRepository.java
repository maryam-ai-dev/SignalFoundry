package com.marketingtool.research;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TrackedCommunityRepository extends JpaRepository<TrackedCommunity, UUID> {
    List<TrackedCommunity> findByWorkspaceIdAndActiveTrue(UUID workspaceId);
}
