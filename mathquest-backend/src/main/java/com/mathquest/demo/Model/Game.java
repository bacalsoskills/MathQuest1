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
@Table(name = "games")
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    private String name;

    @Size(max = 500)
    private String instructions;

    @NotBlank
    @Size(max = 100)
    private String topic;

    @Size(max = 50)
    private String level; // e.g., "easy", "medium", "hard"

    @Column(nullable = false, columnDefinition = "INT DEFAULT 10")
    private Integer maxLevels = 10;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GameType type;

    // For falling game: stores question-answer pairs as JSON
    // For multiple choice game: stores questions and options as JSON
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String gameContent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;

    // Tracks students who have played the game and their scores
    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GameScore> scores = new ArrayList<>();

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_date", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdDate;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_date")
    @UpdateTimestamp
    private LocalDateTime updatedDate;

    public Game(String name, String instructions, String topic, String level, GameType type, String gameContent,
            Activity activity) {
        this.name = name;
        this.instructions = instructions;
        this.topic = topic;
        this.level = level;
        this.type = type;
        this.gameContent = gameContent;
        this.activity = activity;
    }
}