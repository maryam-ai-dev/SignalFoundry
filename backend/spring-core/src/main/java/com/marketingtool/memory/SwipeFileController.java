package com.marketingtool.memory;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/swipe-file")
@RequiredArgsConstructor
public class SwipeFileController {

    private final SwipeFileEntryRepository swipeRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@RequestBody CreateSwipeRequest req) {
        SwipeFileEntry entry = new SwipeFileEntry();
        entry.setWorkspaceId(req.workspaceId());
        entry.setType(req.type());
        entry.setContent(req.content());
        entry.setTags(req.tags());
        entry.setPlatform(req.platform());
        entry.setSourceRunId(req.sourceRunId());
        entry.setCampaignObjectiveId(req.campaignObjectiveId());
        entry = swipeRepository.save(entry);
        return toMap(entry);
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam UUID workspaceId,
                                           @RequestParam(required = false) String type,
                                           @RequestParam(required = false) String tag,
                                           @RequestParam(required = false) UUID campaignObjectiveId) {
        List<SwipeFileEntry> entries = (type != null && !type.isBlank())
                ? swipeRepository.findByWorkspaceIdAndTypeAndArchivedFalse(workspaceId, type)
                : swipeRepository.findByWorkspaceIdAndArchivedFalse(workspaceId);

        if (tag != null && !tag.isBlank()) {
            entries = entries.stream()
                    .filter(e -> e.getTags() != null && e.getTags().contains(tag))
                    .toList();
        }
        if (campaignObjectiveId != null) {
            entries = entries.stream()
                    .filter(e -> campaignObjectiveId.equals(e.getCampaignObjectiveId()))
                    .toList();
        }

        return entries.stream().map(this::toMap).toList();
    }

    @PostMapping("/{id}/archive")
    public Map<String, Object> archive(@PathVariable UUID id) {
        SwipeFileEntry entry = swipeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Swipe entry not found: " + id));
        entry.setArchived(true);
        entry = swipeRepository.save(entry);
        return toMap(entry);
    }

    private Map<String, Object> toMap(SwipeFileEntry e) {
        var map = new java.util.HashMap<String, Object>();
        map.put("id", e.getId());
        map.put("workspaceId", e.getWorkspaceId());
        map.put("type", e.getType());
        map.put("content", e.getContent() != null ? e.getContent() : Map.of());
        map.put("tags", e.getTags() != null ? e.getTags() : List.of());
        map.put("platform", e.getPlatform());
        map.put("sourceRunId", e.getSourceRunId());
        map.put("campaignObjectiveId", e.getCampaignObjectiveId());
        map.put("saved", e.isSaved());
        map.put("archived", e.isArchived());
        map.put("createdAt", e.getCreatedAt().toString());
        return map;
    }

    public record CreateSwipeRequest(
        UUID workspaceId, String type, Map<String, Object> content,
        List<String> tags, String platform, UUID sourceRunId, UUID campaignObjectiveId
    ) {}
}
