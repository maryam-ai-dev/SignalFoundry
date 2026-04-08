package com.marketingtool.strategy;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/strategy")
@RequiredArgsConstructor
public class StrategyController {

    private final StrategyService strategyService;

    @GetMapping("/hooks")
    public List<Map<String, Object>> getHooks(@RequestParam UUID runId,
                                               @RequestParam(required = false) Boolean saved) {
        return strategyService.getHooks(runId, saved).stream().map(this::hookToMap).toList();
    }

    @GetMapping("/angles")
    public List<Map<String, Object>> getAngles(@RequestParam UUID runId,
                                                @RequestParam(required = false) Boolean saved) {
        return strategyService.getAngles(runId, saved).stream().map(this::angleToMap).toList();
    }

    @GetMapping("/positioning")
    public Map<String, Object> getPositioning(@RequestParam UUID workspaceId) {
        PositioningProfile profile = strategyService.getPositioning(workspaceId);
        if (profile == null) {
            return Map.of("message", "No positioning profile yet");
        }
        return profileToMap(profile);
    }

    private Map<String, Object> hookToMap(HookSuggestion h) {
        return Map.of(
                "id", h.getId(),
                "runId", h.getRunId(),
                "hookType", h.getHookType() != null ? h.getHookType() : "",
                "confidence", h.getConfidence(),
                "content", h.getContent() != null ? h.getContent() : Map.of(),
                "intentType", h.getIntentType() != null ? h.getIntentType() : "",
                "saved", h.isSaved(),
                "archived", h.isArchived(),
                "createdAt", h.getCreatedAt().toString()
        );
    }

    private Map<String, Object> angleToMap(ContentAngle a) {
        return Map.of(
                "id", a.getId(),
                "runId", a.getRunId(),
                "angleType", a.getAngleType() != null ? a.getAngleType() : "",
                "confidence", a.getConfidence(),
                "content", a.getContent() != null ? a.getContent() : Map.of(),
                "intentType", a.getIntentType() != null ? a.getIntentType() : "",
                "saved", a.isSaved(),
                "archived", a.isArchived(),
                "createdAt", a.getCreatedAt().toString()
        );
    }

    private Map<String, Object> profileToMap(PositioningProfile p) {
        return Map.of(
                "id", p.getId(),
                "workspaceId", p.getWorkspaceId(),
                "version", p.getVersion(),
                "content", p.getContent() != null ? p.getContent() : Map.of(),
                "createdAt", p.getCreatedAt().toString()
        );
    }
}
