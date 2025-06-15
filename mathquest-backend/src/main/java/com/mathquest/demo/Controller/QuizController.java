package com.mathquest.demo.Controller;

import com.mathquest.demo.DTO.LeaderboardEntryDTO;
import com.mathquest.demo.DTO.QuizAttemptDTO;
import com.mathquest.demo.DTO.QuizDTO;
import com.mathquest.demo.DTO.StudentPerformanceDTO;
import com.mathquest.demo.DTO.ErrorResponse;
import com.mathquest.demo.Service.LeaderboardService;
import com.mathquest.demo.Service.QuizAttemptService;
import com.mathquest.demo.Service.QuizService;
import com.mathquest.demo.Service.StudentPerformanceService;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/quizzes")
public class QuizController {
    private static final Logger logger = LoggerFactory.getLogger(QuizController.class);

    @Autowired
    private QuizService quizService;

    @Autowired
    private QuizAttemptService quizAttemptService;

    @Autowired
    private LeaderboardService leaderboardService;

    @Autowired
    private StudentPerformanceService studentPerformanceService;

    // Quiz endpoints

    /**
     * Create a new quiz for an activity. Optionally link to a lesson and specify
     * quiz type.
     * 
     * @param activityId The activity ID
     * @param quizDTO    The quiz data (include quizType and lessonId if needed)
     * @return The created quiz
     */
    @PostMapping("/activities/{activityId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<QuizDTO> createQuiz(@PathVariable Long activityId, @RequestBody QuizDTO quizDTO) {
        return ResponseEntity.ok(quizService.createQuiz(activityId, quizDTO));
    }

    @GetMapping("/{quizId}")
    public ResponseEntity<QuizDTO> getQuiz(@PathVariable Long quizId) {
        return ResponseEntity.ok(quizService.getQuiz(quizId));
    }

    @GetMapping("/activities/{activityId}")
    public ResponseEntity<QuizDTO> getQuizByActivity(@PathVariable Long activityId) {
        return ResponseEntity.ok(quizService.getQuizByActivityId(activityId));
    }

    /**
     * Update an existing quiz. Optionally update quiz type and lesson link.
     * 
     * @param quizId  The quiz ID
     * @param quizDTO The updated quiz data (include quizType and lessonId if
     *                needed)
     * @return The updated quiz
     */
    @PutMapping("/{quizId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<QuizDTO> updateQuiz(@PathVariable Long quizId, @RequestBody QuizDTO quizDTO) {
        return ResponseEntity.ok(quizService.updateQuiz(quizId, quizDTO));
    }

    @DeleteMapping("/{quizId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> deleteQuiz(@PathVariable Long quizId) {
        quizService.deleteQuiz(quizId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/classroom/{classroomId}")
    public ResponseEntity<List<QuizDTO>> getQuizzesByClassroom(@PathVariable Long classroomId) {
        return ResponseEntity.ok(quizService.getQuizzesByClassroom(classroomId));
    }

    @GetMapping("/classroom/{classroomId}/available")
    public ResponseEntity<List<QuizDTO>> getAvailableQuizzes(@PathVariable Long classroomId) {
        return ResponseEntity.ok(quizService.getAvailableQuizzes(classroomId));
    }

    @GetMapping("/activity/{activityId}")
    public ResponseEntity<QuizDTO> getQuizByActivityId(@PathVariable Long activityId) {
        try {
            QuizDTO quiz = quizService.getQuizByActivityId(activityId);
            return ResponseEntity.ok(quiz);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Quiz attempt endpoints

    @PostMapping("/{quizId}/attempts/start")
    public ResponseEntity<?> startQuizAttempt(
            @PathVariable Long quizId,
            @RequestParam Long studentId) {
        logger.info("Received request to start quiz attempt - quizId: {}, studentId: {}", quizId, studentId);

        try {
            QuizAttemptDTO attempt = quizAttemptService.startQuizAttempt(quizId, studentId);
            logger.info("Successfully created quiz attempt with id: {}", attempt.getId());
            return ResponseEntity.ok(attempt);
        } catch (EntityNotFoundException e) {
            logger.error("Entity not found while starting quiz attempt: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            logger.error("Invalid state while starting quiz attempt: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error while starting quiz attempt", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to start quiz attempt: " + e.getMessage()));
        }
    }

    @PostMapping("/attempts/{attemptId}/complete")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<QuizAttemptDTO> completeQuizAttempt(
            @PathVariable Long attemptId,
            @RequestBody Map<String, Object> payload) {
        Integer score = (Integer) payload.get("score");
        String answers = (String) payload.get("answers");
        return ResponseEntity.ok(quizAttemptService.completeQuizAttempt(attemptId, score, answers));
    }

    @GetMapping("/attempts/{attemptId}")
    public ResponseEntity<QuizAttemptDTO> getQuizAttempt(@PathVariable Long attemptId) {
        return ResponseEntity.ok(quizAttemptService.getQuizAttempt(attemptId));
    }

    @GetMapping("/attempts/student/{studentId}")
    public ResponseEntity<List<QuizAttemptDTO>> getQuizAttemptsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(quizAttemptService.getQuizAttemptsByStudent(studentId));
    }

    @GetMapping("/{quizId}/attempts")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<QuizAttemptDTO>> getQuizAttemptsByQuiz(@PathVariable Long quizId) {
        return ResponseEntity.ok(quizAttemptService.getQuizAttemptsByQuiz(quizId));
    }

    @GetMapping("/{quizId}/attempts/top")
    public ResponseEntity<List<QuizAttemptDTO>> getTopQuizAttempts(@PathVariable Long quizId) {
        return ResponseEntity.ok(quizAttemptService.getTop10QuizAttemptsByQuiz(quizId));
    }

    // Leaderboard endpoints

    @GetMapping("/{quizId}/leaderboard")
    public ResponseEntity<?> getQuizLeaderboard(@PathVariable Long quizId) {
        try {
            logger.info("Getting leaderboard for quiz ID: {}", quizId);
            List<LeaderboardEntryDTO> entries = leaderboardService.getLeaderboardByQuiz(quizId);
            return ResponseEntity.ok(entries);
        } catch (Exception e) {
            logger.error("Error getting quiz leaderboard: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Error retrieving quiz leaderboard: " + e.getMessage());
        }
    }

    @GetMapping("/classroom/{classroomId}/leaderboard")
    public ResponseEntity<?> getClassroomLeaderboard(@PathVariable Long classroomId) {
        try {
            logger.info("Getting classroom leaderboard for classroom ID: {}", classroomId);
            if (classroomId == null) {
                return ResponseEntity.badRequest().body("Classroom ID cannot be null");
            }
            List<LeaderboardEntryDTO> entries = leaderboardService.getLeaderboardByClassroom(classroomId);
            return ResponseEntity.ok(entries);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid argument in getClassroomLeaderboard: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error getting classroom leaderboard: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Error retrieving classroom leaderboard: " + e.getMessage());
        }
    }

    @GetMapping("/classroom/{classroomId}/leaderboard/participation")
    public ResponseEntity<?> getParticipationLeaderboard(@PathVariable Long classroomId) {
        try {
            logger.info("Getting participation leaderboard for classroom ID: {}", classroomId);
            List<LeaderboardEntryDTO> entries = leaderboardService.getTopStudentsByParticipation(classroomId);
            return ResponseEntity.ok(entries);
        } catch (Exception e) {
            logger.error("Error getting participation leaderboard: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Error retrieving participation leaderboard: " + e.getMessage());
        }
    }

    // Student performance endpoints

    @GetMapping("/performance/student/{studentId}/classroom/{classroomId}")
    public ResponseEntity<?> getStudentPerformance(
            @PathVariable Long studentId,
            @PathVariable Long classroomId) {
        try {
            logger.info("Getting student performance for student ID: {} in classroom ID: {}", studentId, classroomId);
            StudentPerformanceDTO performance = studentPerformanceService.getStudentPerformance(studentId, classroomId);
            return ResponseEntity.ok(performance);
        } catch (Exception e) {
            logger.error("Error getting student performance: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Error retrieving student performance: " + e.getMessage());
        }
    }

    @GetMapping("/performance/student/{studentId}/overall")
    public ResponseEntity<StudentPerformanceDTO> getOverallStudentPerformance(@PathVariable Long studentId) {
        return ResponseEntity.ok(studentPerformanceService.getOverallStudentPerformance(studentId));
    }

    @GetMapping("/performance/classroom/{classroomId}/top")
    public ResponseEntity<List<StudentPerformanceDTO>> getTopPerformers(@PathVariable Long classroomId) {
        return ResponseEntity.ok(studentPerformanceService.getTopPerformers(classroomId));
    }

    @GetMapping("/performance/classroom/{classroomId}/attention")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<StudentPerformanceDTO>> getStudentsNeedingAttention(@PathVariable Long classroomId) {
        return ResponseEntity.ok(studentPerformanceService.getStudentsNeedingAttention(classroomId));
    }

    @GetMapping("/performance/classroom/{classroomId}/average")
    public ResponseEntity<Double> getClassroomAverageScore(@PathVariable Long classroomId) {
        return ResponseEntity.ok(studentPerformanceService.getClassroomAverageScore(classroomId));
    }

    @GetMapping("/classroom/{classroomId}/all-data")
    public ResponseEntity<Map<String, Object>> getClassroomQuizData(@PathVariable Long classroomId) {
        return ResponseEntity.ok(quizService.getClassroomQuizData(classroomId));
    }

    @GetMapping("/classroom/{classroomId}/attempts")
    public ResponseEntity<Map<String, Object>> getQuizAttemptsByClassroom(@PathVariable Long classroomId) {
        return ResponseEntity.ok(quizService.getQuizAttemptsByClassroom(classroomId));
    }
}