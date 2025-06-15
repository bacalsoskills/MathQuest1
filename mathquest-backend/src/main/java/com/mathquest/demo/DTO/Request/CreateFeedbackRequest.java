package com.mathquest.demo.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateFeedbackRequest {
    @NotBlank(message = "Subject is required")
    private String subject;

    @NotBlank(message = "Info is required")
    private String info;
}