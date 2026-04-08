package com.marketingtool.campaign;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CampaignObjectiveRepository extends JpaRepository<CampaignObjective, UUID> {
    Optional<CampaignObjective> findByWorkspaceIdAndStatus(UUID workspaceId, CampaignObjective.Status status);
    List<CampaignObjective> findByWorkspaceId(UUID workspaceId);
}
