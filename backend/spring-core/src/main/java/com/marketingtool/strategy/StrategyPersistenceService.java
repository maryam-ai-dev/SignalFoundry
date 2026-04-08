package com.marketingtool.strategy;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StrategyPersistenceService {

    private final HookSuggestionRepository hookRepository;
    private final ContentAngleRepository angleRepository;
    private final PositioningProfileRepository positioningRepository;

    @Transactional
    public void persistFromGenerationResult(UUID runId, UUID workspaceId, Map<String, Object> result) {
        if (result == null) {
            log.warn("Null generation result for run {}", runId);
            return;
        }

        int hookCount = 0;
        int angleCount = 0;

        // Persist hooks
        Object hooks = result.get("hooks");
        if (hooks instanceof List<?> hookList) {
            for (Object h : hookList) {
                if (h instanceof Map<?, ?> hookMap) {
                    HookSuggestion hook = new HookSuggestion();
                    hook.setRunId(runId);
                    hook.setWorkspaceId(workspaceId);
                    hook.setHookType(strVal(hookMap, "hook_type"));
                    hook.setConfidence(numVal(hookMap, "confidence"));
                    @SuppressWarnings("unchecked")
                    Map<String, Object> content = (Map<String, Object>) hookMap;
                    hook.setContent(content);
                    hookRepository.save(hook);
                    hookCount++;
                }
            }
        }

        // Persist angles
        Object angles = result.get("angles");
        if (angles instanceof List<?> angleList) {
            for (Object a : angleList) {
                if (a instanceof Map<?, ?> angleMap) {
                    ContentAngle angle = new ContentAngle();
                    angle.setRunId(runId);
                    angle.setWorkspaceId(workspaceId);
                    angle.setAngleType(strVal(angleMap, "angle_type"));
                    angle.setConfidence(numVal(angleMap, "confidence"));
                    angle.setIntentType(strVal(angleMap, "intent_type"));
                    @SuppressWarnings("unchecked")
                    Map<String, Object> content = (Map<String, Object>) angleMap;
                    angle.setContent(content);
                    angleRepository.save(angle);
                    angleCount++;
                }
            }
        }

        // Persist synthesis as PositioningProfile
        Object synthesis = result.get("synthesis");
        if (synthesis instanceof Map<?, ?> synthMap) {
            PositioningProfile profile = new PositioningProfile();
            profile.setRunId(runId);
            profile.setWorkspaceId(workspaceId);
            @SuppressWarnings("unchecked")
            Map<String, Object> content = (Map<String, Object>) synthMap;
            profile.setContent(content);
            positioningRepository.save(profile);
        }

        log.info("Persisted {} hooks, {} angles, 1 positioning for run {}", hookCount, angleCount, runId);
    }

    private String strVal(Map<?, ?> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    private double numVal(Map<?, ?> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number n) return Math.min(1.0, Math.max(0.0, n.doubleValue()));
        return 0.0;
    }
}
