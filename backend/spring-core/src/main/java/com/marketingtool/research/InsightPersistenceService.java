package com.marketingtool.research;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
public class InsightPersistenceService {

    public void persist(Map<String, Object> result) {
        // Stub — real implementation persists InsightSnapshots in Phase 6+
        log.info("InsightPersistenceService.persist called with {} keys", result != null ? result.size() : 0);
    }
}
