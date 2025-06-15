package com.mathquest.demo.Controller;

import com.mathquest.demo.DTO.Request.CreateFeedbackRequest;
import com.mathquest.demo.Model.Feedback;
import com.mathquest.demo.Service.FeedbackService;
import com.mathquest.demo.Security.services.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000", maxAge = 3600)
@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @PostMapping
    public ResponseEntity<Feedback> createFeedback(
            @Valid @RequestBody CreateFeedbackRequest request,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Long userId = userDetails.getId();
        Feedback feedback = feedbackService.createFeedback(request, userId);
        return ResponseEntity.ok(feedback);
    }

    @GetMapping("/my-feedback")
    public ResponseEntity<List<Feedback>> getMyFeedback(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Long userId = userDetails.getId();
        List<Feedback> feedback = feedbackService.getUserFeedback(userId);
        return ResponseEntity.ok(feedback);
    }

    @GetMapping("/ticket/{ticketNumber}")
    public ResponseEntity<Feedback> getFeedbackByTicketNumber(@PathVariable String ticketNumber) {
        Feedback feedback = feedbackService.getFeedbackByTicketNumber(ticketNumber);
        return ResponseEntity.ok(feedback);
    }
}