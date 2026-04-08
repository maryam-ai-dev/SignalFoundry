package com.marketingtool.voice;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VoiceSampleRepository extends JpaRepository<VoiceSample, UUID> {
    List<VoiceSample> findByProfileIdAndAcceptedTrue(UUID profileId);
    int countByProfileIdAndAcceptedTrue(UUID profileId);
}
