package com.marketingtool.campaign;

import com.marketingtool.workspace.Workspace;
import com.marketingtool.workspace.WorkspaceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class CampaignObjectiveRepositoryTest {

    @Autowired private CampaignObjectiveRepository campaignRepository;
    @Autowired private WorkspaceRepository workspaceRepository;

    @Test
    void saveWithGoalType_reload_correct() {
        Workspace ws = new Workspace();
        ws.setName("Campaign Test");
        ws = workspaceRepository.save(ws);

        CampaignObjective campaign = new CampaignObjective();
        campaign.setWorkspaceId(ws.getId());
        campaign.setName("Beta Launch Q2");
        campaign.setGoalType(CampaignObjective.GoalType.BETA_USER_ACQUISITION);
        campaign.setTargetAudience("Gen-Z creators");
        campaign = campaignRepository.save(campaign);
        campaignRepository.flush();

        Optional<CampaignObjective> found = campaignRepository.findById(campaign.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getGoalType()).isEqualTo(CampaignObjective.GoalType.BETA_USER_ACQUISITION);
        assertThat(found.get().getStatus()).isEqualTo(CampaignObjective.Status.PAUSED);
        assertThat(found.get().getName()).isEqualTo("Beta Launch Q2");
        assertThat(found.get().getTimeWindowDays()).isEqualTo(30);
    }
}
