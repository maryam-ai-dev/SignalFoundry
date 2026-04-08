package com.marketingtool.memory;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "idea_bank_entries", schema = "core")
@Getter
@Setter
@NoArgsConstructor
public class IdeaBankEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(columnDefinition = "text", nullable = false)
    private String idea;

    @Column(name = "angle_type")
    private String angleType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ACTIVE;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }

    public enum Status {
        ACTIVE, USED, ARCHIVED
    }
}
