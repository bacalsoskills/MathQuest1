package com.mathquest.demo.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "lesson_completions")
public class LessonCompletion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User student;

    @Column(nullable = false)
    private Boolean contentRead = false;

    @Column(nullable = false)
    private Boolean quizCompleted = false;

    private Integer quizScore;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "content_read_at")
    private LocalDateTime contentReadAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "quiz_completed_at")
    private LocalDateTime quizCompletedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public LessonCompletion(Lesson lesson, User student) {
        this.lesson = lesson;
        this.student = student;
    }

    public void markContentAsRead() {
        this.contentRead = true;
        this.contentReadAt = LocalDateTime.now();
    }

    public void completeQuiz(Integer score) {
        this.quizCompleted = true;
        this.quizScore = score;
        this.quizCompletedAt = LocalDateTime.now();
    }

    public boolean isFullyCompleted() {
        return contentRead && quizCompleted;
    }
}