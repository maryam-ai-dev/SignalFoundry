package com.marketingtool.research;

import com.marketingtool.workspace.Workspace;
import com.marketingtool.workspace.WorkspaceRepository;
import org.junit.jupiter.api.BeforeEach;
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
class ResearchRunRepositoryTest {

    @Autowired private ResearchRunRepository runRepository;
    @Autowired private WorkspaceRepository workspaceRepository;

    private Workspace workspace;

    @BeforeEach
    void setUp() {
        workspace = new Workspace();
        workspace.setName("Test WS");
        workspace = workspaceRepository.save(workspace);
    }

    @Test
    void saveWithPendingStatus_reloads_correctly() {
        ResearchRun run = new ResearchRun();
        run.setWorkspaceId(workspace.getId());
        run.setQueryText("social media authenticity");
        run.setPlatforms(List.of("reddit", "youtube"));
        run.setStatus(ResearchRun.Status.PENDING);
        run = runRepository.save(run);

        Optional<ResearchRun> found = runRepository.findById(run.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getStatus()).isEqualTo(ResearchRun.Status.PENDING);
        assertThat(found.get().getMode()).isEqualTo(ResearchRun.Mode.SCAN);
        assertThat(found.get().getCampaignMode()).isEqualTo(ResearchRun.CampaignMode.GENERAL);
        assertThat(found.get().getPlatforms()).containsExactly("reddit", "youtube");
    }

    @Test
    void saveWithGoalContextSnapshot_reloads_jsonIntact() {
        ResearchRun run = new ResearchRun();
        run.setWorkspaceId(workspace.getId());
        run.setQueryText("test query");
        run.setPlatforms(List.of("reddit"));
        run.setGoalContextSnapshot(Map.of(
                "goalType", "AWARENESS",
                "targetAudience", "founders"
        ));
        run = runRepository.save(run);
        runRepository.flush();

        Optional<ResearchRun> found = runRepository.findById(run.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getGoalContextSnapshot()).containsEntry("goalType", "AWARENESS");
        assertThat(found.get().getGoalContextSnapshot()).containsEntry("targetAudience", "founders");
    }
}
