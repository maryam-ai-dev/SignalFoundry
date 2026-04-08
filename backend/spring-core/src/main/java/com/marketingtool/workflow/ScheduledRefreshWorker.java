package com.marketingtool.workflow;

import com.marketingtool.research.ResearchRun;
import com.marketingtool.research.ResearchRunOrchestrator;
import com.marketingtool.research.TrackedTopic;
import com.marketingtool.research.TrackedTopicRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledRefreshWorker {

    private final ScheduledRefreshRepository refreshRepository;
    private final TrackedTopicRepository topicRepository;
    private final ResearchRunOrchestrator orchestrator;

    @Scheduled(fixedRate = 900_000) // every 15 minutes
    public void checkDueRefreshes() {
        runDueRefreshes();
    }

    public int runDueRefreshes() {
        List<ScheduledRefresh> due = refreshRepository.findByIsActiveTrueAndNextRunAtBefore(Instant.now());
        if (due.isEmpty()) return 0;

        log.info("Found {} due scheduled refreshes", due.size());
        int dispatched = 0;

        for (ScheduledRefresh refresh : due) {
            try {
                if ("TOPIC".equals(refresh.getTargetType())) {
                    TrackedTopic topic = topicRepository.findById(refresh.getTargetId()).orElse(null);
                    if (topic != null && topic.isActive()) {
                        orchestrator.startScan(
                                refresh.getWorkspaceId(),
                                topic.getKeyword(),
                                topic.getPlatforms(),
                                ResearchRun.Mode.GENERAL,
                                null
                        );
                        dispatched++;
                    }
                }

                refresh.setLastRunAt(Instant.now());
                refresh.setNextRunAt(Instant.now().plus(refresh.cadenceHours(), ChronoUnit.HOURS));
                refreshRepository.save(refresh);

            } catch (Exception e) {
                log.warn("Failed to dispatch refresh {}: {}", refresh.getId(), e.getMessage());
            }
        }

        log.info("Dispatched {} scheduled scans", dispatched);
        return dispatched;
    }
}
