package com.marketingtool.workspace;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PersonalizationService {

    private final PersonalStrategyProfileRepository profileRepository;

    @Transactional
    public void recordDecision(UUID workspaceId, String decisionType, String value) {
        PersonalStrategyProfile profile = profileRepository.findById(workspaceId)
                .orElseGet(() -> {
                    PersonalStrategyProfile p = new PersonalStrategyProfile();
                    p.setWorkspaceId(workspaceId);
                    p.setPreferredAngleTypes(new HashMap<>());
                    p.setPreferredHookFormats(new HashMap<>());
                    p.setPreferredCommentTones(new HashMap<>());
                    return p;
                });

        switch (decisionType) {
            case "angle" -> increment(profile.getPreferredAngleTypes(), value);
            case "hook" -> increment(profile.getPreferredHookFormats(), value);
            case "comment" -> increment(profile.getPreferredCommentTones(), value);
        }

        profile.setTotalDecisions(profile.getTotalDecisions() + 1);
        profileRepository.save(profile);
    }

    @Transactional(readOnly = true)
    public PersonalStrategyProfile getProfile(UUID workspaceId) {
        return profileRepository.findById(workspaceId).orElse(null);
    }

    private void increment(Map<String, Integer> map, String key) {
        if (map == null || key == null || key.isBlank()) return;
        map.merge(key, 1, Integer::sum);
    }
}
