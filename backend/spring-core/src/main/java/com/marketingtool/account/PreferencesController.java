package com.marketingtool.account;

import com.marketingtool.shared.security.AuthService;
import com.marketingtool.shared.security.CurrentUser;
import com.marketingtool.workspace.User;
import com.marketingtool.workspace.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/preferences")
@RequiredArgsConstructor
public class PreferencesController {

    private final UserRepository userRepository;

    @PutMapping("/digest-day")
    @Transactional
    public Map<String, Object> updateDigestDay(
            @CurrentUser UUID userId,
            @RequestBody DigestDayRequest req) {
        if (userId == null) {
            throw new AuthService.AuthenticationException("Not authenticated");
        }
        DigestDay day = DigestDay.parse(req.day());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        user.setDigestDay(day);
        userRepository.save(user);
        return Map.of("digestDay", day);
    }

    public record DigestDayRequest(String day) {}
}
