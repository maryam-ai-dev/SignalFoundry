package com.marketingtool.strategy;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PositioningProfileRepository extends JpaRepository<PositioningProfile, UUID> {
    Optional<PositioningProfile> findTopByWorkspaceIdOrderByVersionDesc(UUID workspaceId);
}
