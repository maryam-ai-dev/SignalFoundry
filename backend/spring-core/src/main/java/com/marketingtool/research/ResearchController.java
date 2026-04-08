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
        ResearchRun.Mode mode = req.mode() != null
                ? ResearchRun.Mode.valueOf(req.mode())
                : ResearchRun.Mode.GENERAL;

        ResearchRun run = orchestrator.startScan(
                req.workspaceId(), req.queryText(), req.platforms(),
                mode, req.goalContext());

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

    private Map<String, Object> runToMap(ResearchRun r) {
        return Map.of(
                "runId", r.getId(),
                "workspaceId", r.getWorkspaceId(),
                "status", r.getStatus().name(),
                "mode", r.getMode().name(),
                "queryText", r.getQueryText(),
                "platforms", r.getPlatforms() != null ? r.getPlatforms() : List.of(),
                "createdAt", r.getCreatedAt().toString()
        );
    }

    public record StartScanRequest(
        UUID workspaceId,
        String queryText,
        List<String> platforms,
        String mode,
        Map<String, Object> goalContext
    ) {}
}
