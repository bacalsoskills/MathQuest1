package com.mathquest.demo.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank
    private String username; // Can be either username or email

    @NotBlank
    private String password;
}