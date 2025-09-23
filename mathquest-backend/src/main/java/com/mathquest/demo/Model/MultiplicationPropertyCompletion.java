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
@Table(name = "multiplication_property_completions")
public class MultiplicationPropertyCompletion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "progress_id", nullable = false)
    private MultiplicationLearningProgress progress;

    @Column(name = "property_index", nullable = false)
    private Integer propertyIndex;

    @Column(name = "property_name", nullable = false)
    private String propertyName;

    @Column(name = "badge_name", nullable = false)
    private String badgeName;

    @Column(name = "completed_at", nullable = false)
    @CreationTimestamp
    private LocalDateTime completedAt;

    @Column(name = "total_steps")
    private Integer totalSteps;

    @Column(name = "completion_time_seconds")
    private Long completionTimeSeconds;

    public MultiplicationPropertyCompletion(MultiplicationLearningProgress progress, Integer propertyIndex, 
                                          String propertyName, String badgeName, Integer totalSteps) {
        this.progress = progress;
        this.propertyIndex = propertyIndex;
        this.propertyName = propertyName;
        this.badgeName = badgeName;
        this.totalSteps = totalSteps;
    }
}
