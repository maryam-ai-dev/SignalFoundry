package com.marketingtool.voice;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VoiceService {

    private final VoiceProfileRepository profileRepository;
    private final VoiceSampleRepository sampleRepository;
    private final VoiceProfileVersionRepository versionRepository;

    @Transactional
    public VoiceProfile getOrCreateProfile(UUID workspaceId) {
        return profileRepository.findByWorkspaceId(workspaceId)
                .orElseGet(() -> {
                    VoiceProfile profile = new VoiceProfile();
                    profile.setWorkspaceId(workspaceId);
                    return profileRepository.save(profile);
                });
    }

    @Transactional
    public VoiceSample addSample(UUID profileId, String content, int wordCount,
                                  Map<String, Object> analysisResult, double qualityScore) {
        boolean accepted = qualityScore >= 0.4;

        VoiceSample sample = new VoiceSample();
        sample.setProfileId(profileId);
        sample.setSampleType("TEXT");
        sample.setStorageKey(null);
        sample.setQualityScore(qualityScore);
        sample.setAccepted(accepted);
        sample.setWordCount(wordCount);
        sample.setAnalysisResult(analysisResult);
        sample = sampleRepository.save(sample);

        if (accepted) {
            updateProfileState(profileId);
        }

        log.info("Voice sample added: profileId={}, accepted={}, qualityScore={}, wordCount={}",
                profileId, accepted, qualityScore, wordCount);

        return sample;
    }

    @Transactional(readOnly = true)
    public VoiceProfile getActiveProfile(UUID workspaceId) {
        return profileRepository.findByWorkspaceId(workspaceId).orElse(null);
    }

    private void updateProfileState(UUID profileId) {
        VoiceProfile profile = profileRepository.findById(profileId).orElse(null);
        if (profile == null) return;

        int acceptedCount = sampleRepository.countByProfileIdAndAcceptedTrue(profileId);
        int totalWords = sampleRepository.findByProfileIdAndAcceptedTrue(profileId)
                .stream().mapToInt(VoiceSample::getWordCount).sum();

        // Compute maturity
        double maturity = computeMaturity(acceptedCount, totalWords);
        profile.setMaturityScore(maturity);

        // State transitions
        VoiceProfile.ConfidenceState currentState = profile.getConfidenceState();
        if (currentState == VoiceProfile.ConfidenceState.EMPTY && acceptedCount >= 1) {
            profile.setConfidenceState(VoiceProfile.ConfidenceState.COLLECTING);
        }
        if (currentState == VoiceProfile.ConfidenceState.COLLECTING
                && acceptedCount >= 2 && totalWords >= 500) {
            profile.setConfidenceState(VoiceProfile.ConfidenceState.USABLE);
        }
        if (currentState == VoiceProfile.ConfidenceState.USABLE
                && acceptedCount >= 5 && totalWords >= 2000) {
            profile.setConfidenceState(VoiceProfile.ConfidenceState.MATURE);
        }

        profileRepository.save(profile);
    }

    private double computeMaturity(int acceptedCount, int totalWords) {
        if (acceptedCount == 0) return 0.0;
        double sampleScore = acceptedCount >= 5 ? 1.0
                : acceptedCount >= 2 ? 0.6 + 0.4 * (acceptedCount - 2) / 3.0
                : 0.3 * acceptedCount;
        double wordScore = totalWords >= 2000 ? 1.0
                : totalWords >= 500 ? 0.6 + 0.4 * (totalWords - 500) / 1500.0
                : 0.6 * totalWords / 500.0;
        return Math.round(Math.min(sampleScore, wordScore) * 1000.0) / 1000.0;
    }
}
