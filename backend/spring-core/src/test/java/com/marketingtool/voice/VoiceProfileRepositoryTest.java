package com.marketingtool.voice;

import com.marketingtool.workspace.Workspace;
import com.marketingtool.workspace.WorkspaceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class VoiceProfileRepositoryTest {

    @Autowired private VoiceProfileRepository profileRepository;
    @Autowired private WorkspaceRepository workspaceRepository;

    @Test
    void saveWithEmptyState_reload_correct() {
        Workspace ws = new Workspace();
        ws.setName("Voice Test");
        ws = workspaceRepository.save(ws);

        VoiceProfile profile = new VoiceProfile();
        profile.setWorkspaceId(ws.getId());
        profile = profileRepository.save(profile);
        profileRepository.flush();

        Optional<VoiceProfile> found = profileRepository.findByWorkspaceId(ws.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getConfidenceState()).isEqualTo(VoiceProfile.ConfidenceState.EMPTY);
        assertThat(found.get().getMaturityScore()).isEqualTo(0.0);
        assertThat(found.get().getCreatedAt()).isNotNull();
        assertThat(found.get().getUpdatedAt()).isNotNull();
    }
}
