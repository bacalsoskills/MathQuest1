package com.mathquest.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentPerformanceDTO {
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentUsername;
    private Long classroomId;
    private String classroomName;
    private Double averageQuizScore;
    private Integer totalQuizzesTaken;
    private Integer totalQuizzesPassed;
    private Integer totalQuizzesFailed;
    private Integer totalPoints;
    private Double averageCompletionTimeSeconds;
    private String formattedAverageCompletionTime; // e.g. "5m 30s"
    private String topicPerformance; // JSON string with performance by topic
}