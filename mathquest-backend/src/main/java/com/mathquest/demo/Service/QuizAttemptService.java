package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.QuizAttemptDTO;
import com.mathquest.demo.Model.*;
import com.mathquest.demo.Repository.QuizAttemptRepository;
import com.mathquest.demo.Repository.QuizRepository;
import com.mathquest.demo.Repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuizAttemptService {

    private static final Logger logger = LoggerFactory.getLogger(QuizAttemptService.class);

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LeaderboardService leaderboardService;

    @Autowired
    private StudentPerformanceService studentPerformanceService;

    /**
     * Start a new quiz attempt
     * 
     * @param quizId    The quiz ID
     * @param studentId The student ID
     * @return The created quiz attempt
     */
    @Transactional
    public QuizAttemptDTO startQuizAttempt(Long quizId, Long studentId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Check if quiz is available
        LocalDateTime now = LocalDateTime.now();
        if (quiz.getAvailableFrom() != null && now.isBefore(quiz.getAvailableFrom())) {
            throw new RuntimeException("Quiz is not yet available");
        }
        if (quiz.getAvailableTo() != null && now.isAfter(quiz.getAvailableTo())) {
            throw new RuntimeException("Quiz is no longer available");
        }

        // Check if student can attempt the quiz again
        int attempts = quizAttemptRepository.countAttemptsByQuizAndStudent(quiz, student);
        if (!quiz.getRepeatable()) {
            if (attempts > 0) {
                throw new RuntimeException("This quiz cannot be attempted more than once");
            }
        } else if (quiz.getMaxAttempts() != null && quiz.getMaxAttempts() > 0) {
            if (attempts >= quiz.getMaxAttempts()) {
                throw new RuntimeException("You have reached the maximum number of attempts for this quiz ("
                        + quiz.getMaxAttempts() + ")");
            }
        }

        // Get next attempt number
        List<QuizAttempt> previousAttempts = quizAttemptRepository.findByQuizAndStudentOrderByAttemptNumberDesc(quiz,
                student);
        int attemptNumber = previousAttempts.isEmpty() ? 1 : previousAttempts.get(0).getAttemptNumber() + 1;

        QuizAttempt attempt = new QuizAttempt(quiz, student, attemptNumber);
        attempt = quizAttemptRepository.save(attempt);

        return convertToDTO(attempt);
    }

    /**
     * Complete a quiz attempt
     * 
     * @param attemptId The attempt ID
     * @param score     The score achieved
     * @param answers   JSON string with answers
     * @return The updated quiz attempt
     */
    @Transactional
    public QuizAttemptDTO completeQuizAttempt(Long attemptId, Integer score, String answers) {
        logger.info("Starting quiz attempt completion for attemptId: {}", attemptId);
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Quiz attempt not found"));

        if (attempt.getCompletedAt() != null) {
            throw new RuntimeException("This quiz attempt is already completed");
        }

        // If score is null, set a default value of 0
        if (score == null) {
            score = 0;
        }

        // Calculate time spent
        LocalDateTime now = LocalDateTime.now();
        Duration duration = Duration.between(attempt.getStartedAt(), now);
        int timeSpentSeconds = (int) duration.getSeconds();

        logger.info("Completing attempt with score: {}, timeSpent: {}", score, timeSpentSeconds);

        // Complete the attempt
        attempt.complete(score, answers, timeSpentSeconds);
        attempt = quizAttemptRepository.save(attempt);
        logger.info("Attempt saved successfully with ID: {}", attempt.getId());

        // Create a DTO to return
        QuizAttemptDTO attemptDTO = convertToDTO(attempt);

        // Try to update leaderboard in a new transaction
        try {
            logger.info("Attempting to update leaderboard...");
            // Ensure we have all required data
            if (attempt.getQuiz() != null &&
                    attempt.getQuiz().getActivity() != null &&
                    attempt.getQuiz().getActivity().getClassroom() != null) {

                logger.debug("Quiz ID: {}", attempt.getQuiz().getId());
                logger.debug("Student ID: {}", attempt.getStudent().getId());
                logger.debug("Classroom ID: {}", attempt.getQuiz().getActivity().getClassroom().getId());
                logger.debug("Score: {}", attempt.getScore());

                updateLeaderboard(attempt);
                logger.info("Leaderboard update initiated successfully");
            } else {
                logger.error("Missing required data for leaderboard update:");
                if (attempt.getQuiz() == null)
                    logger.error("Quiz is null");
                else if (attempt.getQuiz().getActivity() == null)
                    logger.error("Activity is null");
                else if (attempt.getQuiz().getActivity().getClassroom() == null)
                    logger.error("Classroom is null");
            }
        } catch (Exception e) {
            logger.error("Error updating leaderboard: {}", e.getMessage(), e);
        }

        // Try to update student performance in a new transaction
        try {
            logger.info("Attempting to update student performance...");
            updateStudentPerformance(attempt);
            logger.info("Student performance update completed");
        } catch (Exception e) {
            logger.error("Error updating student performance: {}", e.getMessage(), e);
        }

        return attemptDTO;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateLeaderboard(QuizAttempt attempt) {
        try {
            logger.info("Starting leaderboard update in new transaction");
            logger.debug("Attempt details - ID: {}, Score: {}, Student: {}, Quiz: {}",
                    attempt.getId(),
                    attempt.getScore(),
                    attempt.getStudent().getId(),
                    attempt.getQuiz().getId());

            // Force load the classroom to ensure it's available
            Classroom classroom = attempt.getQuiz().getActivity().getClassroom();
            logger.debug("Classroom loaded successfully: {}", classroom.getId());

            leaderboardService.updateLeaderboard(attempt);
            logger.info("Leaderboard update completed");
        } catch (Exception e) {
            logger.error("Failed to update leaderboard: {}", e.getMessage(), e);
            throw e; // Rethrow to rollback this transaction
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateStudentPerformance(QuizAttempt attempt) {
        studentPerformanceService.updateStudentPerformance(attempt);
    }

    /**
     * Get a quiz attempt by ID
     * 
     * @param attemptId The attempt ID
     * @return The quiz attempt
     */
    public QuizAttemptDTO getQuizAttempt(Long attemptId) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Quiz attempt not found"));

        return convertToDTO(attempt);
    }

    /**
     * Get all quiz attempts for a student
     * 
     * @param studentId The student ID
     * @return List of quiz attempts
     */
    public List<QuizAttemptDTO> getQuizAttemptsByStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<QuizAttempt> attempts = quizAttemptRepository.findByStudentOrderByCreatedAtDesc(student);
        return attempts.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all quiz attempts for a quiz
     * 
     * @param quizId The quiz ID
     * @return List of quiz attempts
     */
    public List<QuizAttemptDTO> getQuizAttemptsByQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        List<QuizAttempt> attempts = quizAttemptRepository.findByQuizOrderByScoreDesc(quiz);
        return attempts.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get top 10 quiz attempts for a quiz
     * 
     * @param quizId The quiz ID
     * @return List of top 10 quiz attempts
     */
    public List<QuizAttemptDTO> getTop10QuizAttemptsByQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        List<QuizAttempt> attempts = quizAttemptRepository.findTop10ByQuizOrderByScoreDescTimeSpentAsc(quiz);
        return attempts.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Convert a QuizAttempt entity to a QuizAttemptDTO
     * 
     * @param attempt The quiz attempt entity
     * @return The quiz attempt DTO
     */
    private QuizAttemptDTO convertToDTO(QuizAttempt attempt) {
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

        // Add classroom ID and logging
        Long classroomId = null;
        if (attempt.getQuiz() != null &&
                attempt.getQuiz().getActivity() != null &&
                attempt.getQuiz().getActivity().getClassroom() != null) {
            classroomId = attempt.getQuiz().getActivity().getClassroom().getId();
            logger.debug("Setting classroomId: {} for attempt: {}", classroomId, attempt.getId());
        } else {
            logger.warn("Could not get classroomId for attempt: {}", attempt.getId());
            if (attempt.getQuiz() == null)
                logger.warn("Quiz is null");
            else if (attempt.getQuiz().getActivity() == null)
                logger.warn("Activity is null");
            else if (attempt.getQuiz().getActivity().getClassroom() == null)
                logger.warn("Classroom is null");
        }
        dto.setClassroomId(classroomId);

        // Format time spent (e.g., "5m 30s")
        if (attempt.getTimeSpentSeconds() != null) {
            int minutes = attempt.getTimeSpentSeconds() / 60;
            int seconds = attempt.getTimeSpentSeconds() % 60;
            dto.setFormattedTimeSpent(minutes + "m " + seconds + "s");
        }

        return dto;
    }
}