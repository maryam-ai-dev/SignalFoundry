package com.marketingtool.strategy;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
public class StrategyPersistenceService {

    public void persist(Map<String, Object> result) {
        // Stub — real implementation persists HookSuggestions, ContentAngles in Phase 8+
        log.info("StrategyPersistenceService.persist called with {} keys", result != null ? result.size() : 0);
    }
}
