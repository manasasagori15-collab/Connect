
package com.connect.connect.service;

import com.connect.connect.dto.*;
import com.connect.connect.entity.*;
import com.connect.connect.repository.*;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;
import java.net.URLEncoder;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AuthService {

    private static final Logger logger =
            LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final JavaMailSender mailSender;

    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${spring.mail.username:}")
    private String senderEmail;

    @Value("${app.reset-url}")
    private String resetUrl;

    public AuthService(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            JavaMailSender mailSender) {

        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.mailSender = mailSender;
    }

    //  REGISTRATION 

    public String registerUser(RegisterRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "This email is already registered.");
        }

        if (userRepository.existsByMobile(request.getMobile().trim())) {
            throw new IllegalArgumentException(
                    "This mobile number is already registered.");
        }

        // Enforce a stronger password before storing the account.
        if (!request.getPassword().matches(
                "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$")) {
            throw new IllegalArgumentException(
                    "Password must have 8 characters, uppercase, lowercase, number and special character.");
        }

        User user = new User();

        user.setFirstName(request.getFirstName().trim());
        user.setSurname(request.getSurname().trim());
        user.setEmail(email);
        user.setMobile(request.getMobile().trim());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setGender(request.getGender());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);

        return "Registration successful!";
    }

    //  LOGIN 

    public String loginUser(LoginRequest request) {

        Optional<User> optionalUser =
                userRepository.findByEmail(
                        request.getEmail().trim().toLowerCase());

        if (optionalUser.isEmpty()) {
            throw new IllegalArgumentException(
                    "Invalid email or password.");
        }

        User user = optionalUser.get();

        if (!passwordEncoder.matches(
                request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException(
                    "Invalid email or password.");
        }

        return "Login successful!";
    }

    //  FORGOT PASSWORD 

    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        Optional<User> optionalUser = userRepository.findByEmail(email);

        // Always return the same message so account existence isn't revealed.
        String response =
                "If an account exists for this email, a password reset link will be sent.";

        if (optionalUser.isEmpty()) {
            return response;
        }

        User user = optionalUser.get();

        try {
            // Invalidate any previous reset links for this user.
            tokenRepository.deleteByUser(user);

            // Generate a cryptographically random token.
            byte[] randomBytes = new byte[32];
            secureRandom.nextBytes(randomBytes);

            String rawToken = Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(randomBytes);

            // Store only the SHA-256 hash in MySQL.
            PasswordResetToken resetToken = new PasswordResetToken();

            resetToken.setTokenHash(hashToken(rawToken));
            resetToken.setUser(user);
            resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(30));
            resetToken.setUsed(false);

            tokenRepository.save(resetToken);

            // Put the original token in the email link.
            String encodedToken = URLEncoder.encode(
                    rawToken, StandardCharsets.UTF_8);

            String link = resetUrl + "?token=" + encodedToken;

            SimpleMailMessage message = new SimpleMailMessage();

            message.setFrom(senderEmail);
            message.setTo(user.getEmail());
            message.setSubject("Climentos - Password Reset");
            message.setText(
                    "Hello " + user.getFirstName() + ",\n\n" +
                    "We received a request to reset your Climentos password.\n\n" +
                    "Click the link below to create a new password:\n\n" +
                    link + "\n\n" +
                    "This link expires in 30 minutes and can only be used once.\n\n" +
                    "If you did not request this, you can ignore this email."
            );

            mailSender.send(message);

        } catch (Exception exception) {

            // Do not expose whether the account exists or email delivery failed.
            logger.error("Password reset email could not be sent.", exception);
            tokenRepository.deleteByUser(user);
        }

        return response;
    }

    //  RESET PASSWORD 

    @Transactional
    public String resetPassword(ResetPasswordRequest request) {

        String tokenHash = hashToken(request.getToken());

        PasswordResetToken resetToken =
                tokenRepository.findByTokenHash(tokenHash)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Invalid or expired reset link."));

        if (resetToken.isUsed() ||
                resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {

            throw new IllegalArgumentException(
                    "Invalid or expired reset link.");
        }

        // Apply the same password-strength rule as registration.
        if (!request.getNewPassword().matches(
                "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$")) {

            throw new IllegalArgumentException(
                    "Password must have 8 characters, uppercase, lowercase, number and special character.");
        }

        User user = resetToken.getUser();

        // Hash the new password before saving it.
        user.setPassword(
                passwordEncoder.encode(request.getNewPassword()));

        userRepository.save(user);

        // Mark the token as used and remove it.
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
        tokenRepository.delete(resetToken);

        // Remove any other outstanding reset links for this user.
        tokenRepository.deleteByUser(user);

        return "Password reset successful. Please log in.";
    }

    //  TOKEN HASHING - USED TO STRORE AND ENCRYPT THE SECRET CODE INTO BYTE FORM AND STORE IT IN THE DATA BASE

    private String hashToken(String token) {

        try {
            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");
                    //IF FAILS THROWS EXCEPTION USING CATCH

            byte[] hash = digest.digest(
                    token.getBytes(StandardCharsets.UTF_8));

            StringBuilder result = new StringBuilder();

            for (byte value : hash) {
                result.append(String.format("%02x", value));
            }

            return result.toString();

        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Unable to process reset token.", exception);
        }
    }
}
