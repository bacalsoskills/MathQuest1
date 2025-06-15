package com.mathquest.demo.Controller;

import com.mathquest.demo.DTO.Request.UpdateFeedbackRequest;
import com.mathquest.demo.Model.Feedback;
import com.mathquest.demo.Model.Feedback.FeedbackStatus;
import com.mathquest.demo.Service.FeedbackService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000", maxAge = 3600)
@RestController
@RequestMapping("/admin/feedback")
@PreAuthorize("hasRole('ADMIN')")
public class AdminFeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @GetMapping
    public ResponseEntity<List<Feedback>> getAllFeedback() {
        List<Feedback> feedback = feedbackService.getAllFeedback();
        return ResponseEntity.ok(feedback);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Feedback> getFeedbackById(@PathVariable Long id) {
        Feedback feedback = feedbackService.getFeedbackById(id);
        return ResponseEntity.ok(feedback);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Feedback> updateFeedback(
            @PathVariable Long id,
            @Valid @RequestBody UpdateFeedbackRequest request) {
        Feedback updatedFeedback = feedbackService.updateFeedback(id, request);
        return ResponseEntity.ok(updatedFeedback);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Feedback> updateFeedbackStatus(
            @PathVariable Long id,
            @RequestBody Map<String, FeedbackStatus> request) {
        FeedbackStatus newStatus = request.get("status");
        if (newStatus == null) {
            return ResponseEntity.badRequest().build();
        }
        Feedback updatedFeedback = feedbackService.updateFeedbackStatus(id, newStatus);
        return ResponseEntity.ok(updatedFeedback);
    }

    @GetMapping("/ticket/{ticketNumber}")
    public ResponseEntity<Feedback> getFeedbackByTicketNumber(@PathVariable String ticketNumber) {
        Feedback feedback = feedbackService.getFeedbackByTicketNumber(ticketNumber);
        return ResponseEntity.ok(feedback);
    }
}