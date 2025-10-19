package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.Request.CreateUserRequest;
import com.mathquest.demo.DTO.Request.UpdateProfileRequest;
import com.mathquest.demo.DTO.Request.ChangePasswordRequest;
import com.mathquest.demo.Model.User;

import java.util.List;

public interface UserService {
    User getUserProfile(String username);

    User getUserProfile(Long userId);

    User updateUserProfile(Long userId, User userDetails);

    User updateUserProfile(Long userId, UpdateProfileRequest updateRequest);

    User verifyEmailUpdate(String token);

    User removeProfileImage(Long userId);

    void deleteUser(Long userId);

    List<User> getAllUsers();

    void deleteUserById(Long userId);

    // Admin specific methods
    User createUserByAdmin(CreateUserRequest createRequest);

    User updateUserByAdmin(Long userId, UpdateProfileRequest updateRequest);

    void deleteUserByAdmin(Long userId);

    User getUserById(Long userId);

    User updateUser(User user);

    // Password change method
    User changePassword(Long userId, ChangePasswordRequest passwordRequest, boolean isAdmin);

    User findByVerificationToken(String token);

    User findByPendingEmailToken(String token);
}