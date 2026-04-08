package com.marketingtool.memory;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/proof-assets")
@RequiredArgsConstructor
public class ProofAssetController {

    private final ProofAssetRepository proofRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@RequestBody ProofAsset asset) {
        asset = proofRepository.save(asset);
        return toMap(asset);
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam UUID workspaceId) {
        return proofRepository.findByWorkspaceId(workspaceId)
                .stream().map(this::toMap).toList();
    }

    private Map<String, Object> toMap(ProofAsset p) {
        return Map.of(
                "id", p.getId(),
                "workspaceId", p.getWorkspaceId(),
                "title", p.getTitle(),
                "content", p.getContent() != null ? p.getContent() : "",
                "type", p.getType(),
                "tags", p.getTags() != null ? p.getTags() : List.of(),
                "createdAt", p.getCreatedAt().toString()
        );
    }
}
