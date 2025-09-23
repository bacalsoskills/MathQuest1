package com.mathquest.demo.Model;

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
@Table(name = "multiplication_quiz_attempts")
public class MultiplicationQuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "progress_id", nullable = false)
    private MultiplicationLearningProgress progress;

    @Column(name = "property_index", nullable = false)
    private Integer propertyIndex;

    @Column(name = "step_index", nullable = false)
    private Integer stepIndex;

    @Column(name = "question", columnDefinition = "TEXT")
    private String question;

    @Column(name = "user_answer", columnDefinition = "TEXT")
    private String userAnswer;

    @Column(name = "correct_answer", columnDefinition = "TEXT")
    private String correctAnswer;

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect;

    @Column(name = "step_type", nullable = false)
    private String stepType; // "quiz" or "challenge"

    @Column(name = "step_title")
    private String stepTitle;

    @Column(name = "attempted_at", nullable = false)
    @CreationTimestamp
    private LocalDateTime attemptedAt;

    public MultiplicationQuizAttempt(MultiplicationLearningProgress progress, Integer propertyIndex, 
                                   Integer stepIndex, String question, String userAnswer, 
                                   String correctAnswer, Boolean isCorrect, String stepType, String stepTitle) {
        this.progress = progress;
        this.propertyIndex = propertyIndex;
        this.stepIndex = stepIndex;
        this.question = question;
        this.userAnswer = userAnswer;
        this.correctAnswer = correctAnswer;
        this.isCorrect = isCorrect;
        this.stepType = stepType;
        this.stepTitle = stepTitle;
    }
}
