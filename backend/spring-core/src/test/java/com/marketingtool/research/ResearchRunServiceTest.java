package com.marketingtool.research;

import com.marketingtool.workspace.Workspace;
import com.marketingtool.workspace.WorkspaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
class ResearchRunServiceTest {

    @Autowired private ResearchRunService service;
    @Autowired private WorkspaceRepository workspaceRepository;

    private UUID workspaceId;

    @BeforeEach
    void setUp() {
        Workspace ws = new Workspace();
        ws.setName("State Machine Test");
        ws = workspaceRepository.save(ws);
        workspaceId = ws.getId();
    }

    @Test
    void create_returnsPending() {
        ResearchRun run = service.create(workspaceId, "test", List.of("reddit"), ResearchRun.CampaignMode.GENERAL);
        assertThat(run.getStatus()).isEqualTo(ResearchRun.Status.PENDING);
    }

    @Test
    void markRunning_fromPending_succeeds() {
        ResearchRun run = service.create(workspaceId, "test", List.of("reddit"), ResearchRun.CampaignMode.GENERAL);
        run = service.markRunning(run.getId());
        assertThat(run.getStatus()).isEqualTo(ResearchRun.Status.RUNNING);
        assertThat(run.getStartedAt()).isNotNull();
    }

    @Test
    void markRunning_again_throwsInvalidState() {
        ResearchRun run = service.create(workspaceId, "test", List.of("reddit"), ResearchRun.CampaignMode.GENERAL);
        service.markRunning(run.getId());
        UUID id = run.getId();
        assertThatThrownBy(() -> service.markRunning(id))
                .isInstanceOf(InvalidStateException.class);
    }

    @Test
    void markPartialAnalysisReady_fromRunning_succeeds() {
        ResearchRun run = service.create(workspaceId, "test", List.of("reddit"), ResearchRun.CampaignMode.GENERAL);
        service.markRunning(run.getId());
        run = service.markPartialAnalysisReady(run.getId());
        assertThat(run.getStatus()).isEqualTo(ResearchRun.Status.PARTIAL_ANALYSIS_READY);
    }

    @Test
    void markCompleted_fromPartialAnalysisReady_succeeds() {
        ResearchRun run = service.create(workspaceId, "test", List.of("reddit"), ResearchRun.CampaignMode.GENERAL);
        service.markRunning(run.getId());
        service.markPartialAnalysisReady(run.getId());
        run = service.markCompleted(run.getId());
        assertThat(run.getStatus()).isEqualTo(ResearchRun.Status.COMPLETED);
        assertThat(run.getCompletedAt()).isNotNull();
    }

    @Test
    void markRunning_onCompleted_throwsInvalidState() {
        ResearchRun run = service.create(workspaceId, "test", List.of("reddit"), ResearchRun.CampaignMode.GENERAL);
        service.markRunning(run.getId());
        service.markPartialAnalysisReady(run.getId());
        service.markCompleted(run.getId());
        UUID id = run.getId();
        assertThatThrownBy(() -> service.markRunning(id))
                .isInstanceOf(InvalidStateException.class);
    }

    @Test
    void markPartialAnalysisReady_onPending_skippingRunning_throwsInvalidState() {
        ResearchRun run = service.create(workspaceId, "test", List.of("reddit"), ResearchRun.CampaignMode.GENERAL);
        UUID id = run.getId();
        assertThatThrownBy(() -> service.markPartialAnalysisReady(id))
                .isInstanceOf(InvalidStateException.class);
    }

    @Test
    void markCompleted_onRunning_skippingPartial_throwsInvalidState() {
        ResearchRun run = service.create(workspaceId, "test", List.of("reddit"), ResearchRun.CampaignMode.GENERAL);
        service.markRunning(run.getId());
        UUID id = run.getId();
        assertThatThrownBy(() -> service.markCompleted(id))
                .isInstanceOf(InvalidStateException.class);
    }

    @Test
    void markFailed_fromRunning_succeeds() {
        ResearchRun run = service.create(workspaceId, "test", List.of("reddit"), ResearchRun.CampaignMode.GENERAL);
        service.markRunning(run.getId());
        run = service.markFailed(run.getId(), "connector timeout");
        assertThat(run.getStatus()).isEqualTo(ResearchRun.Status.FAILED);
        assertThat(run.getErrorMessage()).isEqualTo("connector timeout");
    }

    @Test
    void markFailed_fromPartialAnalysisReady_succeeds() {
        ResearchRun run = service.create(workspaceId, "test", List.of("reddit"), ResearchRun.CampaignMode.GENERAL);
        service.markRunning(run.getId());
        service.markPartialAnalysisReady(run.getId());
        run = service.markFailed(run.getId(), "generation error");
        assertThat(run.getStatus()).isEqualTo(ResearchRun.Status.FAILED);
    }

    @Test
    void duplicateGuard_sameWorkspaceAndQuery_throwsDuplicateRun() {
        service.create(workspaceId, "duplicate test", List.of("reddit"), ResearchRun.CampaignMode.GENERAL);
        assertThatThrownBy(() ->
                service.create(workspaceId, "duplicate test", List.of("reddit"), ResearchRun.CampaignMode.GENERAL))
                .isInstanceOf(DuplicateRunException.class);
    }
}
