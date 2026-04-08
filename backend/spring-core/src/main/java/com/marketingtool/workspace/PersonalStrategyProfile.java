package com.marketingtool.workspace;

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
@Table(name = "personal_strategy_profiles", schema = "core")
@Getter
@Setter
@NoArgsConstructor
public class PersonalStrategyProfile {

    @Id
    @Column(name = "workspace_id")
    private UUID workspaceId;

    @Column(name = "preferred_angle_types", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Integer> preferredAngleTypes;

    @Column(name = "preferred_hook_formats", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Integer> preferredHookFormats;

    @Column(name = "preferred_comment_tones", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Integer> preferredCommentTones;

    @Column(name = "total_decisions")
    private int totalDecisions = 0;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }
}
