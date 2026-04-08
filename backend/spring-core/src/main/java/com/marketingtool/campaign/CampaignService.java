package com.marketingtool.campaign;

import com.marketingtool.research.InvalidStateException;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CampaignService {

    private final CampaignObjectiveRepository campaignRepository;

    @Transactional
    public CampaignObjective create(UUID workspaceId, CampaignObjective campaign) {
        campaign.setWorkspaceId(workspaceId);
        campaign.setStatus(CampaignObjective.Status.PAUSED);
        return campaignRepository.save(campaign);
    }

    @Transactional
    public CampaignObjective activate(UUID campaignId, UUID workspaceId) {
        // Pause any currently active campaign for this workspace
        campaignRepository.findByWorkspaceIdAndStatus(workspaceId, CampaignObjective.Status.ACTIVE)
                .ifPresent(active -> {
                    active.setStatus(CampaignObjective.Status.PAUSED);
                    campaignRepository.save(active);
                });

        CampaignObjective campaign = findById(campaignId);
        campaign.setStatus(CampaignObjective.Status.ACTIVE);
        return campaignRepository.save(campaign);
    }

    @Transactional
    public CampaignObjective pause(UUID campaignId) {
        CampaignObjective campaign = findById(campaignId);
        if (campaign.getStatus() != CampaignObjective.Status.ACTIVE) {
            throw new InvalidStateException("Cannot pause campaign — not currently ACTIVE");
        }
        campaign.setStatus(CampaignObjective.Status.PAUSED);
        return campaignRepository.save(campaign);
    }

    @Transactional(readOnly = true)
    public CampaignObjective getActiveCampaign(UUID workspaceId) {
        return campaignRepository.findByWorkspaceIdAndStatus(workspaceId, CampaignObjective.Status.ACTIVE)
                .orElse(null);
    }

    private CampaignObjective findById(UUID id) {
        return campaignRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Campaign not found: " + id));
    }
}
