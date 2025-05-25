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
@Table(name = "activity_completions")
public class ActivityCompletion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User student;

    private Integer score;

    private Integer timeSpent; // in seconds

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String answers;

    @Column(nullable = false)
    private Boolean completed = false;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_date", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdDate;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_date")
    @UpdateTimestamp
    private LocalDateTime updatedDate;

    public ActivityCompletion(Activity activity, User student) {
        this.activity = activity;
        this.student = student;
        this.startedAt = LocalDateTime.now();
    }

    public ActivityCompletion(Activity activity, User student, Integer score, String answers, Boolean completed) {
        this.activity = activity;
        this.student = student;
        this.score = score;
        this.answers = answers;
        this.completed = completed;
        this.startedAt = LocalDateTime.now();
        if (completed) {
            this.completedAt = LocalDateTime.now();
        }
    }

    public void complete(Integer score, String answers, Integer timeSpent) {
        this.score = score;
        this.answers = answers;
        this.timeSpent = timeSpent;
        this.completed = true;
        this.completedAt = LocalDateTime.now();
    }
}