package com.marketingtool.research;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResearchRunOrchestrator {

    private final ResearchRunService researchRunService;

    /**
     * Creates a ResearchRun and immediately marks it RUNNING.
     * In a later sprint this will also enqueue a Celery job via FastAPI.
     */
    @Transactional
    public ResearchRun startScan(UUID workspaceId, String queryText, List<String> platforms,
                                  ResearchRun.Mode mode, Map<String, Object> goalContext) {
        ResearchRun run = researchRunService.create(workspaceId, queryText, platforms, mode);
        if (goalContext != null) {
            run.setGoalContextSnapshot(goalContext);
        }
        run = researchRunService.markRunning(run.getId());
        // TODO: enqueue Celery job via FastApiClient (Sprint 3.9+)
        return run;
    }
}
