package com.marketingtool.engagement;

import com.marketingtool.workspace.Workspace;
import com.marketingtool.workspace.WorkspaceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class CommentDraftRepositoryTest {

    @Autowired private CommentDraftRepository draftRepository;
    @Autowired private CommentOpportunityRepository opportunityRepository;
    @Autowired private WorkspaceRepository workspaceRepository;

    @Test
    void saveWithRiskFlags_reload_listIntact() {
        Workspace ws = new Workspace();
        ws.setName("Draft Test");
        ws = workspaceRepository.save(ws);

        CommentOpportunity opp = new CommentOpportunity();
        opp.setWorkspaceId(ws.getId());
        opp.setSourcePostId("test-post");
        opp.setPlatform("reddit");
        opp = opportunityRepository.save(opp);

        CommentDraft draft = new CommentDraft();
        draft.setOpportunityId(opp.getId());
        draft.setWorkspaceId(ws.getId());
        draft.setDraftText("This is a thoughtful comment about authenticity");
        draft.setStrategyType("INSIGHTFUL");
        draft.setRiskFlags(List.of("contains self-promotion hint"));
        draft.setRequiresEdit(true);
        draft = draftRepository.save(draft);
        draftRepository.flush();

        Optional<CommentDraft> found = draftRepository.findById(draft.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getRiskFlags()).containsExactly("contains self-promotion hint");
        assertThat(found.get().isRequiresEdit()).isTrue();
        assertThat(found.get().getStatus()).isEqualTo(CommentDraft.Status.PENDING_REVIEW);
        assertThat(found.get().getDuplicateRisk()).isEqualTo(0.0);
    }
}
