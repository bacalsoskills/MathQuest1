package com.mathquest.demo.Controller;

import com.mathquest.demo.DTO.ActivityCompletionDTO;
import com.mathquest.demo.DTO.ActivityDTO;
import com.mathquest.demo.DTO.Request.CreateActivityRequest;
import com.mathquest.demo.DTO.Request.SubmitActivityRequest;
import com.mathquest.demo.Model.ActivityType;
import com.mathquest.demo.Model.User;
import com.mathquest.demo.Repository.UserRepository;
import com.mathquest.demo.Security.services.UserDetailsImpl;
import com.mathquest.demo.Service.ActivityService;
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

@RestController
@RequestMapping("/activities")
public class ActivityController {

    @Autowired
    private ActivityService activityService;

    @Autowired
    private UserRepository userRepository;

    // Endpoint for teachers to create an activity
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ActivityDTO> createActivity(@Valid @ModelAttribute CreateActivityRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        ActivityDTO createdActivity = activityService.createActivity(request, currentUser);
        return new ResponseEntity<>(createdActivity, HttpStatus.CREATED);
    }

    // Endpoint to get a specific activity by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ActivityDTO> getActivityById(@PathVariable Long id) {
        ActivityDTO activity = activityService.getActivityById(id);
        return ResponseEntity.ok(activity);
    }

    // Endpoint to get activities by classroom ID
    @GetMapping("/classroom/{classroomId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<List<ActivityDTO>> getActivitiesByClassroomId(@PathVariable Long classroomId) {
        List<ActivityDTO> activities = activityService.getActivitiesByClassroomId(classroomId);
        return ResponseEntity.ok(activities);
    }

    // Endpoint to get activities by classroom ID and type
    @GetMapping("/classroom/{classroomId}/type/{type}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<List<ActivityDTO>> getActivitiesByClassroomIdAndType(
            @PathVariable Long classroomId,
            @PathVariable ActivityType type) {
        List<ActivityDTO> activities = activityService.getActivitiesByClassroomIdAndType(classroomId, type);
        return ResponseEntity.ok(activities);
    }

    // Endpoint for teachers to update an activity
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ActivityDTO> updateActivity(
            @PathVariable Long id,
            @Valid @ModelAttribute CreateActivityRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        ActivityDTO updatedActivity = activityService.updateActivity(id, request, currentUser);
        return ResponseEntity.ok(updatedActivity);
    }

    // Endpoint for teachers to delete an activity
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> deleteActivity(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        activityService.deleteActivity(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    // Endpoint for students to start an activity
    @PostMapping("/{activityId}/start")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ActivityCompletionDTO> startActivity(@PathVariable Long activityId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        ActivityCompletionDTO activityCompletion = activityService.startActivity(activityId, currentUser);
        return ResponseEntity.ok(activityCompletion);
    }

    // Endpoint for students to submit an activity
    @PostMapping("/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ActivityCompletionDTO> submitActivity(@Valid @RequestBody SubmitActivityRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        ActivityCompletionDTO activityCompletion = activityService.submitActivity(request, currentUser);
        return ResponseEntity.ok(activityCompletion);
    }

    // Endpoint to get leaderboard for a classroom
    @GetMapping("/leaderboard/{classroomId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getLeaderboard(@PathVariable Long classroomId) {
        Map<String, Object> leaderboard = activityService.getStudentLeaderboard(classroomId);
        return ResponseEntity.ok(leaderboard);
    }

    // Endpoint to get student progress in a classroom
    @GetMapping("/progress/{classroomId}/student/{studentId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getStudentProgress(
            @PathVariable Long classroomId,
            @PathVariable Long studentId) {
        Map<String, Object> progress = activityService.getStudentProgress(classroomId, studentId);
        return ResponseEntity.ok(progress);
    }
}