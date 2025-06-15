package com.mathquest.demo.Controller;

import com.mathquest.demo.DTO.Request.LoginRequest;
import com.mathquest.demo.DTO.Request.SignupRequest;
import com.mathquest.demo.DTO.Request.ForgotPasswordRequest;
import com.mathquest.demo.DTO.Request.ResetPasswordRequest;
import com.mathquest.demo.DTO.Response.JwtResponse;
import com.mathquest.demo.DTO.Response.MessageResponse;
import com.mathquest.demo.Service.AuthService;
import com.mathquest.demo.Service.UserService;
import com.mathquest.demo.Model.User;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@CrossOrigin(origins = "http://localhost:3000", maxAge = 3600)
@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    AuthService authService;

    @Autowired
    UserService userService;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(authService.authenticateUser(loginRequest));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        return ResponseEntity.ok(authService.registerUser(signUpRequest));
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        try {
            // Find user by verification token
            User user = userService.findByVerificationToken(token);

            // Add delay before returning invalid token response
            if (user == null) {
                try {
                    Thread.sleep(2500); // Wait for 5 seconds
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Invalid verification token."));
            }

            // Check if email is already verified
            if (user.isEmailVerified()) {
                return ResponseEntity.ok(new MessageResponse("Email already verified. You can log in."));
            }

            // Verify the email
            user.setEmailVerified(true);
            user.setEmailVerificationRequired(false);
            user.setVerificationToken(null); // Clear the token
            user.setEnabled(true); // Enable the user account

            // Save the changes
            User updatedUser = userService.updateUser(user);

            if (updatedUser == null) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Failed to update user verification status."));
            }

            return ResponseEntity.ok(new MessageResponse("Email verified successfully! You can now log in."));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Failed to verify email: " + e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request.getEmail()));
    }

    @PostMapping("/reset-password")
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(
                request.getToken(),
                request.getNewPassword(),
                request.getConfirmPassword()));
    }
}