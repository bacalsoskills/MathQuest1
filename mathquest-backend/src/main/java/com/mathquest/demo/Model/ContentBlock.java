package com.mathquest.demo.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "content_blocks")
public class ContentBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Lob
    @Column(name = "structured_content", columnDefinition = "LONGTEXT")
    private String structuredContent;

    @Lob
    @Column(name = "images", columnDefinition = "LONGBLOB")
    private byte[] images;

    @Lob
    @Column(name = "attachments", columnDefinition = "LONGBLOB")
    private byte[] attachments;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_date", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdDate;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_date")
    @UpdateTimestamp
    private LocalDateTime updatedDate;

    @Column(name = "order_index")
    private Integer orderIndex;

    /**
     * Constructor for creating a content block with rich structured content
     */
    public ContentBlock(String structuredContent, Integer orderIndex, Lesson lesson) {
        this.structuredContent = structuredContent;
        this.orderIndex = orderIndex;
        this.lesson = lesson;
    }

    /**
     * Constructor for creating a content block with rich content and images
     */
    public ContentBlock(byte[] images, Integer orderIndex, Lesson lesson) {
        this.images = images;
        this.orderIndex = orderIndex;
        this.lesson = lesson;
    }

    /**
     * Constructor for creating a content block with rich structured content
     * (without order)
     */
    public ContentBlock(String structuredContent, Lesson lesson) {
        this(structuredContent, null, lesson);
    }

    /**
     * Constructor for creating a content block with rich content and images
     * (without order)
     */
    public ContentBlock(byte[] images, Lesson lesson) {
        this(images, null, lesson);
    }
}