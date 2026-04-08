package com.marketingtool.shared.dto;

import java.util.List;

public final class ResearchContracts {

    private ResearchContracts() {}

    public record RunResearchScanRequest(
        String workspaceId,
        String queryText,
        List<String> platforms,
        String mode,
        GoalContext goalContext
    ) {
        public RunResearchScanRequest {
            if (mode == null) mode = "GENERAL";
        }
    }

    public record ResearchScanResult(
        String runId,
        String status,
        int normalizedPostCount,
        int normalizedCommentCount,
        List<String> errors
    ) {
        public ResearchScanResult {
            if (errors == null) errors = List.of();
        }
    }
}
