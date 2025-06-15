package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.Request.LoginRequest;
import com.mathquest.demo.DTO.Request.SignupRequest;
import com.mathquest.demo.DTO.Response.JwtResponse;
import com.mathquest.demo.DTO.Response.MessageResponse;
import com.mathquest.demo.Model.ERole;
import com.mathquest.demo.Model.Role;
import com.mathquest.demo.Model.User;
import com.mathquest.demo.Repository.RoleRepository;
import com.mathquest.demo.Repository.UserRepository;
import com.mathquest.demo.Security.jwt.JwtUtils;
import com.mathquest.demo.Security.services.UserDetailsImpl;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

@Service
public class AuthService {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    EmailService emailService;

    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        // First, check if the user exists and is verified
        String usernameOrEmail = loginRequest.getUsername();
        User user = userRepository.findByUsername(usernameOrEmail)
                .orElseGet(() -> userRepository.findByEmail(usernameOrEmail)
                        .orElseThrow(
                                () -> new RuntimeException("User not found with username/email: " + usernameOrEmail)));

        // Check if the user is enabled (verified)
        if (!user.isEnabled()) {
            throw new RuntimeException("Account not verified. Please check your email to verify your account.");
        }

        // Ensure all required fields are set
        if (!user.isCreatedByAdmin()) {
            user.setCreatedByAdmin(false);
        }
        if (!user.isEmailVerified()) {
            user.setEmailVerified(false);
        }
        if (!user.isEmailVerificationRequired()) {
            user.setEmailVerificationRequired(true);
        }
        userRepository.save(user);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return new JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getFirstName(),
                userDetails.getLastName(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles);
    }

    public MessageResponse registerUser(SignupRequest signupRequest) {
        if (userRepository.existsByUsername(signupRequest.getUsername())) {
            return new MessageResponse("Error: Username is already taken!");
        }

        // Check if email exists AND is verified
        String email = signupRequest.getEmail();
        User existingUser = userRepository.findByEmail(email).orElse(null);

        if (existingUser != null) {
            if (existingUser.isEnabled()) {
                // Email exists and is verified
                return new MessageResponse("Error: Email is already in use!");
            } else {
                // Email exists but not verified - delete the unverified user
                userRepository.delete(existingUser);
            }
        }

        // Otherwise use our built-in verification system
        // Generate verification token
        String token = UUID.randomUUID().toString();

        // Create the user with verification token
        User user = createUserInDatabase(signupRequest, false, token);

        // Send verification email
        emailService.sendVerificationEmail(user.getEmail(), token);

        return new MessageResponse("User registered successfully! Please check your email to verify your account.");
    }

    private User createUserInDatabase(SignupRequest signupRequest, boolean enabled, String verificationToken) {
        // Create new user's account
        User user = new User(
                signupRequest.getFirstName(),
                signupRequest.getLastName(),
                signupRequest.getUsername(),
                signupRequest.getEmail(),
                encoder.encode(signupRequest.getPassword()));

        Set<String> strRoles = signupRequest.getRole();
        Set<Role> roles = new HashSet<>();

        if (strRoles == null || strRoles.isEmpty()) {
            Role userRole = roleRepository.findByName(ERole.ROLE_STUDENT)
                    .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
            roles.add(userRole);
        } else {
            strRoles.forEach(role -> {
                switch (role.toLowerCase()) {
                    case "admin":
                        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(adminRole);
                        break;
                    case "teacher":
                        Role teacherRole = roleRepository.findByName(ERole.ROLE_TEACHER)
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(teacherRole);
                        break;
                    default:
                        Role studentRole = roleRepository.findByName(ERole.ROLE_STUDENT)
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(studentRole);
                }
            });
        }

        user.setRoles(roles);
        user.setEnabled(enabled);
        user.setCreatedByAdmin(false); // Explicitly set to false for self-registered users
        user.setVerificationToken(verificationToken);

        return userRepository.save(user);
    }

    public MessageResponse verifyEmail(String token) {
        if (token == null || token.trim().isEmpty()) {
            throw new RuntimeException("Verification token is missing");
        }

        Optional<User> optionalUser = userRepository.findByVerificationToken(token);

        if (optionalUser.isEmpty()) {

            try {
                Thread.sleep(10000); // wait for 10 seconds
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt(); // restore interrupt status
                throw new RuntimeException("Thread was interrupted", e);
            }
            throw new RuntimeException("Invalid verification token");
        }

        User user = optionalUser.get();
        if (user.isEnabled()) {
            return new MessageResponse("Email already verified. You can log in.");
        }

        user.setEnabled(true);
        user.setVerificationToken(null);
        userRepository.save(user);

        return new MessageResponse("Email verified successfully! You can now log in.");
    }

    public MessageResponse forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with this email"));

        // Generate password reset token
        String token = UUID.randomUUID().toString();
        user.setResetPasswordToken(token);
        user.setResetPasswordTokenExpiry(java.time.LocalDateTime.now().plusHours(1)); // Token valid for 1 hour
        userRepository.save(user);

        // Send password reset email
        emailService.sendPasswordResetEmail(email, token);

        return new MessageResponse("Instructions for resetting your password have been sent to your email.");
    }

    public MessageResponse resetPassword(String token, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new RuntimeException("Passwords do not match");
        }

        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired password reset token"));

        // Check if token is expired
        if (user.getResetPasswordTokenExpiry().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("Password reset token has expired");
        }

        // Update password
        user.setPassword(encoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);
        userRepository.save(user);

        return new MessageResponse("Password has been reset successfully");
    }
}