package com.mathquest.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameScoreDTO {
    private Long id;
    private Integer score;
    private Integer timeTaken;
    private Long gameId;
    private String gameName;
    private String gameType;
    private Long studentId;
    private String studentName;
    private String studentUsername;
    private LocalDateTime playedAt;
    private Integer rank;
    private Integer levelAchieved;

    // Constructor without rank for backward compatibility
    public GameScoreDTO(Long id, Integer score, Integer timeTaken,
            Long gameId, String gameName, String gameType, Long studentId, String studentName,
            String studentUsername, LocalDateTime playedAt) {
        this.id = id;
        this.score = score;
        this.timeTaken = timeTaken;
        this.gameId = gameId;
        this.gameName = gameName;
        this.gameType = gameType;
        this.studentId = studentId;
        this.studentName = studentName;
        this.studentUsername = studentUsername;
        this.playedAt = playedAt;
        this.rank = null;
    }

    // It's better to have a constructor that includes all fields for clarity if
    // using @AllArgsConstructor
    // Or ensure the convertToScoreDTO method in GameServiceImpl correctly populates
    // this new field.
}