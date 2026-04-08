package com.marketingtool.voice;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface VoiceProfileRepository extends JpaRepository<VoiceProfile, UUID> {
    Optional<VoiceProfile> findByWorkspaceId(UUID workspaceId);
}
