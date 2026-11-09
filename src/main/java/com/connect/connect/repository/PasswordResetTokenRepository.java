
package com.connect.connect.repository;

import com.connect.connect.entity.PasswordResetToken;
import com.connect.connect.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PasswordResetTokenRepository
        extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    // Remove previous reset requests for the same user.
    void deleteByUser(User user);
}
