package com.mathquest.demo.DTO;

import com.mathquest.demo.Model.GameType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameDTO {
    private Long id;
    private String name;
    private String instructions;
    private String topic;
    private String level;
    private GameType type;
    private String gameContent;
    private Long activityId;
    private Integer maxLevels;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
}