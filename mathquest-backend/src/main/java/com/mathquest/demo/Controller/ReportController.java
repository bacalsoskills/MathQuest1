package com.mathquest.demo.Controller;

import com.mathquest.demo.DTO.ReportDTO;
import com.mathquest.demo.Service.ReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reports")
@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
public class ReportController {

    private static final Logger logger = LoggerFactory.getLogger(ReportController.class);

    @Autowired
    private ReportService reportService;

    @PostMapping("/quiz-performance")
    public ResponseEntity<ReportDTO> generateQuizPerformanceReport(@RequestBody Map<String, Object> payload) {
        Long classroomId = Long.valueOf(payload.get("classroomId").toString());
        Long teacherId = Long.valueOf(payload.get("teacherId").toString());
        String reportName = (String) payload.get("reportName");
        String reportDescription = (String) payload.get("reportDescription");

        logger.info("Generating quiz performance report for classroom: {}, teacher: {}", classroomId, teacherId);
        ReportDTO report = reportService.generateQuizPerformanceReport(
                classroomId, teacherId, reportName, reportDescription);
        logger.info("Generated quiz performance report with ID: {}", report.getId());

        return ResponseEntity.ok(report);
    }

    @PostMapping("/class-record")
    public ResponseEntity<?> generateClassRecordReport(@RequestBody Map<String, Object> payload) {
        try {
            logger.info("Received class record report generation request");
            logger.debug("Payload: {}", payload);

            // Validate required fields
            if (!payload.containsKey("classroomId") || !payload.containsKey("teacherId")) {
                logger.error("Missing required fields in payload");
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Missing required fields: classroomId and teacherId are required"));
            }

            Long classroomId = Long.valueOf(payload.get("classroomId").toString());
            Long teacherId = Long.valueOf(payload.get("teacherId").toString());
            String reportName = (String) payload.get("reportName");
            String reportDescription = (String) payload.get("reportDescription");
            String fileType = payload.containsKey("fileType") ? (String) payload.get("fileType") : "EXCEL";

            logger.info("Generating class record report - Classroom: {}, Teacher: {}, Type: {}",
                    classroomId, teacherId, fileType);

            ReportDTO report = reportService.generateClassRecordReport(
                    classroomId, teacherId, reportName, reportDescription, fileType);

            logger.info("Generated class record report with ID: {}", report.getId());
            logger.debug("Report details - Name: {}, Type: {}, HasFile: {}",
                    report.getReportName(), report.getReportType(), report.getHasFile());

            return ResponseEntity.ok(report);
        } catch (NumberFormatException e) {
            logger.error("Invalid ID format in request", e);
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid ID format: classroomId and teacherId must be numbers"));
        } catch (IllegalArgumentException e) {
            logger.error("Invalid argument in request", e);
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error generating class record report", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error generating report: " + e.getMessage()));
        }
    }

    @GetMapping("/{reportId}")
    public ResponseEntity<ReportDTO> getReport(@PathVariable Long reportId) {
        logger.info("Fetching report with ID: {}", reportId);
        ReportDTO report = reportService.getReport(reportId);
        logger.debug("Found report - Name: {}, Type: {}", report.getReportName(), report.getReportType());
        return ResponseEntity.ok(report);
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<ReportDTO>> getReportsByTeacher(@PathVariable Long teacherId) {
        logger.info("Fetching reports for teacher: {}", teacherId);
        List<ReportDTO> reports = reportService.getReportsByTeacher(teacherId);
        logger.info("Found {} reports for teacher {}", reports.size(), teacherId);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/classroom/{classroomId}")
    public ResponseEntity<List<ReportDTO>> getReportsByClassroom(@PathVariable Long classroomId) {
        logger.info("Fetching reports for classroom: {}", classroomId);
        List<ReportDTO> reports = reportService.getReportsByClassroom(classroomId);
        logger.info("Found {} reports for classroom {}", reports.size(), classroomId);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/{reportId}/download")
    public ResponseEntity<?> downloadReportFile(@PathVariable Long reportId) {
        try {
            logger.info("Downloading report file with ID: {}", reportId);

            ReportDTO report = reportService.getReport(reportId);
            logger.debug("Found report for download - Name: {}, Type: {}",
                    report.getReportName(), report.getReportType());

            byte[] fileData = reportService.downloadReportFile(reportId);
            logger.info("Retrieved file data for report {}, size: {} bytes", reportId, fileData.length);

            HttpHeaders headers = new HttpHeaders();
            String contentType;
            if ("EXCEL".equalsIgnoreCase(report.getFileType())) {
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            } else if ("CSV".equalsIgnoreCase(report.getFileType())) {
                contentType = "text/csv";
            } else {
                contentType = "application/octet-stream";
            }
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentDispositionFormData("attachment", report.getFileName());

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(fileData);
        } catch (Exception e) {
            logger.error("Error downloading report file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error downloading report: " + e.getMessage()));
        }
    }

    @GetMapping("/classroom/{classroomId}/analytics")
    public ResponseEntity<Map<String, Object>> getClassRecordAnalytics(@PathVariable Long classroomId) {
        logger.info("Fetching analytics for classroom: {}", classroomId);
        Map<String, Object> analytics = reportService.getClassRecordAnalytics(classroomId);
        logger.debug("Retrieved analytics data for classroom {}", classroomId);
        return ResponseEntity.ok(analytics);
    }
}