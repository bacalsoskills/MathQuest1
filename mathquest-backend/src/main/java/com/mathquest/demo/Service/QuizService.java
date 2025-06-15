package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.QuizDTO;
import com.mathquest.demo.DTO.QuizAttemptDTO;
import com.mathquest.demo.Model.*;
import com.mathquest.demo.Repository.ActivityRepository;
import com.mathquest.demo.Repository.QuizRepository;
import com.mathquest.demo.Repository.QuizAttemptRepository;
import com.mathquest.demo.Repository.UserRepository;
import com.mathquest.demo.Repository.ClassroomRepository;
import com.mathquest.demo.Repository.LeaderboardEntryRepository;
import com.mathquest.demo.Repository.LessonRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

        private static final Logger logger = LoggerFactory.getLogger(QuizService.class);

        @Autowired
        private QuizRepository quizRepository;

        @Autowired
        private ActivityRepository activityRepository;

        @Autowired
        private QuizAttemptRepository quizAttemptRepository;

        @Autowired
        private LeaderboardEntryRepository leaderboardEntryRepository;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private ClassroomRepository classroomRepository;

        @Autowired
        private LessonRepository lessonRepository;

        /**
         * Create a new quiz for an activity
         * 
         * @param activityId The ID of the activity
         * @param quizDTO    The quiz data
         * @return The created quiz
         */
        @Transactional
        public QuizDTO createQuiz(Long activityId, QuizDTO quizDTO) {
                // Validate max attempts
                if (quizDTO.getRepeatable() && quizDTO.getMaxAttempts() != null && quizDTO.getMaxAttempts() > 5) {
                        throw new IllegalArgumentException("Maximum attempts cannot exceed 5");
                }

                Activity activity = activityRepository.findById(activityId)
                                .orElseThrow(() -> new RuntimeException("Activity not found"));

                Lesson lesson = null;
                if (quizDTO.getLessonId() != null) {
                        lesson = lessonRepository.findById(quizDTO.getLessonId())
                                        .orElse(null);
                }

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
                                quizDTO.getMaxAttempts(),
                                quizDTO.getQuizType() != null ? QuizType.valueOf(quizDTO.getQuizType())
                                                : QuizType.PRACTICE_QUIZ,
                                lesson);

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
        @Transactional(readOnly = true)
        public QuizDTO getQuizByActivityId(Long activityId) {
                Quiz quiz = quizRepository.findByActivityId(activityId)
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "Quiz not found for activity ID: " + activityId));
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
                // Validate max attempts
                if (quizDTO.getRepeatable() && quizDTO.getMaxAttempts() != null && quizDTO.getMaxAttempts() > 5) {
                        throw new IllegalArgumentException("Maximum attempts cannot exceed 5");
                }

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
                if (quizDTO.getQuizType() != null) {
                        quiz.setQuizType(QuizType.valueOf(quizDTO.getQuizType()));
                }
                if (quizDTO.getLessonId() != null) {
                        Lesson lesson = lessonRepository.findById(quizDTO.getLessonId()).orElse(null);
                        quiz.setLesson(lesson);
                }
                quiz = quizRepository.save(quiz);
                return convertToDTO(quiz);
        }

        /**
         * Delete a quiz and all its related data
         * 
         * @param quizId The quiz ID
         */
        @Transactional
        public void deleteQuiz(Long quizId) {
                logger.info("Starting deletion of quiz {}", quizId);

                Quiz quiz = quizRepository.findById(quizId)
                                .orElseThrow(() -> new RuntimeException("Quiz not found"));

                // Set isDeleted to true in the associated Activity and save it first
                Activity activity = quiz.getActivity();
                if (activity != null) {
                        logger.info("Found associated activity {} for quiz {}", activity.getId(), quizId);
                        activity.setIsDeleted(true);
                        activity = activityRepository.save(activity);
                        logger.info("Successfully marked activity {} as deleted", activity.getId());
                } else {
                        logger.warn("No associated activity found for quiz {}", quizId);
                }

                // Remove lesson association if exists
                if (quiz.getLesson() != null) {
                        logger.info("Removing lesson association for quiz {}", quizId);
                        quiz.setLesson(null);
                        quizRepository.save(quiz);
                }

                // Delete all leaderboard entries first
                logger.info("Deleting leaderboard entries for quiz {}", quizId);
                leaderboardEntryRepository.deleteByQuiz(quiz);

                // Delete all quiz attempts
                logger.info("Deleting quiz attempts for quiz {}", quizId);
                quizAttemptRepository.deleteByQuiz(quiz);

                // Delete the quiz
                logger.info("Deleting quiz {}", quizId);
                quizRepository.delete(quiz);
                logger.info("Successfully deleted quiz {} and all related data", quizId);
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
                dto.setQuizType(quiz.getQuizType() != null ? quiz.getQuizType().name() : null);
                dto.setLessonId(quiz.getLesson() != null ? quiz.getLesson().getId() : null);
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

                return convertAttemptToDTO(attempt);
        }
}