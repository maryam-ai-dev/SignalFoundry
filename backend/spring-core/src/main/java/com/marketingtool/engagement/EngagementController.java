package com.marketingtool.engagement;

import com.marketingtool.shared.config.FastApiClient;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/engagement")
@RequiredArgsConstructor
public class EngagementController {

    private final CommentOpportunityRepository opportunityRepository;
    private final CommentDraftRepository draftRepository;
    private final EngagementService engagementService;

    @GetMapping("/opportunities")
    public List<Map<String, Object>> listOpportunities(
            @RequestParam UUID workspaceId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String platform) {

        List<CommentOpportunity> opportunities;
        if (status != null && !status.isBlank()) {
            opportunities = opportunityRepository.findByWorkspaceIdAndStatus(
                    workspaceId, CommentOpportunity.Status.valueOf(status));
        } else {
            opportunities = opportunityRepository.findByWorkspaceIdAndStatus(
                    workspaceId, CommentOpportunity.Status.OPEN);
        }

        if (platform != null && !platform.isBlank()) {
            opportunities = opportunities.stream()
                    .filter(o -> platform.equalsIgnoreCase(o.getPlatform()))
                    .toList();
        }

        return opportunities.stream().map(this::oppToMap).toList();
    }

    @GetMapping("/drafts")
    public List<Map<String, Object>> listDrafts(@RequestParam UUID opportunityId) {
        return draftRepository.findByOpportunityId(opportunityId)
                .stream().map(this::draftToMap).toList();
    }

    @PostMapping("/opportunities/{id}/generate-draft")
    @ResponseStatus(HttpStatus.CREATED)
    public List<Map<String, Object>> generateDraft(@PathVariable UUID id) {
        CommentOpportunity opp = opportunityRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Opportunity not found: " + id));

        // Create 3 stub drafts (real generation via FastAPI wired later)
        List<Map<String, String>> strategies = List.of(
                Map.of("type", "INSIGHTFUL", "text", "Stub insightful draft for: " + opp.getPostSummary()),
                Map.of("type", "EMPATHETIC", "text", "Stub empathetic draft for: " + opp.getPostSummary()),
                Map.of("type", "FOUNDER_PERSPECTIVE", "text", "Stub founder draft for: " + opp.getPostSummary())
        );

        List<CommentDraft> drafts = strategies.stream().map(s -> {
            CommentDraft draft = new CommentDraft();
            draft.setOpportunityId(opp.getId());
            draft.setWorkspaceId(opp.getWorkspaceId());
            draft.setDraftText(s.get("text"));
            draft.setStrategyType(s.get("type"));
            draft.setRiskFlags(List.of());
            return draftRepository.save(draft);
        }).toList();

        return drafts.stream().map(this::draftToMap).toList();
    }

    @PostMapping("/drafts/{id}/approve")
    public Map<String, Object> approveDraft(@PathVariable UUID id) {
        return draftToMap(engagementService.approveDraft(id));
    }

    @PostMapping("/drafts/{id}/reject")
    public Map<String, Object> rejectDraft(@PathVariable UUID id) {
        return draftToMap(engagementService.rejectDraft(id));
    }

    @PutMapping("/drafts/{id}/edit")
    public Map<String, Object> editDraft(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        String editedText = body.getOrDefault("editedText", "");
        return draftToMap(engagementService.editDraft(id, editedText));
    }

    private Map<String, Object> oppToMap(CommentOpportunity o) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", o.getId());
        map.put("workspaceId", o.getWorkspaceId());
        map.put("platform", o.getPlatform());
        map.put("sourcePostId", o.getSourcePostId());
        map.put("postSummary", o.getPostSummary() != null ? o.getPostSummary() : "");
        map.put("postUrl", o.getPostUrl() != null ? o.getPostUrl() : "");
        map.put("relevanceScore", o.getRelevanceScore());
        map.put("engagementIntent", o.getEngagementIntent() != null ? o.getEngagementIntent() : "");
        map.put("status", o.getStatus().name());
        map.put("expiresAt", o.getExpiresAt().toString());
        map.put("createdAt", o.getCreatedAt().toString());
        return map;
    }

    private Map<String, Object> draftToMap(CommentDraft d) {
        return Map.of(
                "id", d.getId(),
                "opportunityId", d.getOpportunityId(),
                "draftText", d.getDraftText(),
                "editedText", d.getEditedText() != null ? d.getEditedText() : "",
                "strategyType", d.getStrategyType() != null ? d.getStrategyType() : "",
                "status", d.getStatus().name(),
                "requiresEdit", d.isRequiresEdit(),
                "riskFlags", d.getRiskFlags() != null ? d.getRiskFlags() : List.of(),
                "duplicateRisk", d.getDuplicateRisk(),
                "createdAt", d.getCreatedAt().toString()
        );
    }
}
