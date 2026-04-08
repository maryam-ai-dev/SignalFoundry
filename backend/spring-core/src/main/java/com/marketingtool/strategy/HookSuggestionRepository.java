package com.marketingtool.strategy;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface HookSuggestionRepository extends JpaRepository<HookSuggestion, UUID> {
    List<HookSuggestion> findByRunIdAndArchivedFalse(UUID runId);
    List<HookSuggestion> findByWorkspaceIdAndSavedTrue(UUID workspaceId);
}
