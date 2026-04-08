package com.marketingtool.engagement;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommentOpportunityRepository extends JpaRepository<CommentOpportunity, UUID> {
    List<CommentOpportunity> findByWorkspaceIdAndStatus(UUID workspaceId, CommentOpportunity.Status status);
    List<CommentOpportunity> findByRunId(UUID runId);
}
