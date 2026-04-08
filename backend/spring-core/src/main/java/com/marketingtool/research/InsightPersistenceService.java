package com.marketingtool.research;

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
public class InsightPersistenceService {

    private final InsightSnapshotRepository insightRepository;

    @Transactional
    public void persistFromAnalysisResult(UUID runId, Map<String, Object> result) {
        if (result == null) {
            log.warn("Null analysis result for run {}", runId);
            return;
        }

        int count = 0;

        Object trendClusters = result.get("trend_clusters");
        if (trendClusters instanceof List<?> trends) {
            for (Object t : trends) {
                if (t instanceof Map<?, ?> trendMap) {
                    InsightSnapshot snapshot = new InsightSnapshot();
                    snapshot.setRunId(runId);
                    snapshot.setType("TREND");
                    @SuppressWarnings("unchecked")
                    Map<String, Object> payload = (Map<String, Object>) trendMap;
                    snapshot.setPayload(payload);
                    snapshot.setConfidence(extractConfidence(payload, "momentum_score"));
                    insightRepository.save(snapshot);
                    count++;
                }
            }
        }

        Object narrativeClusters = result.get("narrative_clusters");
        if (narrativeClusters instanceof List<?> narratives) {
            for (Object n : narratives) {
                if (n instanceof Map<?, ?> narrativeMap) {
                    InsightSnapshot snapshot = new InsightSnapshot();
                    snapshot.setRunId(runId);
                    snapshot.setType("NARRATIVE");
                    @SuppressWarnings("unchecked")
                    Map<String, Object> payload = (Map<String, Object>) narrativeMap;
                    snapshot.setPayload(payload);
                    insightRepository.save(snapshot);
                    count++;
                }
            }
        }

        count += persistListType(runId, result, "pain_clusters", "PAIN");
        count += persistListType(runId, result, "objection_clusters", "OBJECTION");
        count += persistListType(runId, result, "belief_gaps", "BELIEF_GAP");

        // language_map is a single object, not a list
        Object languageMap = result.get("language_map");
        if (languageMap instanceof Map<?, ?> langMap) {
            InsightSnapshot snapshot = new InsightSnapshot();
            snapshot.setRunId(runId);
            snapshot.setType("LANGUAGE");
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = (Map<String, Object>) langMap;
            snapshot.setPayload(payload);
            insightRepository.save(snapshot);
            count++;
        }

        log.info("Persisted {} insight snapshots for run {}", count, runId);
    }

    private int persistListType(UUID runId, Map<String, Object> result, String key, String type) {
        Object items = result.get(key);
        int count = 0;
        if (items instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    InsightSnapshot snapshot = new InsightSnapshot();
                    snapshot.setRunId(runId);
                    snapshot.setType(type);
                    @SuppressWarnings("unchecked")
                    Map<String, Object> payload = (Map<String, Object>) map;
                    snapshot.setPayload(payload);
                    insightRepository.save(snapshot);
                    count++;
                }
            }
        }
        return count;
    }

    private double extractConfidence(Map<String, Object> payload, String key) {
        Object val = payload.get(key);
        if (val instanceof Number n) {
            return Math.min(1.0, Math.abs(n.doubleValue()));
        }
        return 0.0;
    }
}
