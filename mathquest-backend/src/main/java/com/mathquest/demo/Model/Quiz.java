package com.mathquest.demo.Model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "quizzes")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "activity_id", nullable = false)
    @JsonIgnoreProperties({ "quiz", "classroom" })
    private Activity activity;

    private String quizName;

    private String description;

    private Boolean repeatable = false;

    private Integer totalItems;

    private Integer passingScore;

    @Column(nullable = false)
    private Integer overallScore;

    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime availableFrom;

    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime availableTo;

    @Column(name = "time_limit_minutes")
    private Integer timeLimitMinutes;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String quizContent;

    @Column(name = "max_attempts")
    private Integer maxAttempts;

    public Quiz(Activity activity, String quizName, String description, Boolean repeatable,
            Integer totalItems, Integer passingScore, Integer overallScore,
            LocalDateTime availableFrom, LocalDateTime availableTo, Integer timeLimitMinutes,
            String quizContent, Integer maxAttempts) {
        this.activity = activity;
        this.quizName = quizName;
        this.description = description;
        this.repeatable = repeatable;
        this.totalItems = totalItems;
        this.passingScore = passingScore;
        this.overallScore = overallScore;
        this.availableFrom = availableFrom;
        this.availableTo = availableTo;
        this.timeLimitMinutes = timeLimitMinutes;
        this.quizContent = quizContent;
        this.maxAttempts = maxAttempts;
    }
}