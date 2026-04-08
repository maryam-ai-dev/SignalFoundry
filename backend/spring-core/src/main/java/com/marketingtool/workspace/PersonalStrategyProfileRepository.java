package com.marketingtool.workspace;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PersonalStrategyProfileRepository extends JpaRepository<PersonalStrategyProfile, UUID> {
}
