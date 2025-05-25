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
@Table(name = "leaderboard_entries")
public class LeaderboardEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    private Integer highestScore;

    private Integer fastestTimeSeconds;

    private Integer bestAttemptNumber;

    private Integer totalQuizzesCompleted;

    @Column(name = "entry_rank")
    private Integer rank;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public LeaderboardEntry(User student, Quiz quiz, Classroom classroom,
            Integer highestScore, Integer fastestTimeSeconds,
            Integer bestAttemptNumber, Integer rank) {
        this.student = student;
        this.quiz = quiz;
        this.classroom = classroom;
        this.highestScore = highestScore;
        this.fastestTimeSeconds = fastestTimeSeconds;
        this.bestAttemptNumber = bestAttemptNumber;
        this.rank = rank;
        this.totalQuizzesCompleted = 1;
    }

    // Constructor for aggregated classroom leaderboard
    public LeaderboardEntry(User student, Classroom classroom, Quiz quiz,
            Integer totalScore, Integer bestTime, Long totalQuizzes) {
        this.student = student;
        this.classroom = classroom;
        this.quiz = quiz;
        this.highestScore = totalScore;
        this.fastestTimeSeconds = bestTime;
        this.totalQuizzesCompleted = totalQuizzes.intValue();
        this.rank = 0; // Will be set after sorting
    }

    public void updateScore(Integer score, Integer timeSeconds, Integer attemptNumber) {
        if (score > this.highestScore) {
            this.highestScore = score;
            this.bestAttemptNumber = attemptNumber;
        }

        if (timeSeconds < this.fastestTimeSeconds || this.fastestTimeSeconds == null) {
            this.fastestTimeSeconds = timeSeconds;
        }

        this.totalQuizzesCompleted++;
    }
}