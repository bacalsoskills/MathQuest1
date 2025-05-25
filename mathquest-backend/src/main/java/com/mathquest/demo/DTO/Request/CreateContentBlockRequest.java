package com.mathquest.demo.DTO.Request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateContentBlockRequest {
    private String title;

    private String subtitle;

    private String content;

    private String structuredContent;

    private MultipartFile images;

    private MultipartFile attachments;

    private Integer orderIndex;

    @NotNull
    private Long lessonId;
}