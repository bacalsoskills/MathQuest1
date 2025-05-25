package com.mathquest.demo.Controller;

import com.mathquest.demo.DTO.Request.UpdateProfileRequest;
import com.mathquest.demo.DTO.Response.MessageResponse;
import com.mathquest.demo.Model.User;
import com.mathquest.demo.Security.services.UserDetailsImpl;
import com.mathquest.demo.Service.UserService;

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

@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = { "Authorization", "Content-Type",
        "Accept" }, methods = { RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
                RequestMethod.DELETE, RequestMethod.OPTIONS })
@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

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

    @GetMapping("/verify-email")
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> verifyEmailUpdate(@RequestParam String token) {
        try {
            User user = userService.verifyEmailUpdate(token);

            // Return a success message when token is valid and not expired
            return ResponseEntity.ok(new MessageResponse("Email verified successfully! You can now log in."));
        } catch (RuntimeException e) {
            // Log the error
            System.err.println("Email verification error: " + e.getMessage());

            // Return a specific error message based on the exception
            String errorMsg = e.getMessage();
            if (errorMsg.contains("expired")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new MessageResponse(errorMsg));
            } else if (errorMsg.contains("already been used")) {
                // For already used tokens, show a different message indicating it was already
                // verified
                return ResponseEntity.status(HttpStatus.ALREADY_REPORTED)
                        .body(new MessageResponse(
                                "This email has already been verified. No further action is needed."));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new MessageResponse(
                                "We couldn't verify your email. Please try again or contact support."));
            }
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
    public ResponseEntity<?> changePassword(@Valid @RequestBody UpdateProfileRequest passwordRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        try {
            User updatedUser = userService.updateUserProfile(userDetails.getId(), passwordRequest);
            return ResponseEntity.ok(new MessageResponse("Password changed successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}