package com.marketingtool.strategy;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ContentAngleRepository extends JpaRepository<ContentAngle, UUID> {
    List<ContentAngle> findByRunIdAndArchivedFalse(UUID runId);
    List<ContentAngle> findByWorkspaceIdAndSavedTrue(UUID workspaceId);
}
