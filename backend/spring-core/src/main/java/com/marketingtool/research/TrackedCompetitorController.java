package com.marketingtool.research;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/competitors")
@RequiredArgsConstructor
public class TrackedCompetitorController {

    private final TrackedCompetitorRepository competitorRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@RequestBody CreateCompetitorRequest req) {
        TrackedCompetitor comp = new TrackedCompetitor();
        comp.setWorkspaceId(req.workspaceId());
        comp.setHandle(req.handle());
        comp.setPlatform(req.platform());
        comp = competitorRepository.save(comp);
        return toMap(comp);
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam UUID workspaceId) {
        return competitorRepository.findByWorkspaceIdAndActiveTrue(workspaceId)
                .stream().map(this::toMap).toList();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable UUID id) {
        TrackedCompetitor comp = competitorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Competitor not found: " + id));
        comp.setActive(false);
        competitorRepository.save(comp);
    }

    private Map<String, Object> toMap(TrackedCompetitor c) {
        return Map.of(
                "id", c.getId(),
                "workspaceId", c.getWorkspaceId(),
                "handle", c.getHandle(),
                "platform", c.getPlatform(),
                "active", c.isActive(),
                "createdAt", c.getCreatedAt().toString()
        );
    }

    public record CreateCompetitorRequest(UUID workspaceId, String handle, String platform) {}
}
