package com.marketingtool.research;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/communities")
@RequiredArgsConstructor
public class TrackedCommunityController {

    private final TrackedCommunityRepository communityRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@RequestBody CreateCommunityRequest req) {
        TrackedCommunity community = new TrackedCommunity();
        community.setWorkspaceId(req.workspaceId());
        community.setName(req.name());
        community.setPlatform(req.platform());
        community.setUrl(req.url());
        community = communityRepository.save(community);
        return toMap(community);
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam UUID workspaceId) {
        return communityRepository.findByWorkspaceIdAndActiveTrue(workspaceId)
                .stream().map(this::toMap).toList();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable UUID id) {
        TrackedCommunity community = communityRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Community not found: " + id));
        community.setActive(false);
        communityRepository.save(community);
    }

    private Map<String, Object> toMap(TrackedCommunity c) {
        return Map.of(
                "id", c.getId(),
                "workspaceId", c.getWorkspaceId(),
                "name", c.getName(),
                "platform", c.getPlatform(),
                "url", c.getUrl() != null ? c.getUrl() : "",
                "active", c.isActive(),
                "createdAt", c.getCreatedAt().toString()
        );
    }

    public record CreateCommunityRequest(UUID workspaceId, String name, String platform, String url) {}
}
