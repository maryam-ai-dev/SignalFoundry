package com.marketingtool.research;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/topics")
@RequiredArgsConstructor
public class TrackedTopicController {

    private final TrackedTopicRepository topicRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@RequestBody CreateTopicRequest req) {
        TrackedTopic topic = new TrackedTopic();
        topic.setWorkspaceId(req.workspaceId());
        topic.setKeyword(req.keyword());
        topic.setPlatforms(req.platforms());
        topic = topicRepository.save(topic);
        return toMap(topic);
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam UUID workspaceId) {
        return topicRepository.findByWorkspaceIdAndActiveTrue(workspaceId)
                .stream().map(this::toMap).toList();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable UUID id) {
        TrackedTopic topic = topicRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Topic not found: " + id));
        topic.setActive(false);
        topicRepository.save(topic);
    }

    private Map<String, Object> toMap(TrackedTopic t) {
        return Map.of(
                "id", t.getId(),
                "workspaceId", t.getWorkspaceId(),
                "keyword", t.getKeyword(),
                "platforms", t.getPlatforms() != null ? t.getPlatforms() : List.of(),
                "active", t.isActive(),
                "createdAt", t.getCreatedAt().toString()
        );
    }

    public record CreateTopicRequest(UUID workspaceId, String keyword, List<String> platforms) {}
}
