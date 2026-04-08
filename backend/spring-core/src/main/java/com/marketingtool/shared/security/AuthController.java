package com.marketingtool.shared.security;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> register(@RequestBody RegisterRequest req) {
        String token = authService.register(req.email(), req.password(), req.name());
        return Map.of("token", token);
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody LoginRequest req) {
        String token = authService.login(req.email(), req.password());
        return Map.of("token", token);
    }

    public record RegisterRequest(String email, String password, String name) {}
    public record LoginRequest(String email, String password) {}
}
