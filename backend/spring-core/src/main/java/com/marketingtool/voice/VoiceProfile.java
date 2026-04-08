package com.marketingtool.voice;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "voice_profiles", schema = "core")
@Getter
@Setter
@NoArgsConstructor
public class VoiceProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "workspace_id", nullable = false, unique = true)
    private UUID workspaceId;

    @Column(name = "maturity_score")
    private double maturityScore = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(name = "confidence_state", nullable = false)
    private ConfidenceState confidenceState = ConfidenceState.EMPTY;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public enum ConfidenceState {
        EMPTY, COLLECTING, PROVISIONAL, USABLE, MATURE
    }
}
