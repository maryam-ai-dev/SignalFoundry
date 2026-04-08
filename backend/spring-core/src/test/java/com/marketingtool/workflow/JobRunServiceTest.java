package com.marketingtool.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
class JobRunServiceTest {

    @Autowired private JobRunService service;

    @Test
    void createJob_statusIsQueued() {
        JobRun job = service.createJob("RESEARCH_SCAN", Map.of("key", "value"), null);
        assertThat(job.getStatus()).isEqualTo(JobRun.Status.QUEUED);
        assertThat(job.getId()).isNotNull();
    }

    @Test
    void markRunning_storesCeleryTaskId() {
        JobRun job = service.createJob("RESEARCH_SCAN", Map.of(), null);
        job = service.markRunning(job.getId(), "celery-task-abc");
        assertThat(job.getStatus()).isEqualTo(JobRun.Status.RUNNING);
        assertThat(job.getCeleryTaskId()).isEqualTo("celery-task-abc");
    }

    @Test
    void markSucceeded_setsCompletedAt() {
        JobRun job = service.createJob("RESEARCH_SCAN", Map.of(), null);
        service.markRunning(job.getId(), "task-1");
        job = service.markSucceeded(job.getId());
        assertThat(job.getStatus()).isEqualTo(JobRun.Status.SUCCEEDED);
        assertThat(job.getCompletedAt()).isNotNull();
    }

    @Test
    void markFailed_attempt1of3_statusIsFailed() {
        JobRun job = service.createJob("RESEARCH_SCAN", Map.of(), null);
        service.markRunning(job.getId(), "task-1");
        job = service.markFailed(job.getId(), "timeout");
        assertThat(job.getStatus()).isEqualTo(JobRun.Status.FAILED);
        assertThat(job.getAttempts()).isEqualTo(1);
        assertThat(job.getErrorDetails()).isEqualTo("timeout");
    }

    @Test
    void markFailed_attempt3of3_statusIsDead() {
        JobRun job = service.createJob("RESEARCH_SCAN", Map.of(), null);
        service.markRunning(job.getId(), "task-1");
        service.markFailed(job.getId(), "error 1");
        service.markFailed(job.getId(), "error 2");
        job = service.markFailed(job.getId(), "error 3");
        assertThat(job.getStatus()).isEqualTo(JobRun.Status.DEAD);
        assertThat(job.getAttempts()).isEqualTo(3);
        assertThat(job.getCompletedAt()).isNotNull();
    }
}
