
package com.connect.connect.controller;

import com.connect.connect.dto.*;
import com.connect.connect.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Register a new user.
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(
            @Valid @RequestBody RegisterRequest request) {

        try {
            String message = authService.registerUser(request);

            return ResponseEntity.status(201)
                    .body(Map.of("message", message));

        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", exception.getMessage()));
        }
    }

    // Authenticate an existing user.
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(
            @Valid @RequestBody LoginRequest request) {

        try {
            String message = authService.loginUser(request);

            return ResponseEntity.ok(
                    Map.of("message", message));

        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", exception.getMessage()));
        }
    }

    // Request a password-reset email.
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        String message = authService.forgotPassword(request);

        return ResponseEntity.ok(
                Map.of("message", message));
    }

    // Set a new password using the emailed token.
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        try {
            String message = authService.resetPassword(request);

            return ResponseEntity.ok(
                    Map.of("message", message));

        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", exception.getMessage()));
        }
    }
}
