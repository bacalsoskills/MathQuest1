package com.mathquest.demo.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "multiplication_learning_progress")
public class MultiplicationLearningProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "completed_properties", columnDefinition = "JSON")
    private String completedProperties; // JSON array of completed property indices

    @Column(name = "active_property_index", nullable = false)
    private Integer activePropertyIndex = 0;

    @Column(name = "total_properties_completed", nullable = false)
    private Integer totalPropertiesCompleted = 0;

    @Column(name = "last_updated", nullable = false)
    @UpdateTimestamp
    private LocalDateTime lastUpdated;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "progress", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MultiplicationPropertyCompletion> propertyCompletions = new ArrayList<>();

    @OneToMany(mappedBy = "progress", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MultiplicationQuizAttempt> quizAttempts = new ArrayList<>();

    public MultiplicationLearningProgress(User user) {
        this.user = user;
        this.completedProperties = "[]"; // Empty JSON array
        this.activePropertyIndex = 0;
        this.totalPropertiesCompleted = 0;
    }
}
