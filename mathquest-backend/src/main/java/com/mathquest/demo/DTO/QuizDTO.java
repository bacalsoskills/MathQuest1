package com.mathquest.demo.DTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizDTO {
    private Long id;
    private Long activityId;
    private String quizName;
    private String description;
    private Boolean repeatable;
    private Integer totalItems;
    private Integer passingScore;
    private Integer overallScore;
    private Integer maxAttempts;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime availableFrom;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime availableTo;

    private Integer timeLimitMinutes;
    private String quizContent; // JSON string containing quiz questions, options, and answers
}