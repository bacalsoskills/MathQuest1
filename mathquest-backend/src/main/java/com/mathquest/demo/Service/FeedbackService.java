package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.Request.CreateFeedbackRequest;
import com.mathquest.demo.DTO.Request.UpdateFeedbackRequest;
import com.mathquest.demo.Model.Feedback;
import com.mathquest.demo.Model.User;
import com.mathquest.demo.Repository.FeedbackRepository;
import com.mathquest.demo.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Transactional
    public Feedback createFeedback(CreateFeedbackRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Feedback feedback = new Feedback();
        feedback.setSubject(request.getSubject());
        feedback.setInfo(request.getInfo());
        feedback.setDateSubmission(LocalDateTime.now());
        feedback.setStatus(Feedback.FeedbackStatus.PENDING);
        feedback.setUser(user);

        // Generate unique ticket number
        String ticketNumber = generateTicketNumber();
        feedback.setTicketNumber(ticketNumber);

        Feedback savedFeedback = feedbackRepository.save(feedback);

        // Send email notification to user
        String emailSubject = "Feedback Ticket Created - " + ticketNumber;
        String emailBody = String.format(
                "Dear %s,\n\nYour feedback has been received and a ticket has been created.\n\n" +
                        "Ticket Number: %s\nSubject: %s\nStatus: %s\n\n" +
                        "We will review your feedback and get back to you soon.\n\n" +
                        "Best regards,\nMathQuest Team",
                user.getUsername(),
                ticketNumber,
                request.getSubject(),
                Feedback.FeedbackStatus.PENDING);

        emailService.sendEmail(user.getEmail(), emailSubject, emailBody);

        return savedFeedback;
    }

    @Transactional
    public Feedback updateFeedback(Long feedbackId, UpdateFeedbackRequest request) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));

        if (request.getStatus() != null) {
            feedback.setStatus(request.getStatus());
        }
        if (request.getAdminResponse() != null && !request.getAdminResponse().trim().isEmpty()) {
            feedback.setAdminResponse(request.getAdminResponse());

            // Only send email if there's a response
            String emailSubject = "Feedback Update - " + feedback.getTicketNumber();
            String emailBody = String.format(
                    "Dear %s,\n\nYour feedback has been updated.\n\n" +
                            "Ticket Number: %s\nSubject: %s\nStatus: %s\n\n" +
                            "Admin Response: %s\n\n" +
                            "Best regards,\nMathQuest Team",
                    feedback.getUser().getUsername(),
                    feedback.getTicketNumber(),
                    feedback.getSubject(),
                    feedback.getStatus(),
                    feedback.getAdminResponse());

            emailService.sendEmail(feedback.getUser().getEmail(), emailSubject, emailBody);
        }

        return feedbackRepository.save(feedback);
    }

    @Transactional
    public Feedback updateFeedbackStatus(Long feedbackId, Feedback.FeedbackStatus newStatus) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));

        feedback.setStatus(newStatus);
        return feedbackRepository.save(feedback);
    }

    public List<Feedback> getAllFeedback() {
        return feedbackRepository.findAllByOrderByDateSubmissionDesc();
    }

    public List<Feedback> getUserFeedback(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return feedbackRepository.findByUser(user);
    }

    public Feedback getFeedbackByTicketNumber(String ticketNumber) {
        return feedbackRepository.findByTicketNumber(ticketNumber);
    }

    public Feedback getFeedbackById(Long id) {
        return feedbackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));
    }

    private String generateTicketNumber() {
        // Format: TICKET-YYYYMMDD-XXXXX
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = UUID.randomUUID().toString().substring(0, 5).toUpperCase();
        return String.format("TICKET-%s-%s", date, random);
    }
}