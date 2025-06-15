package com.mathquest.demo.DTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttemptDTO {
    private Long id;
    private Long quizId;
    private String quizName;
    private Long studentId;
    private String studentName;
    private Integer attemptNumber;
    private Integer score;
    private Boolean passed;
    private String answers;
    private Integer rank;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startedAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime completedAt;

    private Integer timeSpentSeconds;
    private String formattedTimeSpent; // e.g. "5m 30s"

    private Long classroomId;
}