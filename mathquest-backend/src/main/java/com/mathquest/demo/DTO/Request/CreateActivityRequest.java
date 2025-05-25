package com.mathquest.demo.DTO.Request;

import com.mathquest.demo.Model.ActivityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateActivityRequest {
    @NotBlank
    @Size(max = 100)
    private String title;

    @Size(max = 500)
    private String description;

    @NotNull
    private ActivityType type;

    @NotNull
    private String content;

    private MultipartFile image;

    private Integer orderIndex;

    private Integer maxScore;

    private Integer timeLimit;

    @NotNull
    private Long classroomId;
}