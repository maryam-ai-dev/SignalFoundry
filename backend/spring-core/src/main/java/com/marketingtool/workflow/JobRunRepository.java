package com.marketingtool.workflow;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JobRunRepository extends JpaRepository<JobRun, UUID> {
    List<JobRun> findByResearchRunId(UUID researchRunId);
}
