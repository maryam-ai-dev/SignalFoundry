package com.marketingtool.workspace;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "workspace_members", schema = "core")
@Getter
@Setter
@NoArgsConstructor
public class WorkspaceMember {

    @EmbeddedId
    private WorkspaceMemberId id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("workspaceId")
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    public enum Role {
        OWNER, MEMBER
    }
}
