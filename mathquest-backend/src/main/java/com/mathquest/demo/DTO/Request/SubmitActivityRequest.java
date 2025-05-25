package com.mathquest.demo.DTO.Request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmitActivityRequest {
    @NotNull
    private Long activityId;

    private String answers;

    private Integer timeSpent;

    private Integer score;
}