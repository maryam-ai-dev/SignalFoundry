package com.marketingtool.memory;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SwipeFileEntryRepository extends JpaRepository<SwipeFileEntry, UUID> {
    List<SwipeFileEntry> findByWorkspaceIdAndArchivedFalse(UUID workspaceId);
    List<SwipeFileEntry> findByWorkspaceIdAndTypeAndArchivedFalse(UUID workspaceId, String type);
}
