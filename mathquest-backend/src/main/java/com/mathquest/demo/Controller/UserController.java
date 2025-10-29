package com.mathquest.demo.Controller;

import com.mathquest.demo.DTO.Request.UpdateProfileRequest;
import com.mathquest.demo.DTO.Request.ChangePasswordRequest;
import com.mathquest.demo.DTO.Response.MessageResponse;
import com.mathquest.demo.Model.User;
import com.mathquest.demo.Security.services.UserDetailsImpl;
import com.mathquest.demo.Service.UserService;
import com.mathquest.demo.Service.EmailService;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = { "Authorization", "Content-Type",
        "Accept" }, methods = { RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
                RequestMethod.DELETE, RequestMethod.OPTIONS })
@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private EmailService emailService;

    @GetMapping("/profile")
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> getUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        User user = userService.getUserProfile(userDetails.getUsername());

        // To prevent password from being sent to the client
        user.setPassword(null);

        return ResponseEntity.ok(user);
    }

    @PutMapping(value = "/profile", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE,
            MediaType.APPLICATION_FORM_URLENCODED_VALUE })
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateUserProfile(@Valid @ModelAttribute UpdateProfileRequest updateRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        // Validate image if provided
        if (updateRequest.getProfileImage() != null && !updateRequest.getProfileImage().isEmpty()) {
            String contentType = updateRequest.getProfileImage().getContentType();
            if (contentType == null || !(contentType.equals("image/jpeg") ||
                    contentType.equals("image/jpg") ||
                    contentType.equals("image/png"))) {
                return ResponseEntity.badRequest().body(new MessageResponse("Only JPG and PNG images are allowed"));
            }
        }

        try {
            User updatedUser = userService.updateUserProfile(userDetails.getId(), updateRequest);

            // To prevent password from being sent to the client
            updatedUser.setPassword(null);

            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PutMapping(value = "/profile", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateUserProfileJson(@Valid @RequestBody UpdateProfileRequest updateRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        try {
            User updatedUser = userService.updateUserProfile(userDetails.getId(), updateRequest);

            // To prevent password from being sent to the client
            updatedUser.setPassword(null);

            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping(value = "/profile-json", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateUserProfileWithJson(@Valid @RequestBody UpdateProfileRequest updateRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        try {
            User updatedUser = userService.updateUserProfile(userDetails.getId(), updateRequest);

            // To prevent password from being sent to the client
            updatedUser.setPassword(null);

            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    // Now allow PUT as well with JSON
    @PutMapping(value = "/profile-json", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateUserProfileWithJsonPut(@Valid @RequestBody UpdateProfileRequest updateRequest) {
        return updateUserProfileWithJson(updateRequest);
    }

    @PostMapping("/resend-verification")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> resendVerificationEmail() {
        try {
            // Get the current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            User user = userService.getUserById(userDetails.getId());

            // Check if user needs verification
            if (!user.isEmailVerified() && user.isEmailVerificationRequired()) {
                // Generate new verification token
                String newToken = UUID.randomUUID().toString();
                user.setVerificationToken(newToken);
                userService.updateUser(user);

                // Send new verification email
                emailService.sendVerificationEmail(user.getEmail(), newToken);
                return ResponseEntity
                        .ok(new MessageResponse("Verification email has been resent. Please check your inbox."));
            } else {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Email verification is not required for this account."));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Failed to resend verification email: " + e.getMessage()));
        }
    }

    @GetMapping("/verify-email")
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> verifyEmailUpdate(@RequestParam String token) {
        try {
            // Find user by pending email token instead of verification token
            User user = userService.findByPendingEmailToken(token);

            // Add delay before returning invalid token response
            if (user == null) {
                try {
                    Thread.sleep(3000); // Wait for 3 seconds
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Invalid verification token."));
            }

            // Check if there's a pending email
            if (user.getPendingEmail() == null) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("No pending email update found."));
            }

            // Update the email
            user.setEmail(user.getPendingEmail());
            user.setPendingEmail(null);
            user.setPendingEmailToken(null);
            user.setPendingEmailTokenExpiry(null);

            // Save the changes
            User updatedUser = userService.updateUser(user);

            if (updatedUser == null) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Failed to update email."));
            }

            return ResponseEntity.ok(
                    new MessageResponse("Email updated successfully! You can now log in with your new email address."));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Failed to verify email: " + e.getMessage()));
        }
    }

    @GetMapping("/profile/image")
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> getProfileImage() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        User user = userService.getUserProfile(userDetails.getUsername());

        if (user.getProfileImage() == null) {
            return ResponseEntity.notFound().build();
        }

        // Determine media type based on filename
        MediaType mediaType = MediaType.IMAGE_JPEG; // Default
        String filename = user.getProfileImageName();
        if (filename != null) {
            if (filename.toLowerCase().endsWith(".png")) {
                mediaType = MediaType.IMAGE_PNG;
            } else if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) {
                mediaType = MediaType.IMAGE_JPEG;
            }
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + user.getProfileImageName() + "\"")
                .contentType(mediaType)
                .body(user.getProfileImage());
    }

    @GetMapping("/profile/image/{userId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> getUserProfileImage(@PathVariable Long userId) {
        try {
            User user = userService.getUserProfile(userId);

            if (user.getProfileImage() == null) {
                return ResponseEntity.notFound().build();
            }

            // Determine media type based on filename
            MediaType mediaType = MediaType.IMAGE_JPEG; // Default
            String filename = user.getProfileImageName();
            if (filename != null) {
                if (filename.toLowerCase().endsWith(".png")) {
                    mediaType = MediaType.IMAGE_PNG;
                } else if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) {
                    mediaType = MediaType.IMAGE_JPEG;
                }
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + user.getProfileImageName() + "\"")
                    .contentType(mediaType)
                    .body(user.getProfileImage());
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping(value = "/profile/image", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE,
            MediaType.APPLICATION_FORM_URLENCODED_VALUE })
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> uploadProfileImage(@RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        // Check both "image" and "file" parameters
        MultipartFile uploadedFile = image != null ? image : file;

        if (uploadedFile == null || uploadedFile.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Please select an image to upload"));
        }

        // Validate file type (only allow JPG and PNG)
        String contentType = uploadedFile.getContentType();
        if (contentType == null || !(contentType.equals("image/jpeg") ||
                contentType.equals("image/jpg") ||
                contentType.equals("image/png"))) {
            return ResponseEntity.badRequest().body(new MessageResponse("Only JPG and PNG images are allowed"));
        }

        try {
            // Create an UpdateProfileRequest with just the image
            UpdateProfileRequest updateRequest = new UpdateProfileRequest();
            updateRequest.setProfileImage(uploadedFile);

            // Update the user profile using the service method that includes resizing
            User updatedUser = userService.updateUserProfile(userDetails.getId(), updateRequest);

            // To prevent password from being sent to the client
            updatedUser.setPassword(null);

            return ResponseEntity.ok(new MessageResponse("Profile image uploaded successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to upload profile image: " + e.getMessage()));
        }
    }

    @DeleteMapping("/profile/image")
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteProfileImage() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        User user = userService.removeProfileImage(userDetails.getId());

        // To prevent password from being sent to the client
        user.setPassword(null);

        return ResponseEntity.ok(new MessageResponse("Profile image removed successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(new MessageResponse("User deleted successfully"));
    }

    // Allow users to delete their own account
    @DeleteMapping("/profile")
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteOwnAccount() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        userService.deleteUser(userDetails.getId());
        return ResponseEntity.ok(new MessageResponse("Account deleted successfully"));
    }

    @PostMapping("/change-password")
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest passwordRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        try {
            // Check if the request is from an admin
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            // Check if current password matches new password
            if (passwordRequest.getCurrentPassword().equals(passwordRequest.getNewPassword())) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("New password must be different from current password."));
            }

            User updatedUser = userService.changePassword(userDetails.getId(), passwordRequest, isAdmin);

            // If user had a temporary password, set it to false after successful change
            if (updatedUser.isTemporaryPassword()) {
                updatedUser.setTemporaryPassword(false);
                updatedUser.setTemporaryPasswordExpiry(null);
                userService.updateUser(updatedUser);
            }

            return ResponseEntity.ok(new MessageResponse("Password changed successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}