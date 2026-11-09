
package com.connect.connect.controller;

import com.connect.connect.entity.User;
import com.connect.connect.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserRepository userRepository;

    public ProfileController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getProfile(@RequestParam String email) {

        Optional<User> optionalUser =
                userRepository.findByEmail(email.trim().toLowerCase());

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User profile not found."));
        }

        User user = optionalUser.get();

        Map<String, Object> profile = new HashMap<>();

        profile.put("firstName", user.getFirstName());
        profile.put("surname", user.getSurname());
        profile.put("fullName",
                user.getFirstName() + " " + user.getSurname());
        profile.put("email", user.getEmail());

        return ResponseEntity.ok(profile);
    }
}
