package com.marketingtool.workspace;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PersonalStrategyProfileTest {

    @Autowired private PersonalStrategyProfileRepository profileRepository;
    @Autowired private WorkspaceRepository workspaceRepository;

    @Test
    void saveWithPreferences_reload_intact() {
        Workspace ws = new Workspace();
        ws.setName("Personalization Test");
        ws = workspaceRepository.save(ws);

        PersonalStrategyProfile profile = new PersonalStrategyProfile();
        profile.setWorkspaceId(ws.getId());
        profile.setPreferredAngleTypes(Map.of("FOUNDER_STORY", 5, "CONTRARIAN", 3));
        profile.setPreferredHookFormats(Map.of("CURIOSITY", 4));
        profile.setPreferredCommentTones(Map.of("INSIGHTFUL", 2));
        profile.setTotalDecisions(14);
        profileRepository.save(profile);
        profileRepository.flush();

        Optional<PersonalStrategyProfile> found = profileRepository.findById(ws.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getPreferredAngleTypes()).containsEntry("FOUNDER_STORY", 5);
        assertThat(found.get().getPreferredHookFormats()).containsEntry("CURIOSITY", 4);
        assertThat(found.get().getTotalDecisions()).isEqualTo(14);
    }
}
