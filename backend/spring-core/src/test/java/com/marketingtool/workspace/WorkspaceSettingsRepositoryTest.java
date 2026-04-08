package com.marketingtool.workspace;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class WorkspaceSettingsRepositoryTest {

    @Autowired private WorkspaceSettingsRepository settingsRepository;
    @Autowired private WorkspaceRepository workspaceRepository;

    @Test
    void saveWithBannedPhrases_reload_listIntact() {
        Workspace ws = new Workspace();
        ws.setName("Settings Test WS");
        ws = workspaceRepository.save(ws);

        WorkspaceSettings settings = new WorkspaceSettings();
        settings.setWorkspace(ws);
        settings.setBannedPhrases(List.of("buy now", "limited offer", "act fast"));
        settings.setToneConstraints(List.of("professional", "friendly"));
        settingsRepository.save(settings);
        settingsRepository.flush();

        Optional<WorkspaceSettings> found = settingsRepository.findById(ws.getId());
        assertThat(found).isPresent();
        assertThat(found.get().isAllowDirectCta()).isTrue();
        assertThat(found.get().getMaxPromotionalIntensity()).isEqualTo(3);
        assertThat(found.get().getBannedPhrases()).containsExactly("buy now", "limited offer", "act fast");
        assertThat(found.get().getToneConstraints()).containsExactly("professional", "friendly");
    }
}
