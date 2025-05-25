package com.mathquest.demo.DTO;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
public class JoinClassroomRequest {
    @NotBlank(message = "Class code is required")
    @Size(min = 6, max = 10, message = "Class code must be between 6 and 10 characters")
    private String classCode;
}