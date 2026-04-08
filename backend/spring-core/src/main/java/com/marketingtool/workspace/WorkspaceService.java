package com.marketingtool.workspace;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final WorkspaceSettingsRepository settingsRepository;
    private final UserRepository userRepository;

    @Transactional
    public Workspace create(String name, String productName, String productDescription,
                            List<String> keyThemes, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        Workspace ws = new Workspace();
        ws.setName(name);
        ws.setProductName(productName);
        ws.setProductDescription(productDescription);
        ws.setKeyThemes(keyThemes);
        ws = workspaceRepository.save(ws);

        WorkspaceMember member = new WorkspaceMember();
        member.setId(new WorkspaceMemberId(ws.getId(), user.getId()));
        member.setWorkspace(ws);
        member.setUser(user);
        member.setRole(WorkspaceMember.Role.OWNER);
        memberRepository.save(member);

        WorkspaceSettings settings = new WorkspaceSettings();
        settings.setWorkspace(ws);
        settingsRepository.save(settings);

        return ws;
    }

    @Transactional(readOnly = true)
    public Workspace getById(UUID id) {
        return workspaceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Workspace not found: " + id));
    }

    @Transactional
    public WorkspaceSettings updateSettings(UUID workspaceId, UpdateSettingsRequest dto) {
        WorkspaceSettings settings = settingsRepository.findById(workspaceId)
                .orElseThrow(() -> new EntityNotFoundException("Settings not found for workspace: " + workspaceId));

        if (dto.allowDirectCta() != null) settings.setAllowDirectCta(dto.allowDirectCta());
        if (dto.maxPromotionalIntensity() != null) settings.setMaxPromotionalIntensity(dto.maxPromotionalIntensity());
        if (dto.bannedPhrases() != null) settings.setBannedPhrases(dto.bannedPhrases());
        if (dto.toneConstraints() != null) settings.setToneConstraints(dto.toneConstraints());

        return settingsRepository.save(settings);
    }

    public record UpdateSettingsRequest(
        Boolean allowDirectCta,
        Integer maxPromotionalIntensity,
        List<String> bannedPhrases,
        List<String> toneConstraints
    ) {}
}
