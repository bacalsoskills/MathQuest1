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
@Table(name = "student_performance")
public class StudentPerformance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    private Double averageQuizScore;

    private Integer totalQuizzesTaken;

    private Integer totalQuizzesPassed;

    private Integer totalQuizzesFailed;

    private Integer totalPoints;

    private Double averageCompletionTimeSeconds;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String topicPerformance; // JSON string with performance by topic

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public StudentPerformance(User student, Classroom classroom) {
        this.student = student;
        this.classroom = classroom;
        this.averageQuizScore = 0.0;
        this.totalQuizzesTaken = 0;
        this.totalQuizzesPassed = 0;
        this.totalQuizzesFailed = 0;
        this.totalPoints = 0;
        this.averageCompletionTimeSeconds = 0.0;
    }

    public void updatePerformance(Integer score, Boolean passed, Integer completionTimeSeconds) {
        this.totalQuizzesTaken++;

        if (passed) {
            this.totalQuizzesPassed++;
        } else {
            this.totalQuizzesFailed++;
        }

        // Recalculate average score
        double totalScore = this.averageQuizScore * (this.totalQuizzesTaken - 1) + score;
        this.averageQuizScore = totalScore / this.totalQuizzesTaken;

        // Recalculate average completion time
        double totalTime = this.averageCompletionTimeSeconds * (this.totalQuizzesTaken - 1) + completionTimeSeconds;
        this.averageCompletionTimeSeconds = totalTime / this.totalQuizzesTaken;

        this.totalPoints += score;
    }
}