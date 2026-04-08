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
class WorkspaceRepositoryTest {

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Test
    void saveAndReload_keyThemesDeserializesCorrectly() {
        Workspace ws = new Workspace();
        ws.setName("Test Workspace");
        ws.setProductName("WidgetPro");
        ws.setProductDescription("A cool widget");
        ws.setKeyThemes(List.of("productivity", "ai", "saas"));

        Workspace saved = workspaceRepository.save(ws);
        assertThat(saved.getId()).isNotNull();

        // Clear persistence context to force reload from DB
        workspaceRepository.flush();

        Optional<Workspace> found = workspaceRepository.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Test Workspace");
        assertThat(found.get().getKeyThemes()).containsExactly("productivity", "ai", "saas");
        assertThat(found.get().getCreatedAt()).isNotNull();
    }
}
