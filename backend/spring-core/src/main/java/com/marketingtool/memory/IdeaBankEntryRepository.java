package com.marketingtool.memory;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface IdeaBankEntryRepository extends JpaRepository<IdeaBankEntry, UUID> {
    List<IdeaBankEntry> findByWorkspaceIdAndStatus(UUID workspaceId, IdeaBankEntry.Status status);
    List<IdeaBankEntry> findByWorkspaceId(UUID workspaceId);
}
