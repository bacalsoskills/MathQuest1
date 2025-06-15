package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.Request.CreateUserRequest;
import com.mathquest.demo.DTO.Request.UpdateProfileRequest;
import com.mathquest.demo.DTO.Request.ChangePasswordRequest;
import com.mathquest.demo.Model.User;
import com.mathquest.demo.Repository.UserRepository;
import com.mathquest.demo.Model.Role;
import com.mathquest.demo.Repository.RoleRepository;
import com.mathquest.demo.Model.ERole;
import com.mathquest.demo.Security.services.UserDetailsImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
import java.util.HashSet;
import java.util.Set;

@Service
public class UserServiceImpl implements UserService {

    private static final int MAX_IMAGE_WIDTH = 500;
    private static final int MAX_IMAGE_HEIGHT = 500;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RoleRepository roleRepository;

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

        // Check if the update is from admin
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (updateRequest.getFirstName() != null) {
            user.setFirstName(updateRequest.getFirstName());
        }
        if (updateRequest.getLastName() != null) {
            user.setLastName(updateRequest.getLastName());
        }
        if (updateRequest.getUsername() != null) {
            user.setUsername(updateRequest.getUsername());
        }
        if (updateRequest.getEmail() != null) {
            // If admin is updating email, update directly without verification
            if (isAdmin) {
                user.setEmail(updateRequest.getEmail());
            } else {
                // Normal email update flow with verification
                user.setPendingEmail(updateRequest.getEmail());
                String token = UUID.randomUUID().toString();
                user.setPendingEmailToken(token);
                user.setPendingEmailTokenExpiry(LocalDateTime.now().plusHours(24));
                emailService.sendEmailUpdateVerification(updateRequest.getEmail(), token);
            }
        }
        if (updateRequest.getPassword() != null) {
            // If admin is updating password, mark it as admin change
            if (isAdmin) {
                user.setPassword(passwordEncoder.encode(updateRequest.getPassword()));
                user.setTemporaryPassword(true);
                user.setTemporaryPasswordExpiry(LocalDateTime.now().plusDays(7));
            } else {
                user.setPassword(passwordEncoder.encode(updateRequest.getPassword()));
            }
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
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

        // Soft delete instead of hard delete
        user.setDeleted(true);
        userRepository.save(user);
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

    @Override
    public User createUserByAdmin(CreateUserRequest createRequest) {
        if (userRepository.existsByUsername(createRequest.getUsername())) {
            throw new RuntimeException("Username is already taken!");
        }

        if (userRepository.existsByEmail(createRequest.getEmail())) {
            throw new RuntimeException("Email is already in use!");
        }

        User user = new User();
        user.setFirstName(createRequest.getFirstName());
        user.setLastName(createRequest.getLastName());
        user.setUsername(createRequest.getUsername());
        user.setEmail(createRequest.getEmail());
        user.setPassword(passwordEncoder.encode(createRequest.getPassword()));
        user.setEnabled(true); // Admin-created users are enabled by default
        user.setCreatedByAdmin(true);
        user.setTemporaryPassword(true);
        user.setTemporaryPasswordExpiry(LocalDateTime.now().plusDays(7));
        user.setAdminPasswordChange(true);

        // Set deletion-related fields
        user.setDeleted(false);

        // Set email verification fields
        user.setEmailVerified(false); // Start as unverified
        user.setEmailVerificationRequired(true); // Require verification

        // Generate verification token
        String verificationToken = UUID.randomUUID().toString();
        user.setVerificationToken(verificationToken);

        // Set creation info
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl adminUser = (UserDetailsImpl) auth.getPrincipal();
            user.setCreatedBy(adminUser.getUsername());
        }

        // Set role based on request
        Set<Role> roles = new HashSet<>();
        Role role = roleRepository.findByName(ERole.valueOf(createRequest.getRole()))
                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
        roles.add(role);
        user.setRoles(roles);

        // Save user first to get the ID
        user = userRepository.save(user);

        // Send verification email after saving
        try {
            emailService.sendVerificationEmail(user.getEmail(), verificationToken);
        } catch (Exception e) {
            // Log the error but don't fail the user creation
            System.err.println("Failed to send verification email: " + e.getMessage());
        }

        return user;
    }

    @Override
    public User updateUserByAdmin(Long id, UpdateProfileRequest updateRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));

        if (updateRequest.getFirstName() != null) {
            user.setFirstName(updateRequest.getFirstName());
        }
        if (updateRequest.getLastName() != null) {
            user.setLastName(updateRequest.getLastName());
        }
        if (updateRequest.getUsername() != null) {
            user.setUsername(updateRequest.getUsername());
        }
        if (updateRequest.getEmail() != null) {
            user.setEmail(updateRequest.getEmail());
        }
        if (updateRequest.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(updateRequest.getPassword()));
            user.setTemporaryPassword(true);
            user.setTemporaryPasswordExpiry(LocalDateTime.now().plusDays(7));
        }

        // Set createdByAdmin to true for admin-updated users
        user.setCreatedByAdmin(true);

        return userRepository.save(user);
    }

    @Override
    public void deleteUserByAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));
        user.setDeleted(true);
        userRepository.save(user);
    }

    @Override
    public User changePassword(Long userId, ChangePasswordRequest passwordRequest, boolean isAdmin) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

        // For non-admin users, verify current password
        if (!isAdmin) {
            if (!passwordEncoder.matches(passwordRequest.getCurrentPassword(), user.getPassword())) {
                throw new RuntimeException("Current password is incorrect");
            }
        }

        // Verify new password and confirm password match
        if (!passwordRequest.getNewPassword().equals(passwordRequest.getConfirmPassword())) {
            throw new RuntimeException("New password and confirm password do not match");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(passwordRequest.getNewPassword()));

        // If admin is changing the password, mark it as temporary
        if (isAdmin) {
            user.setTemporaryPassword(true);
            user.setTemporaryPasswordExpiry(LocalDateTime.now().plusDays(7));
        } else {
            user.setTemporaryPassword(false);
            user.setTemporaryPasswordExpiry(null);
        }

        User updatedUser = userRepository.save(user);

        // If user had a temporary password, set it to false after successful change
        if (updatedUser.isTemporaryPassword()) {
            updatedUser.setTemporaryPassword(false);
            updatedUser.setTemporaryPasswordExpiry(null);
            updateUser(updatedUser);
        }

        return updatedUser;
    }

    // Add method to get user by ID
    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));
    }

    @Override
    public User updateUser(User user) {
        try {
            // Ensure all verification-related fields are properly updated
            if (user.isEmailVerified()) {
                user.setEmailVerificationRequired(false);
                user.setVerificationToken(null);
            }

            return userRepository.save(user);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update user: " + e.getMessage());
        }
    }

    @Override
    public User findByVerificationToken(String token) {
        return userRepository.findByVerificationToken(token)
                .orElse(null);
    }

    @Override
    public User findByPendingEmailToken(String token) {
        return userRepository.findByPendingEmailToken(token)
                .orElse(null);
    }
}