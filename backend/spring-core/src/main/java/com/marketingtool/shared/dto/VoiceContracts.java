package com.marketingtool.shared.dto;

import java.util.Map;

public final class VoiceContracts {

    private VoiceContracts() {}

    public record AnalyzeVoiceSampleRequest(
        String workspaceId,
        String sampleType,
        String content,
        String filePath
    ) {}

    public record VoiceSampleAnalysisResult(
        Map<String, Object> features,
        double qualityScore,
        boolean isSufficient,
        int wordCount
    ) {}
}
