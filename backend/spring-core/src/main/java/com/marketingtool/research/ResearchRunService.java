package com.marketingtool.research;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResearchRunService {

    private final ResearchRunRepository runRepository;

    private static final Set<ResearchRun.Status> TERMINAL =
            Set.of(ResearchRun.Status.COMPLETED, ResearchRun.Status.FAILED, ResearchRun.Status.ARCHIVED);

    @Transactional
    public ResearchRun create(UUID workspaceId,
                              String queryText,
                              List<String> platforms,
                              ResearchRun.CampaignMode campaignMode,
                              ResearchRun.Mode mode,
                              String ideaDescription) {
        ResearchRun.Mode effectiveMode = mode != null ? mode : ResearchRun.Mode.SCAN;
        if (effectiveMode == ResearchRun.Mode.VALIDATE
                && (ideaDescription == null || ideaDescription.isBlank())) {
            throw new IllegalArgumentException("ideaDescription is required when mode=VALIDATE");
        }

        boolean duplicate = runRepository.existsByWorkspaceIdAndQueryTextAndStatusInAndCreatedAtAfter(
                workspaceId, queryText,
                List.of(ResearchRun.Status.PENDING, ResearchRun.Status.RUNNING),
                Instant.now().minus(5, ChronoUnit.MINUTES));

        if (duplicate) {
            throw new DuplicateRunException(
                    "A run for this workspace and query already exists within the last 5 minutes");
        }

        ResearchRun run = new ResearchRun();
        run.setWorkspaceId(workspaceId);
        run.setQueryText(queryText);
        run.setPlatforms(platforms);
        run.setCampaignMode(campaignMode != null ? campaignMode : ResearchRun.CampaignMode.GENERAL);
        run.setMode(effectiveMode);
        run.setIdeaDescription(ideaDescription);
        run.setStatus(ResearchRun.Status.PENDING);
        return runRepository.save(run);
    }

    @Transactional
    public ResearchRun create(UUID workspaceId, String queryText, List<String> platforms,
                              ResearchRun.CampaignMode campaignMode) {
        return create(workspaceId, queryText, platforms, campaignMode, ResearchRun.Mode.SCAN, null);
    }

    @Transactional
    public ResearchRun markRunning(UUID id) {
        ResearchRun run = findById(id);
        assertTransition(run, ResearchRun.Status.PENDING, ResearchRun.Status.RUNNING);
        run.setStatus(ResearchRun.Status.RUNNING);
        run.setStartedAt(Instant.now());
        return runRepository.save(run);
    }

    @Transactional
    public ResearchRun markPartialAnalysisReady(UUID id) {
        ResearchRun run = findById(id);
        assertTransition(run, ResearchRun.Status.RUNNING, ResearchRun.Status.PARTIAL_ANALYSIS_READY);
        run.setStatus(ResearchRun.Status.PARTIAL_ANALYSIS_READY);
        return runRepository.save(run);
    }

    @Transactional
    public ResearchRun markCompleted(UUID id) {
        ResearchRun run = findById(id);
        assertTransition(run, ResearchRun.Status.PARTIAL_ANALYSIS_READY, ResearchRun.Status.COMPLETED);
        run.setStatus(ResearchRun.Status.COMPLETED);
        run.setCompletedAt(Instant.now());
        return runRepository.save(run);
    }

    @Transactional
    public ResearchRun markFailed(UUID id, String errorMessage) {
        ResearchRun run = findById(id);
        if (TERMINAL.contains(run.getStatus())) {
            throw new InvalidStateException(
                    "Cannot fail run in terminal state: " + run.getStatus());
        }
        run.setStatus(ResearchRun.Status.FAILED);
        run.setErrorMessage(errorMessage);
        run.setCompletedAt(Instant.now());
        return runRepository.save(run);
    }

    @Transactional(readOnly = true)
    public ResearchRun findById(UUID id) {
        return runRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ResearchRun not found: " + id));
    }

    private void assertTransition(ResearchRun run, ResearchRun.Status expected, ResearchRun.Status target) {
        if (run.getStatus() != expected) {
            throw new InvalidStateException(
                    "Cannot transition from " + run.getStatus() + " to " + target
                            + "; expected current state " + expected);
        }
    }
}
