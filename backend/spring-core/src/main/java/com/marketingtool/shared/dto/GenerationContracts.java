package com.marketingtool.shared.dto;

import java.util.List;
import java.util.Map;

public final class GenerationContracts {

    private GenerationContracts() {}

    public record GenerateHooksRequest(
        String workspaceId,
        String topic,
        List<Map<String, Object>> painClusters,
        List<Map<String, Object>> narrativeClusters,
        GoalContext goalContext,
        String voiceProfileId
    ) {
        public GenerateHooksRequest {
            if (painClusters == null) painClusters = List.of();
            if (narrativeClusters == null) narrativeClusters = List.of();
        }
    }

    public record HookGenerationResult(
        List<Map<String, Object>> hooks
    ) {}

    public record GenerateCommentDraftRequest(
        String workspaceId,
        Map<String, Object> postContext,
        String voiceProfileId,
        GoalContext goalContext
    ) {}

    public record CommentDraftResult(
        List<Map<String, Object>> drafts
    ) {}
}
