package com.marketingtool.workflow;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobRunService jobRunService;

    @GetMapping("/{id}")
    public Map<String, Object> getById(@PathVariable UUID id) {
        JobRun job = jobRunService.findById(id);
        return Map.of(
                "id", job.getId(),
                "type", job.getType(),
                "status", job.getStatus().name(),
                "celeryTaskId", job.getCeleryTaskId() != null ? job.getCeleryTaskId() : "",
                "attempts", job.getAttempts(),
                "maxAttempts", job.getMaxAttempts(),
                "createdAt", job.getCreatedAt().toString(),
                "updatedAt", job.getUpdatedAt().toString()
        );
    }
}
