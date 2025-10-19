package com.mathquest.demo.DTO.Request;

import com.mathquest.demo.Model.Feedback.FeedbackStatus;
import lombok.Data;

@Data
public class UpdateFeedbackRequest {
    private FeedbackStatus status;
    private String adminResponse;
}