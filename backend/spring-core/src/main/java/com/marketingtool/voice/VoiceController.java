package com.marketingtool.voice;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/voice-profiles")
@RequiredArgsConstructor
public class VoiceController {

    private final VoiceService voiceService;

    @GetMapping("/me")
    public Map<String, Object> getMyProfile(@RequestParam UUID workspaceId) {
        VoiceProfile profile = voiceService.getOrCreateProfile(workspaceId);
        return profileToMap(profile);
    }

    @PostMapping("/{id}/upload-sample")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> uploadSample(@PathVariable UUID id,
                                             @RequestBody Map<String, Object> body) {
        String content = (String) body.get("content");
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Content is required");
        }

        int wordCount = content.split("\\s+").length;

        // Simple quality score (will be replaced by FastAPI analyze-sample call)
        double qualityScore = Math.min(1.0, wordCount / 300.0);

        @SuppressWarnings("unchecked")
        Map<String, Object> analysisResult = (Map<String, Object>) body.getOrDefault("analysisResult", Map.of());

        VoiceSample sample = voiceService.addSample(id, content, wordCount, analysisResult, qualityScore);

        Map<String, Object> result = new HashMap<>();
        result.put("id", sample.getId());
        result.put("accepted", sample.isAccepted());
        result.put("qualityScore", sample.getQualityScore());
        result.put("wordCount", sample.getWordCount());
        return result;
    }

    private Map<String, Object> profileToMap(VoiceProfile p) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", p.getId());
        map.put("workspaceId", p.getWorkspaceId());
        map.put("maturityScore", p.getMaturityScore());
        map.put("confidenceState", p.getConfidenceState().name());
        map.put("createdAt", p.getCreatedAt().toString());
        map.put("updatedAt", p.getUpdatedAt().toString());
        return map;
    }
}
