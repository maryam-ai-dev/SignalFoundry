package com.marketingtool.strategy;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
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

    @Transactional
    public HookSuggestion saveHook(UUID id) {
        HookSuggestion hook = hookRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Hook not found: " + id));
        hook.setSaved(true);
        return hookRepository.save(hook);
    }

    @Transactional
    public HookSuggestion archiveHook(UUID id) {
        HookSuggestion hook = hookRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Hook not found: " + id));
        hook.setArchived(true);
        return hookRepository.save(hook);
    }

    @Transactional
    public HookSuggestion regenerateHook(UUID id) {
        HookSuggestion hook = hookRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Hook not found: " + id));
        // TODO: Call FastAPI generation endpoint in Sprint 8.5+
        hook.setContent(Map.of("text", "[regeneration pending — generation engine not yet wired]"));
        return hookRepository.save(hook);
    }

    @Transactional
    public ContentAngle saveAngle(UUID id) {
        ContentAngle angle = angleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Angle not found: " + id));
        angle.setSaved(true);
        return angleRepository.save(angle);
    }

    @Transactional
    public ContentAngle archiveAngle(UUID id) {
        ContentAngle angle = angleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Angle not found: " + id));
        angle.setArchived(true);
        return angleRepository.save(angle);
    }

    @Transactional
    public ContentAngle regenerateAngle(UUID id) {
        ContentAngle angle = angleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Angle not found: " + id));
        // TODO: Call FastAPI generation endpoint in Sprint 8.5+
        angle.setContent(Map.of("text", "[regeneration pending — generation engine not yet wired]"));
        return angleRepository.save(angle);
    }
}
