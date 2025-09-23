package com.mathquest.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaveQuizAttemptRequest {
    private Integer propertyIndex;
    private Integer stepIndex;
    private String question;
    private String userAnswer;
    private String correctAnswer;
    private Boolean isCorrect;
    private String stepType;
    private String stepTitle;
}
