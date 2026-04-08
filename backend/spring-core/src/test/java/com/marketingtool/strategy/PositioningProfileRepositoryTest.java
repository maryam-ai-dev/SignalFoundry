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
class PositioningProfileRepositoryTest {

    @Autowired private PositioningProfileRepository profileRepository;
    @Autowired private ResearchRunRepository runRepository;
    @Autowired private WorkspaceRepository workspaceRepository;

    @Test
    void saveProfile_reload_contentIntact() {
        Workspace ws = new Workspace();
        ws.setName("Profile Test");
        ws = workspaceRepository.save(ws);

        ResearchRun run = new ResearchRun();
        run.setWorkspaceId(ws.getId());
        run.setQueryText("test");
        run.setPlatforms(List.of("reddit"));
        run = runRepository.save(run);

        PositioningProfile profile = new PositioningProfile();
        profile.setRunId(run.getId());
        profile.setWorkspaceId(ws.getId());
        profile.setContent(Map.of(
                "uniqueValue", "AI-powered authenticity",
                "targetAudience", "Gen-Z creators"
        ));
        profile = profileRepository.save(profile);
        profileRepository.flush();

        Optional<PositioningProfile> found = profileRepository.findById(profile.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getVersion()).isEqualTo(1);
        assertThat(found.get().getContent()).containsEntry("uniqueValue", "AI-powered authenticity");
    }
}
