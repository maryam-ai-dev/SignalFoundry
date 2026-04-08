package com.marketingtool.research;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/insights")
@RequiredArgsConstructor
public class InsightController {

    private final InsightSnapshotRepository insightRepository;

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam UUID runId,
                                           @RequestParam(required = false) String type) {
        List<InsightSnapshot> snapshots = (type != null && !type.isBlank())
                ? insightRepository.findByRunIdAndType(runId, type)
                : insightRepository.findByRunId(runId);

        return snapshots.stream().map(this::toMap).toList();
    }

    private Map<String, Object> toMap(InsightSnapshot s) {
        return Map.of(
                "id", s.getId(),
                "runId", s.getRunId(),
                "type", s.getType(),
                "payload", s.getPayload() != null ? s.getPayload() : Map.of(),
                "confidence", s.getConfidence(),
                "createdAt", s.getCreatedAt().toString()
        );
    }
}
