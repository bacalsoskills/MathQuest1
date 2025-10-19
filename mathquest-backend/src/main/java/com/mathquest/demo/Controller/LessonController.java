package com.mathquest.demo.Controller;

import com.mathquest.demo.DTO.LessonDTO;
import com.mathquest.demo.DTO.LessonCompletionDTO;
import com.mathquest.demo.DTO.Request.CreateLessonRequest;
import com.mathquest.demo.Model.User;
import com.mathquest.demo.Repository.UserRepository;
import com.mathquest.demo.Security.services.UserDetailsImpl;
import com.mathquest.demo.Service.LessonService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000", maxAge = 3600, allowedHeaders = { "Authorization", "Content-Type",
        "Accept" }, methods = { RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
                RequestMethod.DELETE, RequestMethod.OPTIONS })
@RestController
@RequestMapping("/lessons")
public class LessonController {

    @Autowired
    private LessonService lessonService;

    @Autowired
    private UserRepository userRepository;

    // Endpoint for teachers to create a lesson
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<LessonDTO> createLesson(@Valid @ModelAttribute CreateLessonRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        LessonDTO createdLesson = lessonService.createLesson(request, currentUser);
        return new ResponseEntity<>(createdLesson, HttpStatus.CREATED);
    }

    // Endpoint to get a specific lesson by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<LessonDTO> getLessonById(@PathVariable Long id) {
        LessonDTO lesson = lessonService.getLessonById(id);
        return ResponseEntity.ok(lesson);
    }

    // Endpoint to get lessons by classroom ID
    @GetMapping("/classroom/{classroomId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<List<LessonDTO>> getLessonsByClassroomId(@PathVariable Long classroomId) {
        List<LessonDTO> lessons = lessonService.getLessonsByClassroomId(classroomId);
        return ResponseEntity.ok(lessons);
    }

    // Endpoint for teachers to update a lesson
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<LessonDTO> updateLesson(
            @PathVariable Long id,
            @ModelAttribute CreateLessonRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            User currentUser = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Error: User is not found."));

            // Log the request parameters
            System.out.println("Update lesson request received for lesson ID: " + id);
            System.out.println("Title: " + request.getTitle());
            System.out.println("ClassroomId: " + request.getClassroomId());
            System.out.println("Has image: " + (request.getImage() != null && !request.getImage().isEmpty()));

            // Special handling for "undefined" classroomId
            if (request.getClassroomId() == null) {
                // Get current classroomId from the existing lesson
                LessonDTO existingLesson = lessonService.getLessonById(id);
                if (existingLesson != null) {
                    System.out.println("Setting classroomId from existing lesson: " + existingLesson.getClassroomId());
                    request.setClassroomId(existingLesson.getClassroomId());
                }
            }

            LessonDTO updatedLesson = lessonService.updateLesson(id, request, currentUser);
            return ResponseEntity.ok(updatedLesson);
        } catch (Exception e) {
            System.err.println("Error in updateLesson controller method: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // Endpoint for teachers to delete a lesson
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> deleteLesson(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        lessonService.deleteLesson(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{lessonId}/mark-read")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> markLessonAsRead(
            @PathVariable Long lessonId,
            @RequestBody Map<String, Long> request) {
        Long studentId = request.get("studentId");
        if (studentId == null) {
            return ResponseEntity.badRequest().build();
        }

        lessonService.markLessonContentAsRead(lessonId, studentId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{lessonId}/mark-quiz-completed")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> markQuizAsCompleted(
            @PathVariable Long lessonId,
            @RequestBody Map<String, Object> request) {
        Long studentId = ((Number) request.get("studentId")).longValue();
        Integer score = ((Number) request.get("score")).intValue();

        if (studentId == null || score == null) {
            return ResponseEntity.badRequest().build();
        }

        lessonService.markLessonQuizAsCompleted(lessonId, studentId, score);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{lessonId}/completion-stats")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Map<String, Object>> getLessonCompletionStats(@PathVariable Long lessonId) {
        Map<String, Object> stats = lessonService.getLessonCompletionStats(lessonId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{lessonId}/completion-status/{studentId}")
    public ResponseEntity<LessonCompletionDTO> getLessonCompletionStatus(
            @PathVariable Long lessonId,
            @PathVariable Long studentId) {
        LessonCompletionDTO status = lessonService.getLessonCompletionStatus(lessonId, studentId);
        return ResponseEntity.ok(status);
    }

    @GetMapping("/{lessonId}/students-read")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<User>> getStudentsWhoReadLesson(@PathVariable Long lessonId) {
        List<User> students = lessonService.getStudentsWhoReadLesson(lessonId);
        return ResponseEntity.ok(students);
    }
}