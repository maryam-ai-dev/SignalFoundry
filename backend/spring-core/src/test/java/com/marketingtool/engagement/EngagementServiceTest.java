package com.marketingtool.engagement;

import com.marketingtool.workspace.Workspace;
import com.marketingtool.workspace.WorkspaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
class EngagementServiceTest {

    @Autowired private EngagementService service;
    @Autowired private CommentDraftRepository draftRepository;
    @Autowired private CommentOpportunityRepository opportunityRepository;
    @Autowired private WorkspaceRepository workspaceRepository;

    private Workspace workspace;
    private CommentOpportunity opportunity;

    @BeforeEach
    void setUp() {
        workspace = new Workspace();
        workspace.setName("Engagement Test");
        workspace = workspaceRepository.save(workspace);

        opportunity = new CommentOpportunity();
        opportunity.setWorkspaceId(workspace.getId());
        opportunity.setSourcePostId("test-post");
        opportunity.setPlatform("reddit");
        opportunity = opportunityRepository.save(opportunity);
    }

    private CommentDraft createDraft(boolean requiresEdit) {
        CommentDraft draft = new CommentDraft();
        draft.setOpportunityId(opportunity.getId());
        draft.setWorkspaceId(workspace.getId());
        draft.setDraftText("A thoughtful comment");
        draft.setStrategyType("INSIGHTFUL");
        draft.setRiskFlags(List.of());
        draft.setRequiresEdit(requiresEdit);
        return draftRepository.save(draft);
    }

    @Test
    void approveDraft_validDraft_setsApproved() {
        CommentDraft draft = createDraft(false);
        CommentDraft approved = service.approveDraft(draft.getId());

        assertThat(approved.getStatus()).isEqualTo(CommentDraft.Status.APPROVED);
        assertThat(approved.getApprovedAt()).isNotNull();

        CommentOpportunity opp = opportunityRepository.findById(opportunity.getId()).orElseThrow();
        assertThat(opp.getStatus()).isEqualTo(CommentOpportunity.Status.DRAFT_READY);
    }

    @Test
    void approveDraft_expiredOpportunity_throws() {
        opportunity.setStatus(CommentOpportunity.Status.EXPIRED);
        opportunityRepository.save(opportunity);

        CommentDraft draft = createDraft(false);
        assertThatThrownBy(() -> service.approveDraft(draft.getId()))
                .isInstanceOf(ExpiredOpportunityException.class);
    }

    @Test
    void approveDraft_requiresEdit_throws() {
        CommentDraft draft = createDraft(true);
        assertThatThrownBy(() -> service.approveDraft(draft.getId()))
                .isInstanceOf(RequiresEditException.class);
    }

    @Test
    void rejectDraft_setsRejected() {
        CommentDraft draft = createDraft(false);
        CommentDraft rejected = service.rejectDraft(draft.getId());
        assertThat(rejected.getStatus()).isEqualTo(CommentDraft.Status.REJECTED);
    }

    @Test
    void editDraft_savesEditedText_clearsRequiresEdit() {
        CommentDraft draft = createDraft(true);
        CommentDraft edited = service.editDraft(draft.getId(), "Revised comment text");

        assertThat(edited.getEditedText()).isEqualTo("Revised comment text");
        assertThat(edited.getDraftText()).isEqualTo("A thoughtful comment");
        assertThat(edited.isRequiresEdit()).isFalse();
    }
}
