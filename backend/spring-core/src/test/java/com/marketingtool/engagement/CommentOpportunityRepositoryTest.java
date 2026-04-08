package com.marketingtool.engagement;

import com.marketingtool.workspace.Workspace;
import com.marketingtool.workspace.WorkspaceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class CommentOpportunityRepositoryTest {

    @Autowired private CommentOpportunityRepository opportunityRepository;
    @Autowired private WorkspaceRepository workspaceRepository;

    @Test
    void saveAndReload_allFieldsCorrect() {
        Workspace ws = new Workspace();
        ws.setName("Engagement Test");
        ws = workspaceRepository.save(ws);

        CommentOpportunity opp = new CommentOpportunity();
        opp.setWorkspaceId(ws.getId());
        opp.setSourcePostId("reddit-abc123");
        opp.setPlatform("reddit");
        opp.setPostSummary("A post about authenticity on social media");
        opp.setPostUrl("https://reddit.com/r/test/abc123");
        opp.setRelevanceScore(0.85);
        opp.setEngagementIntent("BUILD_TRUST");
        opp = opportunityRepository.save(opp);
        opportunityRepository.flush();

        Optional<CommentOpportunity> found = opportunityRepository.findById(opp.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getStatus()).isEqualTo(CommentOpportunity.Status.OPEN);
        assertThat(found.get().getRelevanceScore()).isEqualTo(0.85);
        assertThat(found.get().getCreatedAt()).isNotNull();
        assertThat(found.get().getExpiresAt()).isNotNull();

        // expiresAt should be ~24h after createdAt
        long hoursDiff = ChronoUnit.HOURS.between(found.get().getCreatedAt(), found.get().getExpiresAt());
        assertThat(hoursDiff).isEqualTo(24);
    }
}
