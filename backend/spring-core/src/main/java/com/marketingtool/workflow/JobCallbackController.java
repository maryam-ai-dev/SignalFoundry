package com.marketingtool.workflow;

import com.marketingtool.research.InsightPersistenceService;
import com.marketingtool.research.ResearchRunService;
import com.marketingtool.shared.dto.JobCallbackPayload;
import com.marketingtool.strategy.StrategyPersistenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/internal/jobs")
@RequiredArgsConstructor
@Slf4j
public class JobCallbackController {

    private final JobRunService jobRunService;
    private final ResearchRunService researchRunService;
    private final InsightPersistenceService insightPersistenceService;
    private final StrategyPersistenceService strategyPersistenceService;

    @PostMapping("/{jobId}/complete")
    public Map<String, Object> complete(@PathVariable UUID jobId,
                                         @RequestBody JobCallbackPayload payload) {
        JobRun job = jobRunService.findById(jobId);
        UUID researchRunId = job.getResearchRunId();

        switch (payload.stage()) {
            case "analysis" -> {
                if (researchRunId != null) {
                    insightPersistenceService.persistFromAnalysisResult(researchRunId, payload.result());
                    researchRunService.markPartialAnalysisReady(researchRunId);
                }
            }
            case "generation" -> {
                strategyPersistenceService.persist(payload.result());
                if (researchRunId != null) {
                    researchRunService.markCompleted(researchRunId);
                }
            }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Unknown stage: " + payload.stage());
        }

        if (payload.finalStage()) {
            jobRunService.markSucceeded(jobId);
        }

        log.info("Job {} callback: stage={}, finalStage={}", jobId, payload.stage(), payload.finalStage());
        return Map.of("status", "ok");
    }

    @PostMapping("/{jobId}/fail")
    public Map<String, Object> fail(@PathVariable UUID jobId,
                                     @RequestBody Map<String, String> body) {
        String error = body.getOrDefault("error", "Unknown error");
        JobRun job = jobRunService.markFailed(jobId, error);

        if (job.getResearchRunId() != null) {
            researchRunService.markFailed(job.getResearchRunId(), error);
        }

        log.info("Job {} failed: {}", jobId, error);
        return Map.of("status", "failed");
    }
}
