package com.mathquest.demo.DTO;

import com.mathquest.demo.Model.ContentBlock;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContentBlockDTO {
    private Long id;
    private String title;
    private String subtitle;
    private String content;
    private String structuredContent;
    private String imagesUrl;
    private String attachmentsUrl;
    private Integer orderIndex;
    private Long lessonId;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;

    public static ContentBlockDTO fromContentBlock(ContentBlock contentBlock, String imagesUrl, String attachmentsUrl) {
        ContentBlockDTO dto = new ContentBlockDTO();
        dto.setId(contentBlock.getId());
        dto.setStructuredContent(contentBlock.getStructuredContent());
        dto.setImagesUrl(imagesUrl);
        dto.setAttachmentsUrl(attachmentsUrl);
        dto.setOrderIndex(contentBlock.getOrderIndex());
        dto.setLessonId(contentBlock.getLesson().getId());
        dto.setCreatedDate(contentBlock.getCreatedDate());
        dto.setUpdatedDate(contentBlock.getUpdatedDate());
        return dto;
    }

    public static ContentBlockDTO fromContentBlock(ContentBlock contentBlock) {
        return fromContentBlock(contentBlock, null, null);
    }
}