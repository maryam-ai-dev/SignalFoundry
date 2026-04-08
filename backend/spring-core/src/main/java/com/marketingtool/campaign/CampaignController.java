package com.marketingtool.campaign;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;
    private final CampaignObjectiveRepository campaignRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@RequestParam UUID workspaceId,
                                       @RequestBody CampaignObjective campaign) {
        return toMap(campaignService.create(workspaceId, campaign));
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam UUID workspaceId) {
        return campaignRepository.findByWorkspaceId(workspaceId)
                .stream().map(this::toMap).toList();
    }

    @GetMapping("/{id}")
    public Map<String, Object> getById(@PathVariable UUID id) {
        return toMap(campaignRepository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Campaign not found: " + id)));
    }

    @PostMapping("/{id}/activate")
    public Map<String, Object> activate(@PathVariable UUID id, @RequestParam UUID workspaceId) {
        return toMap(campaignService.activate(id, workspaceId));
    }

    @PostMapping("/{id}/pause")
    public Map<String, Object> pause(@PathVariable UUID id) {
        return toMap(campaignService.pause(id));
    }

    private Map<String, Object> toMap(CampaignObjective c) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", c.getId());
        map.put("workspaceId", c.getWorkspaceId());
        map.put("name", c.getName());
        map.put("goalType", c.getGoalType().name());
        map.put("status", c.getStatus().name());
        map.put("targetAudience", c.getTargetAudience() != null ? c.getTargetAudience() : "");
        map.put("desiredAction", c.getDesiredAction() != null ? c.getDesiredAction() : "");
        map.put("ctaStyle", c.getCtaStyle() != null ? c.getCtaStyle() : "");
        map.put("toneGuidance", c.getToneGuidance() != null ? c.getToneGuidance() : "");
        map.put("timeWindowDays", c.getTimeWindowDays());
        map.put("createdAt", c.getCreatedAt().toString());
        return map;
    }
}
