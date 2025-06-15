package com.mathquest.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryDTO {
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentUsername;
    private Long quizId;
    private String quizName;
    private Integer highestScore;
    private Integer fastestTimeSeconds;
    private String formattedFastestTime; // e.g. "5m 30s"
    private Integer bestAttemptNumber;
    private Integer totalQuizzesCompleted;
    private Integer rank;
    private Integer attempts;
    private Integer totalScores;
    private Double finalScore; // Average score across all attempts
    private double averageScore;
    private double totalScore;
}