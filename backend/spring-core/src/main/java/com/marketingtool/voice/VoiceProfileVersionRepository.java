package com.marketingtool.voice;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface VoiceProfileVersionRepository extends JpaRepository<VoiceProfileVersion, UUID> {
    Optional<VoiceProfileVersion> findTopByProfileIdOrderByCreatedAtDesc(UUID profileId);
}
