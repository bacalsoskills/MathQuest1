package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.Request.UpdateProfileRequest;
import com.mathquest.demo.Model.User;
import com.mathquest.demo.Repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private static final int MAX_IMAGE_WIDTH = 500;
    private static final int MAX_IMAGE_HEIGHT = 500;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User getUserProfile(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    public User getUserProfile(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));
    }

    public User updateUserProfile(Long userId, User userDetails) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

        // Only update fields that are provided (not null)
        if (userDetails.getFirstName() != null) {
            user.setFirstName(userDetails.getFirstName());
        }

        if (userDetails.getLastName() != null) {
            user.setLastName(userDetails.getLastName());
        }

        if (userDetails.getEmail() != null) {
            user.setEmail(userDetails.getEmail());
        }

        // Handle profile image updates
        if (userDetails.getProfileImage() != null) {
            try {
                user.setProfileImage(resizeImage(userDetails.getProfileImage()));
                user.setProfileImageName(userDetails.getProfileImageName());
            } catch (IOException e) {
                throw new RuntimeException("Failed to process profile image", e);
            }
        }

        return userRepository.save(user);
    }

    public User updateUserProfile(Long userId, UpdateProfileRequest updateRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

        // Only update fields that are provided (not null)
        if (updateRequest.getFirstName() != null) {
            user.setFirstName(updateRequest.getFirstName());
        }

        if (updateRequest.getLastName() != null) {
            user.setLastName(updateRequest.getLastName());
        }

        // Handle username update
        if (updateRequest.getUsername() != null && !updateRequest.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(updateRequest.getUsername())) {
                throw new RuntimeException("Username is already taken");
            }
            user.setUsername(updateRequest.getUsername());
        }

        // Handle email update with verification
        if (updateRequest.getEmail() != null && !updateRequest.getEmail().equals(user.getEmail())) {
            // Check if email is already in use by another user
            if (userRepository.existsByEmail(updateRequest.getEmail())) {
                throw new RuntimeException("Email is already in use");
            }

            // Generate verification token for email update
            String token = UUID.randomUUID().toString();
            user.setPendingEmail(updateRequest.getEmail());
            user.setPendingEmailToken(token);
            // Set token expiry to 24 hours from now
            user.setPendingEmailTokenExpiry(LocalDateTime.now().plusHours(24));

            // Send verification email to the new email address
            emailService.sendEmailUpdateVerification(updateRequest.getEmail(), token);
        }

        // Handle password change
        if (updateRequest.getNewPassword() != null && updateRequest.getCurrentPassword() != null) {
            // Verify current password
            if (!passwordEncoder.matches(updateRequest.getCurrentPassword(), user.getPassword())) {
                throw new RuntimeException("Current password is incorrect");
            }

            // Verify new password matches confirmation
            if (!updateRequest.getNewPassword().equals(updateRequest.getConfirmPassword())) {
                throw new RuntimeException("New password and confirmation password do not match");
            }

            // Update the password
            user.setPassword(passwordEncoder.encode(updateRequest.getNewPassword()));
        }

        // Handle profile image upload
        if (updateRequest.getProfileImage() != null && !updateRequest.getProfileImage().isEmpty()) {
            try {
                byte[] resizedImage = resizeImageFromMultipartFile(updateRequest.getProfileImage());
                user.setProfileImage(resizedImage);
                user.setProfileImageName(updateRequest.getProfileImage().getOriginalFilename());
            } catch (IOException e) {
                throw new RuntimeException("Failed to process profile image", e);
            }
        }

        return userRepository.save(user);
    }

    // Verify email update
    public User verifyEmailUpdate(String token) {
        // Check if token is null or empty
        if (token == null || token.isEmpty()) {
            throw new RuntimeException("Invalid email verification token: Token cannot be empty");
        }

        // Try to find the user by the token
        var userOptional = userRepository.findByPendingEmailToken(token);

        // If no user found with this token
        if (userOptional.isEmpty()) {
            // Check if this token was already used
            var users = userRepository.findAll();
            boolean tokenWasUsed = false;
            User lastUser = null;

            for (User u : users) {
                // Keep track of the user we found, if any
                if (u.getEmail() != null && u.getPendingEmailToken() == null && u.getPendingEmail() == null) {
                    lastUser = u;
                    tokenWasUsed = true;
                    break;
                }
            }

            if (tokenWasUsed && lastUser != null) {
                throw new RuntimeException(
                        "Email verification token has already been used. Your email has been updated successfully.");
            }

            throw new RuntimeException("Invalid email verification token: No user found with this token");
        }

        User user = userOptional.get();

        // Check if token is expired
        if (user.getPendingEmailTokenExpiry() != null &&
                LocalDateTime.now().isAfter(user.getPendingEmailTokenExpiry())) {
            // Generate a new token for the user
            String newToken = UUID.randomUUID().toString();
            user.setPendingEmailToken(newToken);
            user.setPendingEmailTokenExpiry(LocalDateTime.now().plusHours(24));
            userRepository.save(user);

            // Send a new verification email
            emailService.sendEmailUpdateVerification(user.getPendingEmail(), newToken);

            throw new RuntimeException(
                    "Email verification token has expired. A new verification link has been sent to your email.");
        }

        // Check if pending email exists
        if (user.getPendingEmail() == null || user.getPendingEmail().isEmpty()) {
            throw new RuntimeException("Invalid email verification: No pending email update found");
        }

        // Update the email
        user.setEmail(user.getPendingEmail());
        user.setPendingEmail(null);
        user.setPendingEmailToken(null);
        user.setPendingEmailTokenExpiry(null);

        return userRepository.save(user);
    }

    // Method to remove profile image
    public User removeProfileImage(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

        user.setProfileImage(null);
        user.setProfileImageName(null);

        return userRepository.save(user);
    }

    // Add method to delete a user
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new UsernameNotFoundException("User not found with id: " + userId);
        }
        userRepository.deleteById(userId);
    }

    /**
     * Resizes an image if it exceeds maximum dimensions
     * 
     * @param imageData The original image as byte array
     * @return The resized image as byte array
     * @throws IOException If there's an error processing the image
     */
    private byte[] resizeImage(byte[] imageData) throws IOException {
        ByteArrayInputStream bis = new ByteArrayInputStream(imageData);
        BufferedImage originalImage = ImageIO.read(bis);
        bis.close();

        if (originalImage == null) {
            return imageData; // Return original if unable to read as image
        }

        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();

        // Check if resize is needed
        if (originalWidth <= MAX_IMAGE_WIDTH && originalHeight <= MAX_IMAGE_HEIGHT) {
            return imageData; // No need to resize
        }

        // Calculate new dimensions while maintaining aspect ratio
        int newWidth, newHeight;
        if (originalWidth > originalHeight) {
            newWidth = MAX_IMAGE_WIDTH;
            newHeight = (int) (originalHeight * ((double) MAX_IMAGE_WIDTH / originalWidth));
        } else {
            newHeight = MAX_IMAGE_HEIGHT;
            newWidth = (int) (originalWidth * ((double) MAX_IMAGE_HEIGHT / originalHeight));
        }

        // Create resized image
        BufferedImage resizedImage = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = resizedImage.createGraphics();
        g.drawImage(originalImage, 0, 0, newWidth, newHeight, null);
        g.dispose();

        // Convert back to byte array
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        String formatName = "jpg"; // Default format

        ImageIO.write(resizedImage, formatName, bos);
        byte[] resizedImageData = bos.toByteArray();
        bos.close();

        return resizedImageData;
    }

    /**
     * Resizes an image from MultipartFile if it exceeds maximum dimensions
     * 
     * @param file The MultipartFile containing the image
     * @return The resized image as byte array
     * @throws IOException If there's an error processing the image
     */
    private byte[] resizeImageFromMultipartFile(MultipartFile file) throws IOException {
        return resizeImage(file.getBytes());
    }

    // Method to retrieve all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Method to delete a user by ID
    public void deleteUserById(Long userId) {
        userRepository.deleteById(userId);
    }
}