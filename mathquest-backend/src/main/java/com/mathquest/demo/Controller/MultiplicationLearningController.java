package com.mathquest.demo.Controller;

import com.mathquest.demo.DTO.*;
import com.mathquest.demo.Model.User;
import com.mathquest.demo.Repository.UserRepository;
import com.mathquest.demo.Security.services.UserDetailsImpl;
import com.mathquest.demo.Service.MultiplicationLearningService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/multiplication-learning")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"}, allowCredentials = "true")
public class MultiplicationLearningController {

    @Autowired
    private MultiplicationLearningService multiplicationLearningService;

    @Autowired
    private UserRepository userRepository;
    
    
    @GetMapping("/progress")
    public ResponseEntity<MultiplicationLearningProgressDTO> getProgress(Authentication authentication) {
        try {
          Object principal = authentication.getPrincipal();
        // Get user ID from your UserDetailsImpl
        Long userId = ((UserDetailsImpl) principal).getId();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
            MultiplicationLearningProgressDTO progress = multiplicationLearningService.getProgress(user);
            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

   @PostMapping("/progress")
public ResponseEntity<MultiplicationLearningProgressDTO> saveProgress(
        @RequestBody SaveProgressRequest request,
        Authentication authentication) {
    try {
        Object principal = authentication.getPrincipal();
        // Get user ID from your UserDetailsImpl
        Long userId = ((UserDetailsImpl) principal).getId();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        MultiplicationLearningProgressDTO progress = multiplicationLearningService.saveProgress(user, request);
        return ResponseEntity.ok(progress);
    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.badRequest().build();
    }
}

    @PostMapping("/complete-property")
    public ResponseEntity<MultiplicationLearningProgressDTO> completeProperty(
            @RequestBody CompletePropertyRequest request,
            Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            MultiplicationLearningProgressDTO progress = multiplicationLearningService.completeProperty(user, request);
            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/quiz-attempt")
    public ResponseEntity<MultiplicationQuizAttemptDTO> saveQuizAttempt(
            @RequestBody SaveQuizAttemptRequest request,
            Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            MultiplicationQuizAttemptDTO attempt = multiplicationLearningService.saveQuizAttempt(user, request);
            return ResponseEntity.ok(attempt);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/quiz-attempts")
    public ResponseEntity<List<MultiplicationQuizAttemptDTO>> getQuizAttempts(
            @RequestParam(required = false) Integer propertyIndex,
            @RequestParam(required = false) Integer stepIndex,
            Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            List<MultiplicationQuizAttemptDTO> attempts;
            
            if (propertyIndex != null && stepIndex != null) {
                attempts = multiplicationLearningService.getQuizAttempts(user, propertyIndex, stepIndex);
            } else {
                // Return all attempts for the user
                MultiplicationLearningProgressDTO progress = multiplicationLearningService.getProgress(user);
                attempts = progress.getRecentQuizAttempts();
            }
            
            return ResponseEntity.ok(attempts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/property-completions")
    public ResponseEntity<List<MultiplicationPropertyCompletionDTO>> getPropertyCompletions(Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            List<MultiplicationPropertyCompletionDTO> completions = multiplicationLearningService.getPropertyCompletions(user);
            return ResponseEntity.ok(completions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
