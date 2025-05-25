package com.mathquest.demo.DTO.Request;

import com.mathquest.demo.Model.GameType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateGameRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    @Size(max = 500)
    private String instructions;

    @NotBlank
    @Size(max = 100)
    private String topic;

    @Size(max = 50)
    private String level;

    @NotNull
    private GameType type;

    private String customContent;

    private Long activityId;

    private Long classroomId;

    private Integer orderIndex;
}