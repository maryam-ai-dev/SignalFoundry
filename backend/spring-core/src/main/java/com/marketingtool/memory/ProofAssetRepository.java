package com.marketingtool.memory;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProofAssetRepository extends JpaRepository<ProofAsset, UUID> {
    List<ProofAsset> findByWorkspaceId(UUID workspaceId);
}
