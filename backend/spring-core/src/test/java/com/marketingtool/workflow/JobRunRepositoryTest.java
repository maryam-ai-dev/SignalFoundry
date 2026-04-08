package com.marketingtool.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class JobRunRepositoryTest {

    @Autowired
    private JobRunRepository jobRunRepository;

    @Test
    void saveWithPayload_reload_payloadIntact() {
        JobRun job = new JobRun();
        job.setType("RESEARCH_SCAN");
        job.setPayload(Map.of(
                "workspaceId", "abc-123",
                "platforms", java.util.List.of("reddit", "youtube")
        ));
        job = jobRunRepository.save(job);
        jobRunRepository.flush();

        Optional<JobRun> found = jobRunRepository.findById(job.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getStatus()).isEqualTo(JobRun.Status.QUEUED);
        assertThat(found.get().getPayload()).containsEntry("workspaceId", "abc-123");
        assertThat(found.get().getCeleryTaskId()).isNull();
        assertThat(found.get().getAttempts()).isEqualTo(0);
        assertThat(found.get().getMaxAttempts()).isEqualTo(3);
        assertThat(found.get().getCreatedAt()).isNotNull();
        assertThat(found.get().getUpdatedAt()).isNotNull();
    }
}
