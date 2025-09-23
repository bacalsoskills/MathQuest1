package com.mathquest.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MultiplicationLearningProgressDTO {
    private Long id;
    private Long userId;
    private String username;
    private List<Integer> completedProperties;
    private Integer activePropertyIndex;
    private Integer totalPropertiesCompleted;
    private LocalDateTime lastUpdated;
    private LocalDateTime createdAt;
    private List<MultiplicationPropertyCompletionDTO> propertyCompletions;
    private List<MultiplicationQuizAttemptDTO> recentQuizAttempts;
}
