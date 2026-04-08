package com.marketingtool.workflow;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JobRunService {

    private final JobRunRepository jobRunRepository;

    @Transactional
    public JobRun createJob(String type, Map<String, Object> payload, UUID researchRunId) {
        JobRun job = new JobRun();
        job.setType(type);
        job.setPayload(payload);
        job.setResearchRunId(researchRunId);
        job.setStatus(JobRun.Status.QUEUED);
        return jobRunRepository.save(job);
    }

    @Transactional
    public JobRun markRunning(UUID jobId, String celeryTaskId) {
        JobRun job = findById(jobId);
        job.setStatus(JobRun.Status.RUNNING);
        job.setCeleryTaskId(celeryTaskId);
        return jobRunRepository.save(job);
    }

    @Transactional
    public JobRun markSucceeded(UUID jobId) {
        JobRun job = findById(jobId);
        job.setStatus(JobRun.Status.SUCCEEDED);
        job.setCompletedAt(Instant.now());
        return jobRunRepository.save(job);
    }

    @Transactional
    public JobRun markFailed(UUID jobId, String error) {
        JobRun job = findById(jobId);
        job.setAttempts(job.getAttempts() + 1);
        job.setErrorDetails(error);
        if (job.getAttempts() >= job.getMaxAttempts()) {
            job.setStatus(JobRun.Status.DEAD);
            job.setCompletedAt(Instant.now());
        } else {
            job.setStatus(JobRun.Status.FAILED);
        }
        return jobRunRepository.save(job);
    }

    @Transactional(readOnly = true)
    public JobRun findById(UUID id) {
        return jobRunRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("JobRun not found: " + id));
    }
}
