package com.marketingtool.memory;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/idea-bank")
@RequiredArgsConstructor
public class IdeaBankController {

    private final IdeaBankEntryRepository ideaRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@RequestBody IdeaBankEntry entry) {
        entry = ideaRepository.save(entry);
        return toMap(entry);
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam UUID workspaceId) {
        return ideaRepository.findByWorkspaceIdAndStatus(workspaceId, IdeaBankEntry.Status.ACTIVE)
                .stream().map(this::toMap).toList();
    }

    private Map<String, Object> toMap(IdeaBankEntry e) {
        return Map.of(
                "id", e.getId(),
                "workspaceId", e.getWorkspaceId(),
                "idea", e.getIdea(),
                "angleType", e.getAngleType() != null ? e.getAngleType() : "",
                "status", e.getStatus().name(),
                "createdAt", e.getCreatedAt().toString()
        );
    }
}
