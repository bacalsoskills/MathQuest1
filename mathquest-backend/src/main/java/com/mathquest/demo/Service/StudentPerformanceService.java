package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.StudentPerformanceDTO;
import com.mathquest.demo.Model.Classroom;
import com.mathquest.demo.Model.QuizAttempt;
import com.mathquest.demo.Model.StudentPerformance;
import com.mathquest.demo.Repository.ClassroomRepository;
import com.mathquest.demo.Repository.StudentPerformanceRepository;
import com.mathquest.demo.Repository.UserRepository;
import com.mathquest.demo.Repository.QuizAttemptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class StudentPerformanceService {

    @Autowired
    private StudentPerformanceRepository studentPerformanceRepository;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    /**
     * Update student performance based on a quiz attempt
     * 
     * @param attempt The quiz attempt
     */
    @Transactional
    public void updateStudentPerformance(QuizAttempt attempt) {
        Classroom classroom = attempt.getQuiz().getActivity().getClassroom();

        // Find existing performance record or create new one
        Optional<StudentPerformance> existingPerformance = studentPerformanceRepository
                .findByStudentAndClassroom(attempt.getStudent(), classroom);

        StudentPerformance performance;
        if (existingPerformance.isPresent()) {
            performance = existingPerformance.get();
        } else {
            performance = new StudentPerformance(attempt.getStudent(), classroom);
        }

        // Update performance metrics
        performance.updatePerformance(
                attempt.getScore(),
                attempt.getPassed(),
                attempt.getTimeSpentSeconds());

        studentPerformanceRepository.save(performance);
    }

    /**
     * Get student performance by student and classroom
     * 
     * @param studentId   The student ID
     * @param classroomId The classroom ID
     * @return The student performance data
     */
    public StudentPerformanceDTO getStudentPerformance(Long studentId, Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        // Create a User object with just the ID set
        com.mathquest.demo.Model.User student = new com.mathquest.demo.Model.User();
        student.setId(studentId);

        StudentPerformance performance = studentPerformanceRepository
                .findByStudentAndClassroom(student, classroom)
                .orElseThrow(() -> new RuntimeException("Student performance not found"));

        return convertToDTO(performance);
    }

    /**
     * Get overall student performance across all classrooms
     * 
     * @param studentId The student ID
     * @return Overall performance data
     */
    public StudentPerformanceDTO getOverallStudentPerformance(Long studentId) {
        com.mathquest.demo.Model.User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<StudentPerformance> allPerformances = studentPerformanceRepository.findByStudent(student);

        if (allPerformances.isEmpty()) {
            throw new RuntimeException("No performance data found for student");
        }

        // Calculate overall metrics across all classrooms
        double totalScore = 0;
        int totalQuizzesTaken = 0;
        int totalQuizzesPassed = 0;
        int totalQuizzesFailed = 0;
        int totalPoints = 0;
        double totalTimeSpent = 0;

        for (StudentPerformance performance : allPerformances) {
            totalScore += performance.getAverageQuizScore() * performance.getTotalQuizzesTaken();
            totalQuizzesTaken += performance.getTotalQuizzesTaken();
            totalQuizzesPassed += performance.getTotalQuizzesPassed();
            totalQuizzesFailed += performance.getTotalQuizzesFailed();
            totalPoints += performance.getTotalPoints();
            totalTimeSpent += performance.getAverageCompletionTimeSeconds() * performance.getTotalQuizzesTaken();
        }

        double overallAverageScore = totalQuizzesTaken > 0 ? totalScore / totalQuizzesTaken : 0;
        double overallAverageTime = totalQuizzesTaken > 0 ? totalTimeSpent / totalQuizzesTaken : 0;

        // Create a DTO for the overall performance
        StudentPerformanceDTO overallDTO = new StudentPerformanceDTO();
        overallDTO.setStudentId(student.getId());
        overallDTO.setStudentName(student.getFirstName() + " " + student.getLastName());
        overallDTO.setStudentUsername(student.getUsername());
        overallDTO.setAverageQuizScore(overallAverageScore);
        overallDTO.setTotalQuizzesTaken(totalQuizzesTaken);
        overallDTO.setTotalQuizzesPassed(totalQuizzesPassed);
        overallDTO.setTotalQuizzesFailed(totalQuizzesFailed);
        overallDTO.setTotalPoints(totalPoints);
        overallDTO.setAverageCompletionTimeSeconds(overallAverageTime);

        // Format average completion time
        if (overallAverageTime > 0) {
            int minutes = (int) (overallAverageTime / 60);
            int seconds = (int) (overallAverageTime % 60);
            overallDTO.setFormattedAverageCompletionTime(minutes + "m " + seconds + "s");
        }

        return overallDTO;
    }

    /**
     * Get top performers in a classroom
     * 
     * @param classroomId The classroom ID
     * @return List of top student performances
     */
    public List<StudentPerformanceDTO> getTopPerformers(Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        List<StudentPerformance> performances = studentPerformanceRepository
                .findTopPerformersInClassroom(classroom);

        return performances.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get students needing attention in a classroom
     * 
     * @param classroomId The classroom ID
     * @return List of student performances needing attention
     */
    public List<StudentPerformanceDTO> getStudentsNeedingAttention(Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        List<StudentPerformance> performances = studentPerformanceRepository
                .findStudentsNeedingAttentionInClassroom(classroom);

        return performances.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get classroom average score
     * 
     * @param classroomId The classroom ID
     * @return The classroom average score
     */
    public Double getClassroomAverageScore(Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        return studentPerformanceRepository.getClassroomAverageScore(classroom);
    }

    /**
     * Convert a StudentPerformance entity to a StudentPerformanceDTO
     * 
     * @param performance The student performance entity
     * @return The student performance DTO
     */
    private StudentPerformanceDTO convertToDTO(StudentPerformance performance) {
        StudentPerformanceDTO dto = new StudentPerformanceDTO();
        dto.setId(performance.getId());
        dto.setStudentId(performance.getStudent().getId());
        dto.setStudentName(performance.getStudent().getFirstName() + " " + performance.getStudent().getLastName());
        dto.setStudentUsername(performance.getStudent().getUsername());
        dto.setClassroomId(performance.getClassroom().getId());
        dto.setClassroomName(performance.getClassroom().getName());
        dto.setAverageQuizScore(performance.getAverageQuizScore());
        dto.setTotalQuizzesTaken(performance.getTotalQuizzesTaken());
        dto.setTotalQuizzesPassed(performance.getTotalQuizzesPassed());
        dto.setTotalQuizzesFailed(performance.getTotalQuizzesFailed());
        dto.setTotalPoints(performance.getTotalPoints());
        dto.setAverageCompletionTimeSeconds(performance.getAverageCompletionTimeSeconds());
        dto.setTopicPerformance(performance.getTopicPerformance());

        // Format average completion time (e.g., "5m 30s")
        if (performance.getAverageCompletionTimeSeconds() != null) {
            int minutes = performance.getAverageCompletionTimeSeconds().intValue() / 60;
            int seconds = performance.getAverageCompletionTimeSeconds().intValue() % 60;
            dto.setFormattedAverageCompletionTime(minutes + "m " + seconds + "s");
        }

        return dto;
    }
}