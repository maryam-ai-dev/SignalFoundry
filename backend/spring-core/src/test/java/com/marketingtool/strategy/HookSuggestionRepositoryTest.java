package com.marketingtool.strategy;

import com.marketingtool.research.ResearchRun;
import com.marketingtool.research.ResearchRunRepository;
import com.marketingtool.workspace.Workspace;
import com.marketingtool.workspace.WorkspaceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class HookSuggestionRepositoryTest {

    @Autowired private HookSuggestionRepository hookRepository;
    @Autowired private ResearchRunRepository runRepository;
    @Autowired private WorkspaceRepository workspaceRepository;

    @Test
    void saveWithContent_reload_roundtripsCorrectly() {
        Workspace ws = new Workspace();
        ws.setName("Hook Test");
        ws = workspaceRepository.save(ws);

        ResearchRun run = new ResearchRun();
        run.setWorkspaceId(ws.getId());
        run.setQueryText("test");
        run.setPlatforms(List.of("reddit"));
        run = runRepository.save(run);

        HookSuggestion hook = new HookSuggestion();
        hook.setRunId(run.getId());
        hook.setWorkspaceId(ws.getId());
        hook.setHookType("QUESTION");
        hook.setConfidence(0.85);
        hook.setContent(Map.of(
                "text", "Are you still struggling with authenticity?",
                "targetEmotion", "curiosity"
        ));
        hook = hookRepository.save(hook);
        hookRepository.flush();

        Optional<HookSuggestion> found = hookRepository.findById(hook.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getHookType()).isEqualTo("QUESTION");
        assertThat(found.get().getConfidence()).isEqualTo(0.85);
        assertThat(found.get().getContent()).containsEntry("text", "Are you still struggling with authenticity?");
        assertThat(found.get().isSaved()).isFalse();
        assertThat(found.get().isArchived()).isFalse();
    }
}
