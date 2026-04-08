package com.marketingtool.strategy;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StrategyService {

    private final HookSuggestionRepository hookRepository;
    private final ContentAngleRepository angleRepository;
    private final PositioningProfileRepository positioningRepository;

    @Transactional(readOnly = true)
    public List<HookSuggestion> getHooks(UUID runId, Boolean saved) {
        if (saved != null && saved) {
            return hookRepository.findByWorkspaceIdAndSavedTrue(runId);
        }
        return hookRepository.findByRunIdAndArchivedFalse(runId);
    }

    @Transactional(readOnly = true)
    public List<ContentAngle> getAngles(UUID runId, Boolean saved) {
        if (saved != null && saved) {
            return angleRepository.findByWorkspaceIdAndSavedTrue(runId);
        }
        return angleRepository.findByRunIdAndArchivedFalse(runId);
    }

    @Transactional(readOnly = true)
    public PositioningProfile getPositioning(UUID workspaceId) {
        return positioningRepository.findTopByWorkspaceIdOrderByVersionDesc(workspaceId)
                .orElse(null);
    }
}
