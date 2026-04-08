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
        entry = swipeRepository.save(entry);
        return toMap(entry);
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam UUID workspaceId,
                                           @RequestParam(required = false) String type) {
        List<SwipeFileEntry> entries = (type != null && !type.isBlank())
                ? swipeRepository.findByWorkspaceIdAndTypeAndArchivedFalse(workspaceId, type)
                : swipeRepository.findByWorkspaceIdAndArchivedFalse(workspaceId);
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
        return Map.of(
                "id", e.getId(),
                "workspaceId", e.getWorkspaceId(),
                "type", e.getType(),
                "content", e.getContent() != null ? e.getContent() : Map.of(),
                "saved", e.isSaved(),
                "archived", e.isArchived(),
                "createdAt", e.getCreatedAt().toString()
        );
    }

    public record CreateSwipeRequest(UUID workspaceId, String type, Map<String, Object> content) {}
}
