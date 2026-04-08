package com.marketingtool.voice;

import com.marketingtool.workspace.Workspace;
import com.marketingtool.workspace.WorkspaceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class VoiceSampleRepositoryTest {

    @Autowired private VoiceSampleRepository sampleRepository;
    @Autowired private VoiceProfileRepository profileRepository;
    @Autowired private VoiceProfileVersionRepository versionRepository;
    @Autowired private WorkspaceRepository workspaceRepository;

    @Test
    void saveSample_reload_correct() {
        Workspace ws = new Workspace();
        ws.setName("Voice Sample Test");
        ws = workspaceRepository.save(ws);

        VoiceProfile profile = new VoiceProfile();
        profile.setWorkspaceId(ws.getId());
        profile = profileRepository.save(profile);

        VoiceSample sample = new VoiceSample();
        sample.setProfileId(profile.getId());
        sample.setSampleType("TEXT");
        sample.setQualityScore(0.8);
        sample.setAccepted(true);
        sample.setWordCount(350);
        sample.setAnalysisResult(Map.of("avg_sentence_length", 12.5));
        sample = sampleRepository.save(sample);
        sampleRepository.flush();

        Optional<VoiceSample> found = sampleRepository.findById(sample.getId());
        assertThat(found).isPresent();
        assertThat(found.get().isAccepted()).isTrue();
        assertThat(found.get().getQualityScore()).isEqualTo(0.8);
        assertThat(found.get().getAnalysisResult()).containsEntry("avg_sentence_length", 12.5);
    }

    @Test
    void saveVersion_reload_vectorIntact() {
        Workspace ws = new Workspace();
        ws.setName("Voice Version Test");
        ws = workspaceRepository.save(ws);

        VoiceProfile profile = new VoiceProfile();
        profile.setWorkspaceId(ws.getId());
        profile = profileRepository.save(profile);

        VoiceProfileVersion version = new VoiceProfileVersion();
        version.setProfileId(profile.getId());
        version.setAggregatedVector(Map.of("avg_sentence_length", 11.0, "type_token_ratio", 0.85));
        version.setSampleCount(3);
        version.setMaturityScore(0.6);
        version = versionRepository.save(version);
        versionRepository.flush();

        Optional<VoiceProfileVersion> found = versionRepository.findById(version.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getAggregatedVector()).containsEntry("type_token_ratio", 0.85);
        assertThat(found.get().getSampleCount()).isEqualTo(3);
    }
}
