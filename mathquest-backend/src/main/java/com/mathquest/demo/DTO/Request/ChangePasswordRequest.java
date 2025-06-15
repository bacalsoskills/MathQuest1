package com.mathquest.demo.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {
    @NotBlank
    @Size(max = 120)
    private String currentPassword;

    @NotBlank
    @Size(max = 120)
    private String newPassword;

    @NotBlank
    @Size(max = 120)
    private String confirmPassword;
}