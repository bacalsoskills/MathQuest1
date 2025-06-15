package com.mathquest.demo.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "classroom_students")
public class ClassroomStudent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt = LocalDateTime.now();

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @PrePersist
    @PreUpdate
    public void updateUserId() {
        if (student != null && userId == null) {
            this.userId = student.getId();
        }
    }

    public ClassroomStudent(Classroom classroom, User student) {
        this.classroom = classroom;
        this.student = student;
        this.userId = student.getId();
        this.isActive = true;
    }
}