package com.marketingtool.engagement;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommentDraftRepository extends JpaRepository<CommentDraft, UUID> {
    List<CommentDraft> findByOpportunityId(UUID opportunityId);
    List<CommentDraft> findByWorkspaceIdAndStatus(UUID workspaceId, CommentDraft.Status status);
}
