package com.mathquest.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomDTO {
    private Long id;

    @NotBlank(message = "Classroom name is required")
    @Size(max = 100, message = "Classroom name must be less than 100 characters")
    private String name;

    @Size(max = 500, message = "Description must be less than 500 characters")
    private String description;

    private String classCode;

    private byte[] image;

    private UserSummaryDTO teacher;

    private Set<UserSummaryDTO> students = new HashSet<>();

    private String shortCode;

    private java.time.LocalDateTime createdDate;

    public void setShortCode(String shortCode) {
        this.shortCode = shortCode;
    }
}