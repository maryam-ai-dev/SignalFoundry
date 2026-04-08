package com.marketingtool.workspace;

import com.marketingtool.shared.security.CurrentUser;
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
    private final PersonalizationService personalizationService;

    @GetMapping("/personalization")
    public Map<String, Object> getPersonalization(@RequestParam UUID workspaceId) {
        PersonalStrategyProfile profile = personalizationService.getProfile(workspaceId);
        if (profile == null) {
            return Map.of("message", "No personalization data yet");
        }
        return Map.of(
                "workspaceId", profile.getWorkspaceId(),
                "preferredAngleTypes", profile.getPreferredAngleTypes() != null ? profile.getPreferredAngleTypes() : Map.of(),
                "preferredHookFormats", profile.getPreferredHookFormats() != null ? profile.getPreferredHookFormats() : Map.of(),
                "preferredCommentTones", profile.getPreferredCommentTones() != null ? profile.getPreferredCommentTones() : Map.of(),
                "totalDecisions", profile.getTotalDecisions()
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@RequestBody CreateWorkspaceRequest req,
                                      @CurrentUser UUID userId) {
        Workspace ws = workspaceService.create(
                req.name(), req.productName(), req.productDescription(),
                req.keyThemes(), userId);
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
        List<String> keyThemes
    ) {}
}
