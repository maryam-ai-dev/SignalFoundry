package com.marketingtool.workspace;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@RequestBody CreateWorkspaceRequest req) {
        // Temporarily use a hardcoded userId until auth is wired in Sprint 2.5+
        UUID tempUserId = req.userId();
        Workspace ws = workspaceService.create(
                req.name(), req.productName(), req.productDescription(),
                req.keyThemes(), tempUserId);
        return workspaceToMap(ws);
    }

    @GetMapping("/{id}")
    public Map<String, Object> getById(@PathVariable UUID id) {
        Workspace ws = workspaceService.getById(id);
        return workspaceToMap(ws);
    }

    @PutMapping("/{id}/settings")
    public Map<String, Object> updateSettings(@PathVariable UUID id,
                                               @RequestBody WorkspaceService.UpdateSettingsRequest req) {
        WorkspaceSettings settings = workspaceService.updateSettings(id, req);
        return settingsToMap(settings);
    }

    private Map<String, Object> workspaceToMap(Workspace ws) {
        return Map.of(
                "id", ws.getId(),
                "name", ws.getName(),
                "productName", ws.getProductName() != null ? ws.getProductName() : "",
                "productDescription", ws.getProductDescription() != null ? ws.getProductDescription() : "",
                "keyThemes", ws.getKeyThemes() != null ? ws.getKeyThemes() : List.of(),
                "createdAt", ws.getCreatedAt().toString()
        );
    }

    private Map<String, Object> settingsToMap(WorkspaceSettings s) {
        return Map.of(
                "workspaceId", s.getWorkspaceId(),
                "allowDirectCta", s.isAllowDirectCta(),
                "maxPromotionalIntensity", s.getMaxPromotionalIntensity(),
                "bannedPhrases", s.getBannedPhrases() != null ? s.getBannedPhrases() : List.of(),
                "toneConstraints", s.getToneConstraints() != null ? s.getToneConstraints() : List.of()
        );
    }

    public record CreateWorkspaceRequest(
        String name,
        String productName,
        String productDescription,
        List<String> keyThemes,
        UUID userId
    ) {}
}
