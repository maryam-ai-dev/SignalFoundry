package com.marketingtool.workspace;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "workspace_settings", schema = "core")
@Getter
@Setter
@NoArgsConstructor
public class WorkspaceSettings {

    @Id
    @Column(name = "workspace_id")
    private UUID workspaceId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;

    @Column(name = "allow_direct_cta")
    private boolean allowDirectCta = true;

    @Column(name = "max_promotional_intensity")
    private int maxPromotionalIntensity = 3;

    @Column(name = "banned_phrases", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> bannedPhrases;

    @Column(name = "tone_constraints", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> toneConstraints;
}
