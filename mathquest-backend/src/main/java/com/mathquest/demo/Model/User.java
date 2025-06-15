package com.mathquest.demo.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = "username"),
        @UniqueConstraint(columnNames = "email")
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 50)
    private String firstName;

    @NotBlank
    @Size(max = 50)
    private String lastName;

    @NotBlank
    @Size(max = 20)
    private String username;

    @NotBlank
    @Size(max = 50)
    @Email
    private String email;

    @Size(max = 50)
    @Email
    private String pendingEmail;

    private String pendingEmailToken;

    private LocalDateTime pendingEmailTokenExpiry;

    @NotBlank
    @Size(max = 120)
    private String password;

    @Lob
    @Column(name = "profile_image", columnDefinition = "LONGBLOB")
    private byte[] profileImage;

    @Column(name = "profile_image_name")
    private String profileImageName;

    private boolean enabled = false;

    @Column(name = "verification_token")
    private String verificationToken;

    private String resetPasswordToken;

    private LocalDateTime resetPasswordTokenExpiry;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();

    // New fields for admin-created users
    @Column(nullable = false)
    private boolean createdByAdmin = false;
    private boolean temporaryPassword = false;
    private LocalDateTime temporaryPasswordExpiry;
    @Column(name = "admin_password_change", nullable = false)
    private boolean adminPasswordChange = false;

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;

    @Column(name = "deleted", nullable = false)
    private boolean deleted = false;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Column(name = "password_expiry_date")
    private LocalDateTime passwordExpiryDate;

    @Column(name = "email_verification_required", nullable = false)
    private boolean emailVerificationRequired = false;

    // Constructor with required fields
    public User(String firstName, String lastName, String username, String email, String password) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
        this.email = email;
        this.password = password;
        this.createdByAdmin = false;
        this.emailVerified = false;
        this.emailVerificationRequired = true;
        this.deleted = false;
        this.isDeleted = false;
        this.adminPasswordChange = false;
    }

    // Add getters and setters for new fields
    public String getResetPasswordToken() {
        return resetPasswordToken;
    }

    public void setResetPasswordToken(String resetPasswordToken) {
        this.resetPasswordToken = resetPasswordToken;
    }

    public LocalDateTime getResetPasswordTokenExpiry() {
        return resetPasswordTokenExpiry;
    }

    public void setResetPasswordTokenExpiry(LocalDateTime resetPasswordTokenExpiry) {
        this.resetPasswordTokenExpiry = resetPasswordTokenExpiry;
    }

    // Add explicit getter and setter for createdByAdmin
    public boolean isCreatedByAdmin() {
        return createdByAdmin;
    }

    public void setCreatedByAdmin(boolean createdByAdmin) {
        this.createdByAdmin = createdByAdmin;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public boolean isEmailVerificationRequired() {
        return emailVerificationRequired;
    }

    public void setEmailVerificationRequired(boolean emailVerificationRequired) {
        this.emailVerificationRequired = emailVerificationRequired;
    }
}