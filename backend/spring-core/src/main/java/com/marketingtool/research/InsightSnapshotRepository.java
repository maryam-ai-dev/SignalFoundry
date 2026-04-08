package com.marketingtool.research;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InsightSnapshotRepository extends JpaRepository<InsightSnapshot, UUID> {
    List<InsightSnapshot> findByRunId(UUID runId);
    List<InsightSnapshot> findByRunIdAndType(UUID runId, String type);
}
