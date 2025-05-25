package com.mathquest.demo.DTO;

import com.mathquest.demo.Model.Activity;
import com.mathquest.demo.Model.ActivityType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityDTO {
    private Long id;
    private String title;
    private String description;
    private ActivityType type;
    private String content;
    private String imageUrl;
    private Integer orderIndex;
    private Integer maxScore;
    private Integer timeLimit;
    private Long classroomId;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
    private ActivityCompletionDTO studentCompletion;

    public static ActivityDTO fromActivity(Activity activity, String imageUrl) {
        ActivityDTO dto = new ActivityDTO();
        dto.setId(activity.getId());
        dto.setTitle(activity.getTitle());
        dto.setDescription(activity.getDescription());
        dto.setType(activity.getType());
        dto.setContent(activity.getContent());
        dto.setImageUrl(imageUrl);
        dto.setOrderIndex(activity.getOrderIndex());
        dto.setMaxScore(activity.getMaxScore());
        dto.setTimeLimit(activity.getTimeLimit());
        dto.setClassroomId(activity.getClassroom().getId());
        dto.setCreatedDate(activity.getCreatedDate());
        dto.setUpdatedDate(activity.getUpdatedDate());
        return dto;
    }
}