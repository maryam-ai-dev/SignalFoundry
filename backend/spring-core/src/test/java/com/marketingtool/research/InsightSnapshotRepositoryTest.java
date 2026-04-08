package com.marketingtool.research;

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
class InsightSnapshotRepositoryTest {

    @Autowired private InsightSnapshotRepository insightRepository;
    @Autowired private ResearchRunRepository runRepository;
    @Autowired private WorkspaceRepository workspaceRepository;

    @Test
    void saveWithPayload_reload_payloadIntact() {
        Workspace ws = new Workspace();
        ws.setName("Insight Test");
        ws = workspaceRepository.save(ws);

        ResearchRun run = new ResearchRun();
        run.setWorkspaceId(ws.getId());
        run.setQueryText("test");
        run.setPlatforms(List.of("reddit"));
        run = runRepository.save(run);

        InsightSnapshot snapshot = new InsightSnapshot();
        snapshot.setRunId(run.getId());
        snapshot.setType("TREND");
        snapshot.setPayload(Map.of(
                "direction", "RISING",
                "momentum_score", 2.5,
                "post_count", 15
        ));
        snapshot.setConfidence(0.85);
        snapshot = insightRepository.save(snapshot);
        insightRepository.flush();

        Optional<InsightSnapshot> found = insightRepository.findById(snapshot.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getType()).isEqualTo("TREND");
        assertThat(found.get().getPayload()).containsEntry("direction", "RISING");
        assertThat(found.get().getConfidence()).isEqualTo(0.85);
        assertThat(found.get().getCreatedAt()).isNotNull();
    }
}
