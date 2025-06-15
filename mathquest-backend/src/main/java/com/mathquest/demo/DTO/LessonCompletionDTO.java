package com.mathquest.demo.DTO;

import com.mathquest.demo.Model.LessonCompletion;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LessonCompletionDTO {
    private Long id;
    private Long lessonId;
    private Long studentId;
    private Boolean contentRead;
    private Boolean quizCompleted;
    private Integer quizScore;
    private LocalDateTime contentReadAt;
    private LocalDateTime quizCompletedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static LessonCompletionDTO fromLessonCompletion(LessonCompletion completion) {
        LessonCompletionDTO dto = new LessonCompletionDTO();
        dto.setId(completion.getId());
        dto.setLessonId(completion.getLesson().getId());
        dto.setStudentId(completion.getStudent().getId());
        dto.setContentRead(completion.getContentRead());
        dto.setQuizCompleted(completion.getQuizCompleted());
        dto.setQuizScore(completion.getQuizScore());
        dto.setContentReadAt(completion.getContentReadAt());
        dto.setQuizCompletedAt(completion.getQuizCompletedAt());
        dto.setCreatedAt(completion.getCreatedAt());
        dto.setUpdatedAt(completion.getUpdatedAt());
        return dto;
    }
}