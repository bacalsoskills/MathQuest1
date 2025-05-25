package com.mathquest.demo.DTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportDTO {
    private Long id;
    private Long classroomId;
    private String classroomName;
    private Long teacherId;
    private String teacherName;
    private String reportName;
    private String reportDescription;
    private String reportType;
    private String reportData;
    private Boolean hasFile;
    private String fileType;
    private String fileName;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
}