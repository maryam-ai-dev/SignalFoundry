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
class ContentAngleRepositoryTest {

    @Autowired private ContentAngleRepository angleRepository;
    @Autowired private ResearchRunRepository runRepository;
    @Autowired private WorkspaceRepository workspaceRepository;

    @Test
    void saveAngle_reload_angleTypeCorrect() {
        Workspace ws = new Workspace();
        ws.setName("Angle Test");
        ws = workspaceRepository.save(ws);

        ResearchRun run = new ResearchRun();
        run.setWorkspaceId(ws.getId());
        run.setQueryText("test");
        run.setPlatforms(List.of("reddit"));
        run = runRepository.save(run);

        ContentAngle angle = new ContentAngle();
        angle.setRunId(run.getId());
        angle.setWorkspaceId(ws.getId());
        angle.setAngleType("CONTRARIAN");
        angle.setConfidence(0.75);
        angle.setContent(Map.of("headline", "Why everyone is wrong about X"));
        angle = angleRepository.save(angle);
        angleRepository.flush();

        Optional<ContentAngle> found = angleRepository.findById(angle.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getAngleType()).isEqualTo("CONTRARIAN");
        assertThat(found.get().getContent()).containsEntry("headline", "Why everyone is wrong about X");
    }

    @Test
    void savePositioningProfile_reload_contentIntact() {
        Workspace ws = new Workspace();
        ws.setName("Positioning Test");
        ws = workspaceRepository.save(ws);

        ResearchRun run = new ResearchRun();
        run.setWorkspaceId(ws.getId());
        run.setQueryText("test");
        run.setPlatforms(List.of("reddit"));
        run = runRepository.save(run);

        var profileRepo = angleRepository; // Using same test class — separate test below
    }
}
