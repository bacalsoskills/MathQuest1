package com.mathquest.demo.DTO;

import com.mathquest.demo.Model.Lesson;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LessonDTO {
    private Long id;
    private String title;
    private String description;
    private Long classroomId;
    private String imageUrl;
    private List<ContentBlockDTO> contentBlocks;
    private List<ActivitySummaryDTO> activities;
    private Integer orderIndex;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;

    public static LessonDTO fromLesson(Lesson lesson, String imageUrl) {
        LessonDTO dto = new LessonDTO();
        dto.setId(lesson.getId());
        dto.setTitle(lesson.getTitle());
        dto.setDescription(lesson.getDescription());
        dto.setClassroomId(lesson.getClassroom().getId());
        dto.setImageUrl(imageUrl);
        dto.setOrderIndex(lesson.getOrderIndex());
        dto.setCreatedDate(lesson.getCreatedDate());
        dto.setUpdatedDate(lesson.getUpdatedDate());
        return dto;
    }
}