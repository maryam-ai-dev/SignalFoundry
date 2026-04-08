package com.marketingtool.workflow;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/refresh-schedules")
@RequiredArgsConstructor
public class ScheduledRefreshController {

    private final ScheduledRefreshRepository refreshRepository;
    private final ScheduledRefreshWorker refreshWorker;

    @PostMapping("/trigger")
    public Map<String, Object> triggerNow() {
        int dispatched = refreshWorker.runDueRefreshes();
        return Map.of("dispatched", dispatched);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@RequestBody ScheduledRefresh schedule) {
        schedule = refreshRepository.save(schedule);
        return toMap(schedule);
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam UUID workspaceId) {
        return refreshRepository.findByWorkspaceId(workspaceId)
                .stream().map(this::toMap).toList();
    }

    private Map<String, Object> toMap(ScheduledRefresh s) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", s.getId());
        map.put("workspaceId", s.getWorkspaceId());
        map.put("targetType", s.getTargetType());
        map.put("targetId", s.getTargetId());
        map.put("cadence", s.getCadence().name());
        map.put("nextRunAt", s.getNextRunAt().toString());
        map.put("lastRunAt", s.getLastRunAt() != null ? s.getLastRunAt().toString() : null);
        map.put("isActive", s.isActive());
        map.put("createdAt", s.getCreatedAt().toString());
        return map;
    }
}
