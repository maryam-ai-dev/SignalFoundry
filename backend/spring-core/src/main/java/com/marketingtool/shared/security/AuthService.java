package com.marketingtool.shared.security;

import com.marketingtool.workspace.AccountMode;
import com.marketingtool.workspace.User;
import com.marketingtool.workspace.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public String register(String email, String password, String name, String accountModeRaw) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }

        AccountMode accountMode = parseAccountMode(accountModeRaw);

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setName(name);
        user.setAccountMode(accountMode);
        user = userRepository.save(user);

        return jwtUtil.generateToken(user.getId());
    }

    public String login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthenticationException("Invalid credentials"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new AuthenticationException("Invalid credentials");
        }

        return jwtUtil.generateToken(user.getId());
    }

    private AccountMode parseAccountMode(String raw) {
        if (raw == null || raw.isBlank()) {
            return AccountMode.FOUNDER;
        }
        try {
            return AccountMode.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid accountMode: must be FOUNDER or INVESTOR");
        }
    }

    public static class AuthenticationException extends RuntimeException {
        public AuthenticationException(String message) {
            super(message);
        }
    }
}
