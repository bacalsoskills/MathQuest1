package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.ReportDTO;
import com.mathquest.demo.DTO.StudentPerformanceDTO;
import com.mathquest.demo.Model.Classroom;
import com.mathquest.demo.Model.Report;
import com.mathquest.demo.Model.StudentPerformance;
import com.mathquest.demo.Model.User;
import com.mathquest.demo.Model.Quiz;
import com.mathquest.demo.Model.QuizType;
import com.mathquest.demo.Model.QuizAttempt;
import com.mathquest.demo.Repository.ClassroomRepository;
import com.mathquest.demo.Repository.ReportRepository;
import com.mathquest.demo.Repository.StudentPerformanceRepository;
import com.mathquest.demo.Repository.UserRepository;
import com.mathquest.demo.Repository.QuizRepository;
import com.mathquest.demo.Repository.QuizAttemptRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ReportService {

        @Autowired
        private ReportRepository reportRepository;

        @Autowired
        private ClassroomRepository classroomRepository;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private StudentPerformanceService studentPerformanceService;

        @Autowired
        private StudentPerformanceRepository studentPerformanceRepository;

        @Autowired
        private LeaderboardService leaderboardService;

        @Autowired
        private QuizRepository quizRepository;

        @Autowired
        private QuizAttemptRepository quizAttemptRepository;

        /**
         * Generate a quiz performance report
         * 
         * @param classroomId       The classroom ID
         * @param teacherId         The teacher ID
         * @param reportName        The report name
         * @param reportDescription The report description
         * @return The generated report
         */
        @Transactional
        public ReportDTO generateQuizPerformanceReport(Long classroomId, Long teacherId, String reportName,
                        String reportDescription) {
                Classroom classroom = classroomRepository.findById(classroomId)
                                .orElseThrow(() -> new RuntimeException("Classroom not found"));

                User teacher = userRepository.findById(teacherId)
                                .orElseThrow(() -> new RuntimeException("Teacher not found"));

                // Get classroom average score
                Double averageScore = studentPerformanceService.getClassroomAverageScore(classroomId);

                // Get top performers
                List<String> topPerformers = studentPerformanceService.getTopPerformers(classroomId).stream()
                                .map(p -> p.getStudentName() + " (" + p.getAverageQuizScore() + ")")
                                .collect(Collectors.toList());

                // Get students needing attention
                List<String> needingAttention = studentPerformanceService.getStudentsNeedingAttention(classroomId)
                                .stream()
                                .map(p -> p.getStudentName() + " (" + p.getAverageQuizScore() + ")")
                                .collect(Collectors.toList());

                // Create JSON report data
                String reportData = String.format(
                                "{\"classroomName\":\"%s\",\"averageScore\":%.2f,\"topPerformers\":%s,\"needingAttention\":%s,\"generatedAt\":\"%s\"}",
                                classroom.getName(),
                                averageScore != null ? averageScore : 0.0,
                                topPerformers.toString(),
                                needingAttention.toString(),
                                LocalDateTime.now());

                Report report = new Report(
                                classroom,
                                teacher,
                                reportName,
                                reportDescription,
                                "QUIZ_PERFORMANCE",
                                reportData);

                report = reportRepository.save(report);

                return convertToDTO(report);
        }

        /**
         * Generate a class record report with CSV and Excel export
         * 
         * @param classroomId       The classroom ID
         * @param teacherId         The teacher ID
         * @param reportName        The report name
         * @param reportDescription The report description
         * @param fileType          The file type (CSV or Excel)
         * @return The generated report
         */
        @Transactional
        public ReportDTO generateClassRecordReport(Long classroomId, Long teacherId, String reportName,
                        String reportDescription, String fileType) {
                try {
                        System.out.println("Starting generateClassRecordReport. ClassroomId: " + classroomId +
                                        ", TeacherId: " + teacherId + ", FileType: " + fileType);

                        Classroom classroom = classroomRepository.findById(classroomId)
                                        .orElseThrow(() -> new RuntimeException("Classroom not found"));
                        System.out.println("Classroom found: " + classroom.getName());

                        User teacher = userRepository.findById(teacherId)
                                        .orElseThrow(() -> new RuntimeException("Teacher not found"));
                        System.out.println("Teacher found: " + teacher.getFirstName() + " " + teacher.getLastName());

                        // Get all quizzes for the classroom ordered by creation date
                        List<Quiz> quizzes = quizRepository.findByActivity_Classroom(classroom);
                        System.out.println("\n=== Quizzes Information ===");
                        System.out.println("Total quizzes found: " + quizzes.size());
                        quizzes.forEach(quiz -> {
                                System.out.println(
                                                String.format("Quiz: %s (ID: %d, Total Items: %d, Passing Score: %d)",
                                                                quiz.getQuizName(), quiz.getId(), quiz.getTotalItems(),
                                                                quiz.getPassingScore()));
                        });

                        // Get all students in the classroom
                        List<User> students = classroom.getStudents().stream()
                                        .map(cs -> cs.getStudent())
                                        .collect(Collectors.toList());
                        System.out.println("\n=== Students Information ===");
                        System.out.println("Total students found: " + students.size());
                        students.forEach(student -> {
                                System.out.println(String.format("Student: %s %s (ID: %d, Username: %s)",
                                                student.getFirstName(), student.getLastName(), student.getId(),
                                                student.getUsername()));
                        });

                        // Get all quiz attempts for the classroom
                        try {
                                List<QuizAttempt> allAttempts = quizAttemptRepository.findByClassroomId(classroomId);
                                System.out.println("Quiz attempts found: " + allAttempts.size());
                        } catch (Exception e) {
                                System.err.println("Error fetching quiz attempts: " + e.getMessage());
                                e.printStackTrace();
                        }

                        // Get student performances
                        try {
                                List<StudentPerformance> performances = studentPerformanceRepository
                                                .findByClassroom(classroom);
                                System.out.println("Student performances found: " + performances.size());
                        } catch (Exception e) {
                                System.err.println("Error fetching student performances: " + e.getMessage());
                                e.printStackTrace();
                        }

                        // Organize attempts by student and quiz
                        Map<Long, Map<Long, QuizAttempt>> studentQuizAttempts = new HashMap<>();
                        try {
                                List<QuizAttempt> allAttempts = quizAttemptRepository.findByClassroomId(classroomId);
                                System.out.println("Found " + allAttempts.size() + " total quiz attempts");

                                for (QuizAttempt attempt : allAttempts) {
                                        // Skip null or incomplete attempts
                                        if (attempt.getStudent() == null || attempt.getQuiz() == null) {
                                                System.out.println(
                                                                "Skipping invalid attempt - Student or Quiz is null");
                                                continue;
                                        }

                                        Long studentId = attempt.getStudent().getId();
                                        Long quizId = attempt.getQuiz().getId();

                                        // Initialize the map for this student if it doesn't exist
                                        if (!studentQuizAttempts.containsKey(studentId)) {
                                                studentQuizAttempts.put(studentId, new HashMap<>());
                                        }

                                        Map<Long, QuizAttempt> studentAttempts = studentQuizAttempts.get(studentId);

                                        // Only consider completed attempts with scores
                                        if (attempt.getCompletedAt() != null && attempt.getScore() != null) {
                                                // Keep only the highest score attempt for each quiz
                                                if (!studentAttempts.containsKey(quizId) ||
                                                                studentAttempts.get(quizId).getScore() < attempt
                                                                                .getScore()) {

                                                        // Set the passed flag based on the quiz's passing score
                                                        attempt.setPassed(attempt.getScore() >= attempt.getQuiz()
                                                                        .getPassingScore());

                                                        studentAttempts.put(quizId, attempt);
                                                        System.out.println("Added/Updated attempt for student " +
                                                                        attempt.getStudent().getFirstName() + ", quiz "
                                                                        +
                                                                        attempt.getQuiz().getQuizName() + ", score " +
                                                                        attempt.getScore() + ", passed: "
                                                                        + attempt.getPassed());
                                                }
                                        } else {
                                                System.out.println("Skipping incomplete attempt for student " +
                                                                attempt.getStudent().getFirstName() + ", quiz " +
                                                                attempt.getQuiz().getQuizName() +
                                                                " (completed: " + (attempt.getCompletedAt() != null) +
                                                                ", has score: " + (attempt.getScore() != null) + ")");
                                        }
                                }

                                // Print summary of attempts by student
                                System.out.println("\n=== Organized Quiz Attempts by Student ===");
                                for (Long studentId : studentQuizAttempts.keySet()) {
                                        Map<Long, QuizAttempt> attempts = studentQuizAttempts.get(studentId);
                                        User student = userRepository.findById(studentId).orElse(null);
                                        if (student != null) {
                                                System.out.println("\nStudent: " + student.getFirstName() + " "
                                                                + student.getLastName() +
                                                                " (ID: " + studentId + ") has " + attempts.size()
                                                                + " valid attempts");

                                                // Calculate and show average score
                                                double totalScore = 0;
                                                int validAttempts = 0;
                                                for (QuizAttempt attempt : attempts.values()) {
                                                        if (attempt.getScore() != null) {
                                                                totalScore += attempt.getScore();
                                                                validAttempts++;
                                                        }
                                                }
                                                double averageScore = validAttempts > 0 ? totalScore / validAttempts
                                                                : 0;
                                                System.out.println("Average Score: "
                                                                + String.format("%.2f", averageScore) + "%");

                                                // Show individual quiz attempts
                                                for (Quiz quiz : quizzes) {
                                                        QuizAttempt attempt = attempts.get(quiz.getId());
                                                        if (attempt != null) {
                                                                System.out.println(String.format(
                                                                                "  Quiz: %s (ID: %d)\n    Score: %.2f%%\n    Completed: %s\n    Passed: %s",
                                                                                quiz.getQuizName(),
                                                                                quiz.getId(),
                                                                                attempt.getScore(),
                                                                                attempt.getCompletedAt(),
                                                                                attempt.getPassed()));
                                                        } else {
                                                                System.out.println(String.format(
                                                                                "  Quiz: %s (ID: %d) - No attempt",
                                                                                quiz.getQuizName(),
                                                                                quiz.getId()));
                                                        }
                                                }
                                        }
                                }
                        } catch (Exception e) {
                                System.err.println("Error organizing quiz attempts: " + e.getMessage());
                                e.printStackTrace();
                        }

                        // Create JSON report data
                        JSONObject reportDataJson = new JSONObject();
                        try {
                                // Parse the report description which contains the student data from frontend
                                JSONObject reportDescriptionJson = new JSONObject(reportDescription);

                                // Add basic info
                                reportDataJson.put("classroomName", classroom.getName());
                                reportDataJson.put("teacherName", teacher.getFirstName() + " " + teacher.getLastName());
                                reportDataJson.put("generatedAt", LocalDateTime.now().toString());

                                // Add quizzes
                                if (reportDescriptionJson.has("quizzes")) {
                                        reportDataJson.put("quizzes", reportDescriptionJson.getJSONArray("quizzes"));
                                } else {
                                        JSONArray quizzesJson = new JSONArray();
                                        for (Quiz quiz : quizzes) {
                                                JSONObject quizJson = new JSONObject();
                                                quizJson.put("id", quiz.getId());
                                                quizJson.put("quizName", quiz.getQuizName());
                                                quizJson.put("totalItems", quiz.getTotalItems());
                                                quizJson.put("passingScore", quiz.getPassingScore());
                                                quizzesJson.put(quizJson);
                                        }
                                        reportDataJson.put("quizzes", quizzesJson);
                                }

                                // Add students with their scores
                                if (reportDescriptionJson.has("students")) {
                                        reportDataJson.put("students", reportDescriptionJson.getJSONArray("students"));
                                }

                                // Add headers for Excel/CSV generation
                                if (reportDescriptionJson.has("headers")) {
                                        reportDataJson.put("headers", reportDescriptionJson.getJSONArray("headers"));
                                }

                                System.out.println("Report data JSON structure:");
                                System.out.println(reportDataJson.toString(2));
                        } catch (Exception e) {
                                System.err.println("Error creating report data JSON: " + e.getMessage());
                                e.printStackTrace();
                                throw new RuntimeException("Failed to create report data");
                        }

                        // Generate file data based on type
                        byte[] fileData;
                        String fileName = classroom.getName() + "_ClassRecord_" +
                                        LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));

                        try {
                                JSONArray studentRecords = reportDataJson.getJSONArray("students");
                                JSONArray headers = reportDataJson.getJSONArray("headers");

                                if ("CSV".equalsIgnoreCase(fileType)) {
                                        fileData = generateCSVData(studentRecords, headers, classroom, teacher);
                                        fileName += ".csv";
                                } else if ("EXCEL".equalsIgnoreCase(fileType)) {
                                        fileData = generateExcelData(studentRecords, headers, classroom, teacher);
                                        fileName += ".xlsx";
                                } else {
                                        throw new IllegalArgumentException("Unsupported file type: " + fileType);
                                }
                                System.out.println("File data generated successfully. Size: "
                                                + (fileData != null ? fileData.length : 0) + " bytes");
                        } catch (Exception e) {
                                System.err.println("Error generating file data: " + e.getMessage());
                                e.printStackTrace();
                                throw new RuntimeException("Failed to generate file data: " + e.getMessage());
                        }

                        // Create and save the report
                        try {
                                Report report = new Report(
                                                classroom,
                                                teacher,
                                                reportName,
                                                reportDescription,
                                                "CLASS_RECORD",
                                                reportDataJson.toString(), // Save the complete JSON structure
                                                fileData,
                                                fileType,
                                                fileName);

                                report = reportRepository.save(report);
                                System.out.println("Report saved successfully with ID: " + report.getId());
                                return convertToDTO(report);
                        } catch (Exception e) {
                                System.err.println("Error saving report: " + e.getMessage());
                                e.printStackTrace();
                                throw new RuntimeException("Failed to save report: " + e.getMessage());
                        }
                } catch (Exception e) {
                        System.err.println("Unexpected error in generateClassRecordReport: " + e.getMessage());
                        e.printStackTrace();
                        throw e;
                }
        }

        /**
         * Generate Excel data for class record using frontend data
         */
        private byte[] generateExcelData(JSONArray studentRecords, JSONArray headers, Classroom classroom,
                        User teacher) {
                try {
                        System.out.println("\n=== Starting Excel Generation ===");
                        System.out.println("Report Parameters:");
                        System.out.println("- Classroom: " + classroom.getName());
                        System.out.println("- Teacher: " + teacher.getFirstName() + " " + teacher.getLastName());
                        System.out.println("- Total Students: " + studentRecords.length());
                        System.out.println("- Headers: " + headers.toString(2));
                        System.out.println("- First student record: "
                                        + (studentRecords.length() > 0 ? studentRecords.getJSONObject(0).toString(2)
                                                        : "No students"));

                        Workbook workbook = new XSSFWorkbook();

                        // Create styles
                        CellStyle headerStyle = workbook.createCellStyle();
                        Font headerFont = workbook.createFont();
                        headerFont.setBold(true);
                        headerFont.setColor(IndexedColors.BLACK.getIndex());
                        headerStyle.setFont(headerFont);
                        headerStyle.setFillForegroundColor(IndexedColors.SKY_BLUE.getIndex());
                        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

                        // Create score style
                        CellStyle scoreStyle = workbook.createCellStyle();
                        scoreStyle.setDataFormat(workbook.createDataFormat().getFormat("0.00"));

                        // Create main class record sheet
                        Sheet mainSheet = workbook.createSheet("Class Record");
                        createClassRecordSheet(mainSheet, studentRecords, headers, classroom, teacher, headerStyle,
                                        scoreStyle);

                        // Create sheets for each quiz type
                        for (QuizType quizType : QuizType.values()) {
                                String sheetName = quizType.name().replace("_", " ");
                                Sheet typeSheet = workbook.createSheet(sheetName);
                                createQuizTypeSheet(typeSheet, studentRecords, headers, classroom, teacher, headerStyle,
                                                scoreStyle, quizType);
                        }

                        // Write to byte array
                        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                        workbook.write(outputStream);
                        workbook.close();
                        System.out.println("Excel generation complete");
                        return outputStream.toByteArray();
                } catch (Exception e) {
                        System.err.println("Error generating Excel data: " + e.getMessage());
                        e.printStackTrace();
                        try {
                                // Create a simple error workbook
                                Workbook errorWorkbook = new XSSFWorkbook();
                                Sheet errorSheet = errorWorkbook.createSheet("Error");
                                Row errorRow = errorSheet.createRow(0);
                                errorRow.createCell(0).setCellValue("Error generating report: " + e.getMessage());
                                ByteArrayOutputStream errorStream = new ByteArrayOutputStream();
                                errorWorkbook.write(errorStream);
                                errorWorkbook.close();
                                return errorStream.toByteArray();
                        } catch (IOException ex) {
                                // If even the error workbook fails, return plain text
                                return ("Error generating Excel report: " + e.getMessage()).getBytes();
                        }
                }
        }

        private void createClassRecordSheet(Sheet sheet, JSONArray studentRecords, JSONArray headers,
                        Classroom classroom, User teacher, CellStyle headerStyle, CellStyle scoreStyle) {
                // Add class info
                Row infoRow1 = sheet.createRow(0);
                infoRow1.createCell(0).setCellValue("Classroom:");
                infoRow1.createCell(1).setCellValue(classroom.getName());

                Row infoRow2 = sheet.createRow(1);
                infoRow2.createCell(0).setCellValue("Teacher:");
                infoRow2.createCell(1).setCellValue(teacher.getFirstName() + " " + teacher.getLastName());

                Row infoRow3 = sheet.createRow(2);
                infoRow3.createCell(0).setCellValue("Generated:");
                infoRow3.createCell(1).setCellValue(
                                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

                // Empty row
                sheet.createRow(3);

                // Create header row
                Row headerRow = sheet.createRow(4);
                for (int i = 0; i < headers.length(); i++) {
                        JSONObject header = headers.getJSONObject(i);
                        Cell cell = headerRow.createCell(i);
                        cell.setCellValue(header.getString("label"));
                        cell.setCellStyle(headerStyle);
                }

                // Data rows
                int rowNum = 5;
                for (int i = 0; i < studentRecords.length(); i++) {
                        JSONObject student = studentRecords.getJSONObject(i);
                        Row row = sheet.createRow(rowNum++);
                        System.out.println("\nProcessing student: " + student.toString(2));

                        // Add data for each column based on headers
                        for (int j = 0; j < headers.length(); j++) {
                                JSONObject header = headers.getJSONObject(j);
                                String key = header.getString("key");
                                Cell cell = row.createCell(j);

                                try {
                                        if (student.has(key) && !student.isNull(key)) {
                                                if (key.equals("averageScore") || key.startsWith("quiz_")) {
                                                        double value = student.getDouble(key);
                                                        cell.setCellValue(value);
                                                        cell.setCellStyle(scoreStyle);
                                                        System.out.println("Added score for " + key + ": " + value);
                                                } else if (key.equals("totalPoints")) {
                                                        double value = student.getDouble(key);
                                                        cell.setCellValue(value);
                                                        cell.setCellStyle(scoreStyle);
                                                        System.out.println("Added total points: " + value);
                                                } else if (key.equals("rank")) {
                                                        int value = student.getInt(key);
                                                        cell.setCellValue(value);
                                                        System.out.println("Added rank: " + value);
                                                } else {
                                                        String value = student.getString(key);
                                                        cell.setCellValue(value);
                                                        System.out.println(
                                                                        "Added string value for " + key + ": " + value);
                                                }
                                        } else {
                                                cell.setCellValue("N/A");
                                                System.out.println("No value found for " + key + ", using N/A");
                                        }
                                } catch (Exception e) {
                                        System.err.println("Error processing cell - key: " + key + ", header: "
                                                        + header.toString(2));
                                        e.printStackTrace();
                                        cell.setCellValue("Error");
                                }
                        }
                }

                // Auto-size columns
                for (int i = 0; i < headers.length(); i++) {
                        sheet.autoSizeColumn(i);
                }
        }

        private void createQuizTypeSheet(Sheet sheet, JSONArray studentRecords, JSONArray headers,
                        Classroom classroom, User teacher, CellStyle headerStyle, CellStyle scoreStyle,
                        QuizType quizType) {
                // Add class info
                Row infoRow1 = sheet.createRow(0);
                infoRow1.createCell(0).setCellValue("Classroom:");
                infoRow1.createCell(1).setCellValue(classroom.getName());

                Row infoRow2 = sheet.createRow(1);
                infoRow2.createCell(0).setCellValue("Teacher:");
                infoRow2.createCell(1).setCellValue(teacher.getFirstName() + " " + teacher.getLastName());

                Row infoRow3 = sheet.createRow(2);
                infoRow3.createCell(0).setCellValue("Quiz Type:");
                infoRow3.createCell(1).setCellValue(quizType.name().replace("_", " "));

                // Empty row
                sheet.createRow(3);

                // Get all quizzes of this type for the classroom
                List<Quiz> typeQuizzes = quizRepository.findByActivity_Classroom(classroom).stream()
                                .filter(quiz -> quiz.getQuizType().name().equals(quizType.name()))
                                .collect(Collectors.toList());

                if (typeQuizzes.isEmpty()) {
                        // If no quizzes of this type, add a note
                        Row noteRow = sheet.createRow(4);
                        noteRow.createCell(0).setCellValue("No Quizzes for this Quiz Type");
                        sheet.autoSizeColumn(0);
                        return;
                }

                // Create header row
                Row headerRow = sheet.createRow(4);
                int colIndex = 0;

                // Add rank column
                Cell rankCell = headerRow.createCell(colIndex++);
                rankCell.setCellValue("Rank");
                rankCell.setCellStyle(headerStyle);

                // Add student name columns
                Cell lastNameCell = headerRow.createCell(colIndex++);
                lastNameCell.setCellValue("Last Name");
                lastNameCell.setCellStyle(headerStyle);

                Cell firstNameCell = headerRow.createCell(colIndex++);
                firstNameCell.setCellValue("First Name");
                firstNameCell.setCellStyle(headerStyle);

                // Add quiz columns with details
                for (Quiz quiz : typeQuizzes) {
                        Cell quizCell = headerRow.createCell(colIndex++);
                        quizCell.setCellValue(String.format("%s (Quiz Items: %d | Overall Score: %d | Passing: %d)",
                                        quiz.getQuizName(),
                                        quiz.getTotalItems(),
                                        quiz.getOverallScore(),
                                        quiz.getPassingScore()));
                        quizCell.setCellStyle(headerStyle);
                }

                // Add summary columns
                Cell totalPointsCell = headerRow.createCell(colIndex++);
                totalPointsCell.setCellValue("Total Points");
                totalPointsCell.setCellStyle(headerStyle);

                Cell averageCell = headerRow.createCell(colIndex++);
                averageCell.setCellValue("Average Score (%)");
                averageCell.setCellStyle(headerStyle);

                Cell statusCell = headerRow.createCell(colIndex++);
                statusCell.setCellValue("Status");
                statusCell.setCellStyle(headerStyle);

                // Calculate total points for each student and prepare for ranking
                List<Map<String, Object>> studentScores = new ArrayList<>();
                for (int i = 0; i < studentRecords.length(); i++) {
                        JSONObject student = studentRecords.getJSONObject(i);
                        double totalPoints = 0;
                        int completedQuizzes = 0;

                        for (Quiz quiz : typeQuizzes) {
                                String quizKey = "quiz_" + quiz.getId();
                                if (student.has(quizKey) && !student.isNull(quizKey)) {
                                        totalPoints += student.getDouble(quizKey);
                                        completedQuizzes++;
                                }
                        }

                        Map<String, Object> studentData = new HashMap<>();
                        studentData.put("student", student);
                        studentData.put("totalPoints", totalPoints);
                        studentData.put("completedQuizzes", completedQuizzes);
                        studentData.put("average", completedQuizzes > 0 ? totalPoints / completedQuizzes : 0);
                        studentScores.add(studentData);
                }

                // Sort students by total points (descending)
                studentScores.sort((a, b) -> Double.compare(
                                (double) b.get("totalPoints"),
                                (double) a.get("totalPoints")));

                // Data rows
                int rowNum = 5;
                int currentRank = 1;
                double previousScore = -1;
                int sameRankCount = 0;

                for (Map<String, Object> studentData : studentScores) {
                        JSONObject student = (JSONObject) studentData.get("student");
                        double totalPoints = (double) studentData.get("totalPoints");
                        int completedQuizzes = (int) studentData.get("completedQuizzes");
                        double average = (double) studentData.get("average");

                        Row row = sheet.createRow(rowNum++);
                        colIndex = 0;

                        // Add rank
                        if (totalPoints != previousScore) {
                                currentRank += sameRankCount;
                                sameRankCount = 0;
                        }
                        sameRankCount++;
                        previousScore = totalPoints;

                        Cell rankCell2 = row.createCell(colIndex++);
                        rankCell2.setCellValue(currentRank);

                        // Add student name
                        row.createCell(colIndex++).setCellValue(student.getString("lastName"));
                        row.createCell(colIndex++).setCellValue(student.getString("firstName"));

                        // Add quiz scores
                        for (Quiz quiz : typeQuizzes) {
                                String quizKey = "quiz_" + quiz.getId();
                                Cell scoreCell = row.createCell(colIndex++);

                                if (student.has(quizKey) && !student.isNull(quizKey)) {
                                        double score = student.getDouble(quizKey);
                                        scoreCell.setCellValue(score);
                                        scoreCell.setCellStyle(scoreStyle);
                                } else {
                                        scoreCell.setCellValue("N/A");
                                }
                        }

                        // Add total points
                        Cell totalCell = row.createCell(colIndex++);
                        totalCell.setCellValue(totalPoints);
                        totalCell.setCellStyle(scoreStyle);

                        // Add average score
                        Cell avgCell = row.createCell(colIndex++);
                        avgCell.setCellValue(average);
                        avgCell.setCellStyle(scoreStyle);

                        // Add status
                        Cell statusCell2 = row.createCell(colIndex++);
                        statusCell2.setCellValue(completedQuizzes == typeQuizzes.size() ? "Complete" : "Incomplete");
                }

                // Auto-size columns
                for (int i = 0; i < colIndex; i++) {
                        sheet.autoSizeColumn(i);
                }
        }

        /**
         * Generate CSV data for class record using frontend data
         */
        private byte[] generateCSVData(JSONArray studentRecords, JSONArray headers, Classroom classroom, User teacher) {
                try {
                        StringBuilder csv = new StringBuilder();

                        csv.append("Classroom:,").append(classroom.getName()).append("\n");
                        csv.append("Teacher:,").append(teacher.getFirstName()).append(" ").append(teacher.getLastName())
                                        .append("\n");
                        csv.append("Generated:,")
                                        .append(LocalDateTime.now()
                                                        .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                                        .append("\n\n");

                        for (int i = 0; i < headers.length(); i++) {
                                JSONObject header = headers.getJSONObject(i);
                                if (i > 0)
                                        csv.append(",");
                                csv.append(header.getString("label"));
                        }
                        csv.append("\n");

                        for (int i = 0; i < studentRecords.length(); i++) {
                                JSONObject student = studentRecords.getJSONObject(i);

                                for (int j = 0; j < headers.length(); j++) {
                                        JSONObject header = headers.getJSONObject(j);
                                        String key = header.getString("key");

                                        if (j > 0)
                                                csv.append(",");

                                        if (student.has(key) && !student.isNull(key)) {
                                                if (key.equals("averageScore") || key.startsWith("quiz_")) {
                                                        csv.append(String.format("%.2f", student.getDouble(key)));
                                                } else if (key.equals("totalPoints")) {
                                                        csv.append(String.format("%.2f", student.getDouble(key)));
                                                } else {
                                                        csv.append(student.get(key).toString());
                                                }
                                        } else {
                                                csv.append("N/A");
                                        }
                                }
                                csv.append("\n");
                        }

                        return csv.toString().getBytes();
                } catch (Exception e) {
                        System.err.println("Error generating CSV data: " + e.getMessage());
                        e.printStackTrace();
                        return ("Error generating CSV report: " + e.getMessage()).getBytes();
                }
        }

        /**
         * Get a report by ID
         * 
         * @param reportId The report ID
         * @return The report
         */
        public ReportDTO getReport(Long reportId) {
                Report report = reportRepository.findById(reportId)
                                .orElseThrow(() -> new RuntimeException("Report not found"));

                return convertToDTO(report);
        }

        /**
         * Get reports by teacher
         * 
         * @param teacherId The teacher ID
         * @return List of reports
         */
        public List<ReportDTO> getReportsByTeacher(Long teacherId) {
                User teacher = userRepository.findById(teacherId)
                                .orElseThrow(() -> new RuntimeException("Teacher not found"));

                List<Report> reports = reportRepository.findByTeacherOrderByCreatedAtDesc(teacher);

                return reports.stream()
                                .map(this::convertToDTO)
                                .collect(Collectors.toList());
        }

        /**
         * Get reports by classroom
         * 
         * @param classroomId The classroom ID
         * @return List of reports
         */
        public List<ReportDTO> getReportsByClassroom(Long classroomId) {
                Classroom classroom = classroomRepository.findById(classroomId)
                                .orElseThrow(() -> new RuntimeException("Classroom not found"));

                List<Report> reports = reportRepository.findByClassroomOrderByCreatedAtDesc(classroom);

                return reports.stream()
                                .map(this::convertToDTO)
                                .collect(Collectors.toList());
        }

        /**
         * Download report file
         * 
         * @param reportId The report ID
         * @return The report file data
         */
        public byte[] downloadReportFile(Long reportId) {
                Report report = reportRepository.findById(reportId)
                                .orElseThrow(() -> new RuntimeException("Report not found"));

                if (report.getFileData() == null) {
                        throw new RuntimeException("This report does not have a file");
                }

                return report.getFileData();
        }

        /**
         * Get class record analytics for a classroom
         * 
         * @param classroomId The classroom ID
         * @return Map containing analytics data
         */
        public Map<String, Object> getClassRecordAnalytics(Long classroomId) {
                Classroom classroom = classroomRepository.findById(classroomId)
                                .orElseThrow(() -> new RuntimeException("Classroom not found"));

                // Get all current quizzes for this classroom
                List<Quiz> quizzes = quizRepository.findByActivity_Classroom(classroom);
                int totalQuizzes = quizzes.size();

                // Get all current quiz attempts for this classroom
                List<QuizAttempt> allAttempts = quizAttemptRepository.findByClassroomId(classroomId);

                // Calculate unique quizzes taken by each student
                Map<Long, Set<Long>> studentQuizMap = new HashMap<>();
                Map<Long, Double> studentTotalScores = new HashMap<>();
                Map<Long, Integer> studentTotalPoints = new HashMap<>();
                Map<Long, Integer> studentPassedQuizzes = new HashMap<>();
                Map<Long, Integer> studentFailedQuizzes = new HashMap<>();

                for (QuizAttempt attempt : allAttempts) {
                        if (attempt.getStudent() != null && attempt.getQuiz() != null) {
                                Long studentId = attempt.getStudent().getId();
                                Long quizId = attempt.getQuiz().getId();

                                // Add to unique quizzes set
                                studentQuizMap.computeIfAbsent(studentId, k -> new HashSet<>())
                                                .add(quizId);

                                // Update scores and points
                                if (attempt.getScore() != null) {
                                        studentTotalScores.merge(studentId, (double) attempt.getScore(), Double::sum);
                                        studentTotalPoints.merge(studentId, attempt.getScore(), Integer::sum);

                                        // Update pass/fail counts
                                        if (attempt.getPassed()) {
                                                studentPassedQuizzes.merge(studentId, 1, Integer::sum);
                                        } else {
                                                studentFailedQuizzes.merge(studentId, 1, Integer::sum);
                                        }
                                }
                        }
                }

                // Calculate total unique quizzes taken across all students
                int uniqueQuizzesTaken = studentQuizMap.values().stream()
                                .mapToInt(Set::size)
                                .sum();

                // Calculate total passed and failed quizzes
                int totalQuizzesPassed = studentPassedQuizzes.values().stream().mapToInt(Integer::intValue).sum();
                int totalQuizzesFailed = studentFailedQuizzes.values().stream().mapToInt(Integer::intValue).sum();

                // Calculate classroom average score
                double totalScore = studentTotalScores.values().stream().mapToDouble(Double::doubleValue).sum();
                int totalAttempts = allAttempts.stream()
                                .filter(a -> a.getScore() != null)
                                .mapToInt(a -> 1)
                                .sum();
                Double averageScore = totalAttempts > 0 ? (totalScore / totalAttempts) : 0.0;

                // Create top performers list from current data
                List<StudentPerformanceDTO> topPerformers = new ArrayList<>();
                for (Map.Entry<Long, Set<Long>> entry : studentQuizMap.entrySet()) {
                        Long studentId = entry.getKey();
                        int quizzesTaken = entry.getValue().size();
                        if (quizzesTaken > 0) {
                                User student = userRepository.findById(studentId).orElse(null);
                                if (student != null) {
                                        double avgScore = studentTotalScores.getOrDefault(studentId, 0.0)
                                                        / quizzesTaken;
                                        int totalPoints = studentTotalPoints.getOrDefault(studentId, 0);

                                        StudentPerformanceDTO dto = new StudentPerformanceDTO();
                                        dto.setStudentId(studentId);
                                        dto.setStudentName(student.getFirstName() + " " + student.getLastName());
                                        dto.setAverageQuizScore(avgScore);
                                        dto.setTotalPoints(totalPoints);
                                        topPerformers.add(dto);
                                }
                        }
                }

                // Sort top performers by average score
                topPerformers.sort((a, b) -> Double.compare(b.getAverageQuizScore(), a.getAverageQuizScore()));

                Map<String, Object> analytics = new HashMap<>();
                analytics.put("totalStudents", classroom.getStudents().size());
                analytics.put("totalQuizzes", totalQuizzes);
                analytics.put("uniqueQuizzesTaken", uniqueQuizzesTaken);
                analytics.put("totalQuizzesPassed", totalQuizzesPassed);
                analytics.put("totalQuizzesFailed", totalQuizzesFailed);
                analytics.put("averageScore", averageScore);
                analytics.put("topPerformers", topPerformers);

                return analytics;
        }

        /**
         * Convert a Report entity to a ReportDTO
         * 
         * @param report The report entity
         * @return The report DTO
         */
        private ReportDTO convertToDTO(Report report) {
                ReportDTO dto = new ReportDTO();
                dto.setId(report.getId());
                dto.setClassroomId(report.getClassroom().getId());
                dto.setClassroomName(report.getClassroom().getName());
                dto.setTeacherId(report.getTeacher().getId());
                dto.setTeacherName(report.getTeacher().getFirstName() + " " + report.getTeacher().getLastName());
                dto.setReportName(report.getReportName());
                dto.setReportDescription(report.getReportDescription());
                dto.setReportType(report.getReportType());
                dto.setReportData(report.getReportData());
                dto.setHasFile(report.getFileData() != null);
                dto.setFileType(report.getFileType());
                dto.setFileName(report.getFileName());
                dto.setCreatedAt(report.getCreatedAt());

                return dto;
        }
}