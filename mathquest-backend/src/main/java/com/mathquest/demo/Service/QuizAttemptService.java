package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.QuizAttemptDTO;
import com.mathquest.demo.Model.Quiz;
import com.mathquest.demo.Model.QuizAttempt;
import com.mathquest.demo.Model.User;
import com.mathquest.demo.Model.Classroom;
import com.mathquest.demo.Model.LeaderboardEntry;
import com.mathquest.demo.Repository.QuizAttemptRepository;
import com.mathquest.demo.Repository.QuizRepository;
import com.mathquest.demo.Repository.UserRepository;
import com.mathquest.demo.Repository.LeaderboardEntryRepository;
import com.mathquest.demo.Service.LeaderboardService;
import com.mathquest.demo.Service.LessonService;
import jakarta.persistence.EntityNotFoundException;
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
import java.util.Optional;

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

    @Autowired
    private LessonService lessonService;

    @Autowired
    private LeaderboardEntryRepository leaderboardEntryRepository;

    /**
     * Start a new quiz attempt
     * 
     * @param quizId    The quiz ID
     * @param studentId The student ID
     * @return The created quiz attempt
     */
    @Transactional
    public QuizAttemptDTO startQuizAttempt(Long quizId, Long studentId) {
        logger.info("Starting quiz attempt creation - quizId: {}, studentId: {}", quizId, studentId);

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> {
                    logger.error("Quiz not found with id: {}", quizId);
                    return new EntityNotFoundException("Quiz not found");
                });
        logger.info("Found quiz: {} (repeatable: {}, maxAttempts: {})",
                quiz.getQuizName(), quiz.getRepeatable(), quiz.getMaxAttempts());

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> {
                    logger.error("Student not found with id: {}", studentId);
                    return new EntityNotFoundException("Student not found");
                });
        logger.info("Found student: {} {}", student.getFirstName(), student.getLastName());

        // Check if student has reached max attempts
        List<QuizAttempt> existingAttempts = quizAttemptRepository.findByQuizAndStudent(quiz, student);
        logger.info("Current attempts for student: {} (count: {})",
                existingAttempts.stream().map(a -> a.getAttemptNumber()).collect(Collectors.toList()),
                existingAttempts.size());

        if (!quiz.getRepeatable()) {
            if (!existingAttempts.isEmpty()) {
                logger.error("Quiz is not repeatable and student has already attempted it");
                throw new IllegalStateException("This quiz cannot be retaken");
            }
        } else if (quiz.getMaxAttempts() != null) {
            if (existingAttempts.size() >= quiz.getMaxAttempts()) {
                logger.error("Student has reached maximum attempts (max: {}, current: {})",
                        quiz.getMaxAttempts(), existingAttempts.size());
                throw new IllegalStateException("Maximum attempts reached for this quiz");
            }
        }

        // Create new attempt
        QuizAttempt attempt = new QuizAttempt();
        attempt.setQuiz(quiz);
        attempt.setStudent(student);
        attempt.setStartedAt(LocalDateTime.now());
        attempt.setAttemptNumber(existingAttempts.size() + 1);
        logger.info("Creating new attempt with number: {}", attempt.getAttemptNumber());

        attempt = quizAttemptRepository.save(attempt);
        logger.info("Successfully created quiz attempt with id: {}", attempt.getId());

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

        // Update leaderboard and get rank
        leaderboardService.updateLeaderboard(attempt);
        leaderboardService.updateRankings(attempt.getQuiz().getId());

        // Get the updated leaderboard entry to get the rank
        Optional<LeaderboardEntry> leaderboardEntry = leaderboardEntryRepository.findByStudentAndQuiz(
                attempt.getStudent(), attempt.getQuiz());

        // Create a DTO to return
        QuizAttemptDTO dto = convertToDTO(attempt);

        // Add rank from leaderboard entry if available
        if (leaderboardEntry.isPresent()) {
            dto.setRank(leaderboardEntry.get().getRank());
        }

        // If this quiz is associated with a lesson, update the lesson completion
        if (attempt.getQuiz().getLesson() != null) {
            logger.info("Updating lesson completion for lesson: {}", attempt.getQuiz().getLesson().getId());
            try {
                lessonService.markLessonQuizAsCompleted(
                        attempt.getQuiz().getLesson().getId(),
                        attempt.getStudent().getId(),
                        score);
                logger.info("Successfully updated lesson completion");
            } catch (Exception e) {
                logger.error("Failed to update lesson completion: {}", e.getMessage(), e);
                // Don't throw the error as the quiz attempt was already saved
            }
        }

        return dto;
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