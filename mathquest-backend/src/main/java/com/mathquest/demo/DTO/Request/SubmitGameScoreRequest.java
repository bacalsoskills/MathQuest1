package com.mathquest.demo.DTO.Request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmitGameScoreRequest {

    @NotNull
    private Long gameId;

    @NotNull
    private Integer score;

    private Integer level;

    private Integer timeTaken;
}