package com.mathquest.demo.Model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "quiz_attempts")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    @JsonIgnoreProperties({ "activity", "quizContent" })
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({ "password", "email", "role", "classrooms" })
    private User student;

    private Integer attemptNumber;

    private Integer score;

    @Column(nullable = false)
    private Boolean passed = false;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String answers; // JSON string with answers

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "time_spent_seconds")
    private Integer timeSpentSeconds;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public QuizAttempt(Quiz quiz, User student, Integer attemptNumber) {
        this.quiz = quiz;
        this.student = student;
        this.attemptNumber = attemptNumber;
        this.startedAt = LocalDateTime.now();
    }

    public void complete(Integer score, String answers, Integer timeSpentSeconds) {
        this.score = score;
        this.answers = answers;
        this.timeSpentSeconds = timeSpentSeconds;
        this.completedAt = LocalDateTime.now();
        this.passed = score >= this.quiz.getPassingScore();
    }
}