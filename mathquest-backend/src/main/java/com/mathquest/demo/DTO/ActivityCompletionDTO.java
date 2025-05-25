package com.mathquest.demo.DTO;

import com.mathquest.demo.Model.ActivityCompletion;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityCompletionDTO {
    private Long id;
    private Long activityId;
    private Long studentId;
    private String studentName;
    private Integer score;
    private Integer timeSpent;
    private String answers;
    private Boolean completed;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    public static ActivityCompletionDTO fromActivityCompletion(ActivityCompletion completion) {
        ActivityCompletionDTO dto = new ActivityCompletionDTO();
        dto.setId(completion.getId());
        dto.setActivityId(completion.getActivity().getId());
        dto.setStudentId(completion.getStudent().getId());
        dto.setStudentName(completion.getStudent().getUsername());
        dto.setScore(completion.getScore());
        dto.setTimeSpent(completion.getTimeSpent());
        dto.setAnswers(completion.getAnswers());
        dto.setCompleted(completion.getCompleted());
        dto.setStartedAt(completion.getStartedAt());
        dto.setCompletedAt(completion.getCompletedAt());
        return dto;
    }
}