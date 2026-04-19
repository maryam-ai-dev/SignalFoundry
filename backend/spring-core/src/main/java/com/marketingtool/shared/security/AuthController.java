package com.marketingtool.shared.security;

import com.marketingtool.workspace.User;
import com.marketingtool.workspace.UserRepository;
import com.marketingtool.workspace.WorkspaceMember;
import com.marketingtool.workspace.WorkspaceMemberRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> register(@RequestBody RegisterRequest req) {
        String token = authService.register(req.email(), req.password(), req.name(), req.accountMode());
        return Map.of("token", token);
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody LoginRequest req) {
        String token = authService.login(req.email(), req.password());
        return Map.of("token", token);
    }

    @GetMapping("/me")
    public Map<String, Object> me(@CurrentUser UUID userId) {
        if (userId == null) {
            throw new AuthService.AuthenticationException("Not authenticated");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        List<UUID> workspaceIds = workspaceMemberRepository.findByIdUserId(userId).stream()
                .map(WorkspaceMember::getId)
                .map(id -> id.getWorkspaceId())
                .toList();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("userId", user.getId());
        body.put("accountMode", user.getAccountMode());
        body.put("digestDay", user.getDigestDay());
        body.put("workspaceIds", workspaceIds);
        return body;
    }

    public record RegisterRequest(String email, String password, String name, String accountMode) {}
    public record LoginRequest(String email, String password) {}
}
