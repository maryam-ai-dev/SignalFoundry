package com.marketingtool.workspace;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, WorkspaceMemberId> {
    List<WorkspaceMember> findByIdWorkspaceId(UUID workspaceId);

    List<WorkspaceMember> findByIdUserId(UUID userId);
}
