package com.mathquest.demo.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User teacher;

    @Column(nullable = false)
    private String reportName;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String reportDescription;

    @Column(nullable = false)
    private String reportType; // QUIZ_PERFORMANCE, CLASS_RECORD, etc.

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String reportData; // JSON string with report data

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(columnDefinition = "MEDIUMBLOB")
    private byte[] fileData; // Can be CSV, Excel, PDF, etc.

    private String fileType; // CSV, EXCEL, PDF

    private String fileName;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Report(Classroom classroom, User teacher, String reportName, String reportDescription,
            String reportType, String reportData) {
        this.classroom = classroom;
        this.teacher = teacher;
        this.reportName = reportName;
        this.reportDescription = reportDescription;
        this.reportType = reportType;
        this.reportData = reportData;
        this.createdAt = LocalDateTime.now();
    }

    public Report(Classroom classroom, User teacher, String reportName, String reportDescription,
            String reportType, String reportData, byte[] fileData, String fileType, String fileName) {
        this.classroom = classroom;
        this.teacher = teacher;
        this.reportName = reportName;
        this.reportDescription = reportDescription;
        this.reportType = reportType;
        this.reportData = reportData;
        this.fileData = fileData;
        this.fileType = fileType;
        this.fileName = fileName;
        this.createdAt = LocalDateTime.now();
    }
}