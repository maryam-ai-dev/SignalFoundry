package com.marketingtool.shared.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class FastApiClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public FastApiClient(@Value("${app.fastapi.url:http://localhost:8000}") String baseUrl) {
        this.restTemplate = new RestTemplate();
        this.baseUrl = baseUrl;
    }

    @SuppressWarnings("unchecked")
    public String enqueueJob(String type, Map<String, Object> payload) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(
                Map.of("type", type, "payload", payload), headers);

        Map<String, Object> response = restTemplate.postForObject(
                baseUrl + "/internal/jobs/enqueue", request, Map.class);

        if (response == null || !response.containsKey("celery_task_id")) {
            throw new RuntimeException("FastAPI enqueue failed: no celery_task_id returned");
        }
        return response.get("celery_task_id").toString();
    }
}
