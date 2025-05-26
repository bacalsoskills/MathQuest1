package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.QuizDTO;
import com.mathquest.demo.DTO.QuizAttemptDTO;
import com.mathquest.demo.Model.*;
import com.mathquest.demo.Repository.ActivityRepository;
import com.mathquest.demo.Repository.QuizRepository;
import com.mathquest.demo.Repository.QuizAttemptRepository;
import com.mathquest.demo.Repository.UserRepository;
import com.mathquest.demo.Repository.ClassroomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
public class QuizService {

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClassroomRepository classroomRepository;

    /**
     * Create a new quiz for an activity
     * 
     * @param activityId The ID of the activity
     * @param quizDTO    The quiz data
     * @return The created quiz
     */
    @Transactional
    public QuizDTO createQuiz(Long activityId, QuizDTO quizDTO) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        Quiz quiz = new Quiz(
                activity,
                quizDTO.getQuizName(),
                quizDTO.getDescription(),
                quizDTO.getRepeatable(),
                quizDTO.getTotalItems(),
                quizDTO.getPassingScore(),
                quizDTO.getOverallScore(),
                quizDTO.getAvailableFrom(),
                quizDTO.getAvailableTo(),
                quizDTO.getTimeLimitMinutes(),
                quizDTO.getQuizContent(),
                quizDTO.getMaxAttempts());

        quiz = quizRepository.save(quiz);
        return convertToDTO(quiz);
    }

    /**
     * Get a quiz by ID
     * 
     * @param quizId The quiz ID
     * @return The quiz data
     */
    public QuizDTO getQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        return convertToDTO(quiz);
    }

    /**
     * Get a quiz by activity ID
     * 
     * @param activityId The activity ID
     * @return The quiz data
     */
    public QuizDTO getQuizByActivityId(Long activityId) {
        Quiz quiz = quizRepository.findByActivityId(activityId)
                .orElseThrow(() -> new RuntimeException("Quiz not found for activity"));

        return convertToDTO(quiz);
    }

    /**
     * Update an existing quiz
     * 
     * @param quizId  The quiz ID
     * @param quizDTO The updated quiz data
     * @return The updated quiz
     */
    @Transactional
    public QuizDTO updateQuiz(Long quizId, QuizDTO quizDTO) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        quiz.setQuizName(quizDTO.getQuizName());
        quiz.setDescription(quizDTO.getDescription());
        quiz.setRepeatable(quizDTO.getRepeatable());
        quiz.setTotalItems(quizDTO.getTotalItems());
        quiz.setPassingScore(quizDTO.getPassingScore());
        quiz.setOverallScore(quizDTO.getOverallScore());
        quiz.setAvailableFrom(quizDTO.getAvailableFrom());
        quiz.setAvailableTo(quizDTO.getAvailableTo());
        quiz.setTimeLimitMinutes(quizDTO.getTimeLimitMinutes());
        quiz.setQuizContent(quizDTO.getQuizContent());
        quiz.setMaxAttempts(quizDTO.getMaxAttempts());

        quiz = quizRepository.save(quiz);
        return convertToDTO(quiz);
    }

    /**
     * Delete a quiz
     * 
     * @param quizId The quiz ID
     */
    @Transactional
    public void deleteQuiz(Long quizId) {
        quizRepository.deleteById(quizId);
    }

    /**
     * Get quizzes for a classroom
     * 
     * @param classroomId The classroom ID
     * @return List of quizzes
     */
    public List<QuizDTO> getQuizzesByClassroom(Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        List<Quiz> quizzes = quizRepository.findByActivity_Classroom(classroom);
        return quizzes.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get available quizzes for a classroom
     * 
     * @param classroomId The classroom ID
     * @return List of available quizzes
     */
    public List<QuizDTO> getAvailableQuizzes(Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        List<Quiz> quizzes = quizRepository.findAvailableQuizzes(classroom, LocalDateTime.now());
        return quizzes.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all quiz data for a classroom
     * 
     * @param classroomId The classroom ID
     * @return Map containing quizzes and related data
     */
    public Map<String, Object> getClassroomQuizData(Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        List<Quiz> quizzes = quizRepository.findByActivity_Classroom(classroom);
        List<QuizDTO> quizDTOs = quizzes.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("quizzes", quizDTOs);

        return response;
    }

    /**
     * Get all quiz attempts for a classroom
     * 
     * @param classroomId The classroom ID
     * @return Map containing attempts and student data
     */
    public Map<String, Object> getQuizAttemptsByClassroom(Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        // Get all quizzes for this classroom
        List<Quiz> quizzes = quizRepository.findByActivity_Classroom(classroom);

        // Get all attempts for these quizzes
        List<QuizAttempt> attempts = quizAttemptRepository.findByQuizIn(quizzes);
        List<QuizAttemptDTO> attemptDTOs = attempts.stream()
                .map(this::convertAttemptToDTO)
                .collect(Collectors.toList());

        // Get all students in the classroom
        List<User> students = userRepository.findByClassrooms(classroom);
        List<Map<String, Object>> studentDTOs = students.stream()
                .map(student -> {
                    Map<String, Object> studentDTO = new HashMap<>();
                    studentDTO.put("id", student.getId());
                    studentDTO.put("firstName", student.getFirstName());
                    studentDTO.put("lastName", student.getLastName());
                    studentDTO.put("username", student.getUsername());
                    return studentDTO;
                })
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("attempts", attemptDTOs);
        response.put("students", studentDTOs);

        return response;
    }

    /**
     * Convert a Quiz entity to a QuizDTO
     * 
     * @param quiz The quiz entity
     * @return The quiz DTO
     */
    private QuizDTO convertToDTO(Quiz quiz) {
        QuizDTO dto = new QuizDTO();
        dto.setId(quiz.getId());
        dto.setActivityId(quiz.getActivity().getId());
        dto.setQuizName(quiz.getQuizName());
        dto.setDescription(quiz.getDescription());
        dto.setRepeatable(quiz.getRepeatable());
        dto.setTotalItems(quiz.getTotalItems());
        dto.setPassingScore(quiz.getPassingScore());
        dto.setOverallScore(quiz.getOverallScore());
        dto.setAvailableFrom(quiz.getAvailableFrom());
        dto.setAvailableTo(quiz.getAvailableTo());
        dto.setTimeLimitMinutes(quiz.getTimeLimitMinutes());
        dto.setQuizContent(quiz.getQuizContent());
        dto.setMaxAttempts(quiz.getMaxAttempts());

        return dto;
    }

    private QuizAttemptDTO convertAttemptToDTO(QuizAttempt attempt) {
        QuizAttemptDTO dto = new QuizAttemptDTO();
        dto.setId(attempt.getId());
        dto.setQuizId(attempt.getQuiz().getId());
        dto.setQuizName(attempt.getQuiz().getQuizName());
        dto.setStudentId(attempt.getStudent().getId());
        dto.setStudentName(attempt.getStudent().getFirstName() + " " + attempt.getStudent().getLastName());
        dto.setAttemptNumber(attempt.getAttemptNumber());
        dto.setScore(attempt.getScore());
        dto.setPassed(attempt.getPassed());
        dto.setAnswers(attempt.getAnswers());
        dto.setStartedAt(attempt.getStartedAt());
        dto.setCompletedAt(attempt.getCompletedAt());
        dto.setTimeSpentSeconds(attempt.getTimeSpentSeconds());

        // Add classroom ID
        if (attempt.getQuiz() != null &&
                attempt.getQuiz().getActivity() != null &&
                attempt.getQuiz().getActivity().getClassroom() != null) {
            dto.setClassroomId(attempt.getQuiz().getActivity().getClassroom().getId());
        }

        // Format time spent
        if (attempt.getTimeSpentSeconds() != null) {
            int minutes = attempt.getTimeSpentSeconds() / 60;
            int seconds = attempt.getTimeSpentSeconds() % 60;
            dto.setFormattedTimeSpent(minutes + "m " + seconds + "s");
        }

        return dto;
    }
}