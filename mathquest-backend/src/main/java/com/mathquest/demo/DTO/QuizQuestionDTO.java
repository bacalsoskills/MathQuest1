package com.mathquest.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestionDTO {
    private Long id;
    private Long quizId;
    private Integer questionNumber;
    private String questionType;
    private String questionText;
    private String options;
    private String correctAnswer;
    private Integer points;
}