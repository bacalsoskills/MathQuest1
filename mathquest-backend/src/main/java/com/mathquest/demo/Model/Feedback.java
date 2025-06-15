package com.mathquest.demo.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "feedback")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Feedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_number", unique = true)
    private String ticketNumber;

    @Column(name = "subject")
    private String subject;

    @Column(name = "info", columnDefinition = "TEXT")
    private String info;

    @Column(name = "date_submission")
    private LocalDateTime dateSubmission;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private FeedbackStatus status;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "admin_response", columnDefinition = "TEXT")
    private String adminResponse;

    public enum FeedbackStatus {
        PENDING,
        IN_PROGRESS,
        IN_REVIEW,
        COMPLETED,
        REJECTED
    }
}