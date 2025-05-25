package com.mathquest.demo.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "quiz_questions")
public class QuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    private Integer questionNumber;

    @Column(nullable = false)
    private String questionType; // MULTIPLE_CHOICE, IDENTIFICATION, TRUE_FALSE, etc.

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String questionText;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String options; // JSON string for multiple choice options

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String correctAnswer;

    private Integer points = 1;

    public QuizQuestion(Quiz quiz, Integer questionNumber, String questionType, String questionText,
            String options, String correctAnswer, Integer points) {
        this.quiz = quiz;
        this.questionNumber = questionNumber;
        this.questionType = questionType;
        this.questionText = questionText;
        this.options = options;
        this.correctAnswer = correctAnswer;
        this.points = points;
    }
}