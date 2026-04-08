package com.marketingtool.campaign;

import com.marketingtool.research.InvalidStateException;
import com.marketingtool.workspace.Workspace;
import com.marketingtool.workspace.WorkspaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
class CampaignServiceTest {

    @Autowired private CampaignService service;
    @Autowired private CampaignObjectiveRepository campaignRepository;
    @Autowired private WorkspaceRepository workspaceRepository;

    private UUID workspaceId;

    @BeforeEach
    void setUp() {
        Workspace ws = new Workspace();
        ws.setName("Campaign Test WS");
        ws = workspaceRepository.save(ws);
        workspaceId = ws.getId();
    }

    private CampaignObjective createCampaign(String name) {
        CampaignObjective c = new CampaignObjective();
        c.setName(name);
        c.setGoalType(CampaignObjective.GoalType.AWARENESS);
        return service.create(workspaceId, c);
    }

    @Test
    void create_statusIsPaused() {
        CampaignObjective c = createCampaign("Test Campaign");
        assertThat(c.getStatus()).isEqualTo(CampaignObjective.Status.PAUSED);
    }

    @Test
    void activate_setsActive() {
        CampaignObjective c = createCampaign("Campaign A");
        CampaignObjective activated = service.activate(c.getId(), workspaceId);
        assertThat(activated.getStatus()).isEqualTo(CampaignObjective.Status.ACTIVE);
    }

    @Test
    void activateSecond_firstAutoPaused() {
        CampaignObjective a = createCampaign("Campaign A");
        service.activate(a.getId(), workspaceId);

        CampaignObjective b = createCampaign("Campaign B");
        service.activate(b.getId(), workspaceId);

        CampaignObjective reloadedA = campaignRepository.findById(a.getId()).orElseThrow();
        assertThat(reloadedA.getStatus()).isEqualTo(CampaignObjective.Status.PAUSED);

        CampaignObjective reloadedB = campaignRepository.findById(b.getId()).orElseThrow();
        assertThat(reloadedB.getStatus()).isEqualTo(CampaignObjective.Status.ACTIVE);
    }

    @Test
    void pauseAlreadyPaused_throws() {
        CampaignObjective c = createCampaign("Campaign C");
        assertThatThrownBy(() -> service.pause(c.getId()))
                .isInstanceOf(InvalidStateException.class);
    }

    @Test
    void getActiveCampaign_noneActive_returnsNull() {
        createCampaign("Paused Only");
        assertThat(service.getActiveCampaign(workspaceId)).isNull();
    }
}
