package com.marketingtool.workspace;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void saveAndFindById_roundtripsCorrectly() {
        User user = new User();
        user.setEmail("test@example.com");
        user.setPasswordHash("hashed_password_123");
        user.setName("Test User");

        User saved = userRepository.save(user);
        assertThat(saved.getId()).isNotNull();

        Optional<User> found = userRepository.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test@example.com");
        assertThat(found.get().getPasswordHash()).isEqualTo("hashed_password_123");
        assertThat(found.get().getName()).isEqualTo("Test User");
        assertThat(found.get().getCreatedAt()).isNotNull();
    }

    @Test
    void findByEmail_returnsUser() {
        User user = new User();
        user.setEmail("lookup@example.com");
        user.setPasswordHash("hash");
        userRepository.save(user);

        Optional<User> found = userRepository.findByEmail("lookup@example.com");
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("lookup@example.com");
    }
}
