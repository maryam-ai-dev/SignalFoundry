package com.marketingtool.research;

import com.marketingtool.shared.config.FastApiClient;
import com.marketingtool.workspace.Workspace;
import com.marketingtool.workspace.WorkspaceRepository;
import com.marketingtool.workflow.JobRun;
import com.marketingtool.workflow.JobRunService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResearchRunOrchestrator {

    private final ResearchRunService researchRunService;
    private final JobRunService jobRunService;
    private final FastApiClient fastApiClient;
    private final WorkspaceRepository workspaceRepository;

    @Transactional
    public ResearchRun startScan(UUID workspaceId, String queryText, List<String> platforms,
                                  ResearchRun.Mode mode, Map<String, Object> goalContext) {
        // 1. Create ResearchRun (PENDING)
        ResearchRun run = researchRunService.create(workspaceId, queryText, platforms, mode);
        if (goalContext != null) {
            run.setGoalContextSnapshot(goalContext);
        }

        // 2. Create JobRun (QUEUED)
        Map<String, Object> payload = new HashMap<>();
        payload.put("workspace_id", workspaceId.toString());
        payload.put("query_text", queryText);
        payload.put("platforms", platforms);
        payload.put("mode", mode.name());
        payload.put("research_run_id", run.getId().toString());
        if (goalContext != null) {
            payload.put("goal_context", goalContext);
        }

        // Include workspace product context for analysis engines
        workspaceRepository.findById(workspaceId).ifPresent(ws -> {
            Map<String, Object> ctx = new HashMap<>();
            ctx.put("productName", ws.getProductName() != null ? ws.getProductName() : "");
            ctx.put("productDescription", ws.getProductDescription() != null ? ws.getProductDescription() : "");
            ctx.put("keyThemes", ws.getKeyThemes() != null ? ws.getKeyThemes() : List.of());
            payload.put("product_context", ctx);
        });

        JobRun job = jobRunService.createJob("RESEARCH_SCAN", payload, run.getId());
        payload.put("job_id", job.getId().toString());

        // 3. Enqueue via FastAPI → celeryTaskId
        String celeryTaskId = fastApiClient.enqueueJob("RESEARCH_SCAN", payload);

        // 4. Mark JobRun RUNNING with celeryTaskId
        jobRunService.markRunning(job.getId(), celeryTaskId);

        // 5. Mark ResearchRun RUNNING
        run = researchRunService.markRunning(run.getId());

        return run;
    }
}
