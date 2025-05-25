package com.mathquest.demo.Controller;

import com.mathquest.demo.DTO.LeaderboardEntryDTO;
import com.mathquest.demo.DTO.QuizAttemptDTO;
import com.mathquest.demo.DTO.QuizDTO;
import com.mathquest.demo.DTO.StudentPerformanceDTO;
import com.mathquest.demo.Service.LeaderboardService;
import com.mathquest.demo.Service.QuizAttemptService;
import com.mathquest.demo.Service.QuizService;
import com.mathquest.demo.Service.StudentPerformanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/quizzes")
public class QuizController {

    @Autowired
    private QuizService quizService;

    @Autowired
    private QuizAttemptService quizAttemptService;

    @Autowired
    private LeaderboardService leaderboardService;

    @Autowired
    private StudentPerformanceService studentPerformanceService;

    // Quiz endpoints

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

    // Quiz attempt endpoints

    @PostMapping("/{quizId}/attempts/start")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<QuizAttemptDTO> startQuizAttempt(
            @PathVariable Long quizId,
            @RequestParam Long studentId) {
        return ResponseEntity.ok(quizAttemptService.startQuizAttempt(quizId, studentId));
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
    public ResponseEntity<List<LeaderboardEntryDTO>> getQuizLeaderboard(@PathVariable Long quizId) {
        return ResponseEntity.ok(leaderboardService.getLeaderboardByQuiz(quizId));
    }

    @GetMapping("/classroom/{classroomId}/leaderboard")
    public ResponseEntity<?> getClassroomLeaderboard(@PathVariable Long classroomId) {
        try {
            if (classroomId == null) {
                return ResponseEntity.badRequest().body("Classroom ID cannot be null");
            }
            List<LeaderboardEntryDTO> entries = leaderboardService.getLeaderboardByClassroom(classroomId);
            return ResponseEntity.ok(entries);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace(); // Log to console for debugging
            return ResponseEntity.status(500).body("Error retrieving leaderboard: " + e.getMessage());
        }
    }

    @GetMapping("/classroom/{classroomId}/leaderboard/participation")
    public ResponseEntity<List<LeaderboardEntryDTO>> getParticipationLeaderboard(@PathVariable Long classroomId) {
        return ResponseEntity.ok(leaderboardService.getTopStudentsByParticipation(classroomId));
    }

    // Student performance endpoints

    @GetMapping("/performance/student/{studentId}/classroom/{classroomId}")
    public ResponseEntity<StudentPerformanceDTO> getStudentPerformance(
            @PathVariable Long studentId,
            @PathVariable Long classroomId) {
        return ResponseEntity.ok(studentPerformanceService.getStudentPerformance(studentId, classroomId));
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