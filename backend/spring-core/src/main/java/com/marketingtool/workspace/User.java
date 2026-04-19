package com.marketingtool.workspace;

import com.marketingtool.account.DigestDay;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users", schema = "core")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_mode", nullable = false)
    private AccountMode accountMode = AccountMode.FOUNDER;

    @Enumerated(EnumType.STRING)
    @Column(name = "digest_day", nullable = false, length = 3)
    private DigestDay digestDay = DigestDay.MON;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (accountMode == null) {
            accountMode = AccountMode.FOUNDER;
        }
        if (digestDay == null) {
            digestDay = DigestDay.MON;
        }
    }
}
