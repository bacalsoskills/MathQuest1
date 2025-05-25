package com.mathquest.demo.DTO;

import com.mathquest.demo.Model.Activity;
import com.mathquest.demo.Model.ActivityType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivitySummaryDTO {
    private Long id;
    private String title;
    private ActivityType type;
    private String imageUrl;
    private Integer orderIndex;
    private Integer maxScore;
    private Boolean completed;
    private Integer score;

    public static ActivitySummaryDTO fromActivity(Activity activity, String imageUrl, Boolean completed, Integer score) {
        ActivitySummaryDTO dto = new ActivitySummaryDTO();
        dto.setId(activity.getId());
        dto.setTitle(activity.getTitle());
        dto.setType(activity.getType());
        dto.setImageUrl(imageUrl);
        dto.setOrderIndex(activity.getOrderIndex());
        dto.setMaxScore(activity.getMaxScore());
        dto.setCompleted(completed);
        dto.setScore(score);
        return dto;
    }
} 