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
@Table(name = "lessons")
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    private String title;

    @Size(max = 500)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @Lob
    @Column(name = "image", columnDefinition = "LONGBLOB")
    private byte[] image;

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ContentBlock> contentBlocks = new ArrayList<>();

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Quiz> quizzes = new ArrayList<>();

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LessonCompletion> lessonCompletions = new ArrayList<>();

    private Integer orderIndex;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_date", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdDate;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_date")
    @UpdateTimestamp
    private LocalDateTime updatedDate;

    public Lesson(String title, String description, Classroom classroom, Integer orderIndex) {
        this.title = title;
        this.description = description;
        this.classroom = classroom;
        this.orderIndex = orderIndex;
    }

    public Lesson(String title, String description, Classroom classroom, byte[] image, Integer orderIndex) {
        this.title = title;
        this.description = description;
        this.classroom = classroom;
        this.image = image;
        this.orderIndex = orderIndex;
    }
}