package com.mathquest.demo.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
@Table(name = "activities")
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    private String title;

    @Size(max = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActivityType type;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Lob
    @Column(name = "image", columnDefinition = "LONGBLOB")
    private byte[] image;

    private Integer orderIndex;

    private Integer maxScore;

    private Integer timeLimit; // in seconds

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @OneToMany(mappedBy = "activity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ActivityCompletion> completions = new ArrayList<>();

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_date", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdDate;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_date")
    @UpdateTimestamp
    private LocalDateTime updatedDate;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    public Activity(String title, String description, ActivityType type, String content, Integer orderIndex,
            Integer maxScore, Classroom classroom) {
        this.title = title;
        this.description = description;
        this.type = type;
        this.content = content;
        this.orderIndex = orderIndex;
        this.maxScore = maxScore;
        this.classroom = classroom;
    }

    public Activity(String title, String description, ActivityType type, String content, byte[] image,
            Integer orderIndex, Integer maxScore, Integer timeLimit, Classroom classroom) {
        this.title = title;
        this.description = description;
        this.type = type;
        this.content = content;
        this.image = image;
        this.orderIndex = orderIndex;
        this.maxScore = maxScore;
        this.timeLimit = timeLimit;
        this.classroom = classroom;
    }
}