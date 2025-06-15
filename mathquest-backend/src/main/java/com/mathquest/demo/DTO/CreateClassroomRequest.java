package com.mathquest.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateClassroomRequest {
    @NotBlank(message = "Classroom name is required")
    @Size(max = 100, message = "Classroom name must be less than 100 characters")
    private String name;

    @Size(max = 500, message = "Description must be less than 500 characters")
    private String description;

    private MultipartFile image;

    @Size(max = 10, message = "Short code must be less than 10 characters")
    private String shortCode;

    private Long teacherId;
}