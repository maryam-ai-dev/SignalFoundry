package com.marketingtool.voice;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "voice_samples", schema = "core")
@Getter
@Setter
@NoArgsConstructor
public class VoiceSample {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "profile_id", nullable = false)
    private UUID profileId;

    @Column(name = "sample_type", nullable = false)
    private String sampleType;

    @Column(name = "storage_key")
    private String storageKey;

    @Column(name = "quality_score")
    private double qualityScore;

    @Column(nullable = false)
    private boolean accepted;

    @Column(name = "word_count")
    private int wordCount;

    @Column(name = "analysis_result", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> analysisResult;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
