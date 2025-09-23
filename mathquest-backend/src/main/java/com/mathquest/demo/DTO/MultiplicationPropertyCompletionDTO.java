package com.mathquest.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MultiplicationPropertyCompletionDTO {
    private Long id;
    private Integer propertyIndex;
    private String propertyName;
    private String badgeName;
    private LocalDateTime completedAt;
    private Integer totalSteps;
    private Long completionTimeSeconds;
}
