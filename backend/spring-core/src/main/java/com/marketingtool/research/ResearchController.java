package com.marketingtool.research;

import com.marketingtool.shared.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/research/runs")
@RequiredArgsConstructor
public class ResearchController {

    private final ResearchRunOrchestrator orchestrator;
    private final ResearchRunRepository runRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> startScan(@RequestBody StartScanRequest req,
                                          @CurrentUser UUID userId) {
        String queryText = req.niche() != null ? req.niche() : req.queryText();
        if (queryText == null || queryText.isBlank()) {
            throw new IllegalArgumentException("niche (or queryText) is required");
        }

        ResearchRun.Mode mode = parseMode(req.mode());
        ResearchRun.CampaignMode campaignMode = parseCampaignMode(req.campaignMode());

        if (mode == ResearchRun.Mode.VALIDATE
                && (req.ideaDescription() == null || req.ideaDescription().isBlank())) {
            throw new IllegalArgumentException("ideaDescription is required when mode=VALIDATE");
        }

        ResearchRun run = orchestrator.startScan(
                req.workspaceId(), queryText, req.platforms(),
                campaignMode, mode, req.ideaDescription(), req.goalContext());

        return runToMap(run);
    }

    @GetMapping("/{id}")
    public Map<String, Object> getById(@PathVariable UUID id) {
        ResearchRun run = runRepository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Run not found: " + id));
        return runToMap(run);
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam UUID workspaceId,
                                           @RequestParam(defaultValue = "0") int page) {
        return runRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId)
                .stream()
                .skip((long) page * 20)
                .limit(20)
                .map(this::runToMap)
                .toList();
    }

    private ResearchRun.Mode parseMode(String raw) {
        if (raw == null || raw.isBlank()) return ResearchRun.Mode.SCAN;
        try {
            return ResearchRun.Mode.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid mode: must be SCAN or VALIDATE");
        }
    }

    private ResearchRun.CampaignMode parseCampaignMode(String raw) {
        if (raw == null || raw.isBlank()) return ResearchRun.CampaignMode.GENERAL;
        try {
            return ResearchRun.CampaignMode.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid campaignMode: must be GENERAL or CAMPAIGN");
        }
    }

    private Map<String, Object> runToMap(ResearchRun r) {
        var map = new java.util.HashMap<String, Object>();
        map.put("runId", r.getId());
        map.put("workspaceId", r.getWorkspaceId());
        map.put("status", r.getStatus().name());
        map.put("mode", r.getMode().name());
        map.put("campaignMode", r.getCampaignMode().name());
        map.put("ideaDescription", r.getIdeaDescription());
        map.put("queryText", r.getQueryText());
        map.put("platforms", r.getPlatforms() != null ? r.getPlatforms() : List.of());
        map.put("campaignObjectiveId", r.getCampaignObjectiveId());
        map.put("createdAt", r.getCreatedAt().toString());
        return map;
    }

    public record StartScanRequest(
        UUID workspaceId,
        String queryText,
        String niche,
        List<String> platforms,
        String mode,
        String campaignMode,
        String ideaDescription,
        Map<String, Object> goalContext
    ) {}
}
