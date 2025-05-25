package com.mathquest.demo.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "classrooms")
public class Classroom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    private String name;

    @Size(max = 500)
    private String description;

    @NotBlank
    @Size(max = 10)
    @Column(unique = true)
    private String classCode;

    @Column(unique = true)
    private String shortCode;

    @Lob
    @Column(name = "image", columnDefinition = "LONGBLOB")
    private byte[] image;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @OneToMany(mappedBy = "classroom", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ClassroomStudent> students = new HashSet<>();

    @OneToMany(mappedBy = "classroom", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Activity> activities = new ArrayList<>();

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_date", nullable = false, updatable = false)
    @CreationTimestamp
    private java.time.LocalDateTime createdDate;

    public Classroom(String name, String description, String classCode, String shortCode, User teacher) {
        this.name = name;
        this.description = description;
        this.classCode = classCode;
        this.shortCode = shortCode;
        this.teacher = teacher;
    }

    public Classroom(String name, String description, String classCode, String shortCode, byte[] image, User teacher) {
        this.name = name;
        this.description = description;
        this.classCode = classCode;
        this.shortCode = shortCode;
        this.image = image;
        this.teacher = teacher;
    }
}