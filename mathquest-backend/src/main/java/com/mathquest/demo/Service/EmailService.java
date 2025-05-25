package com.mathquest.demo.Service;

import com.mailjet.client.ClientOptions;
import com.mailjet.client.MailjetClient;
import com.mailjet.client.MailjetRequest;
import com.mailjet.client.MailjetResponse;
import com.mailjet.client.errors.MailjetException;
import com.mailjet.client.resource.Emailv31;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final MailjetClient client;

    @Value("${mailjet.sender.email}")
    private String senderEmail;

    @Value("${mailjet.sender.name}")
    private String senderName;

    @Value("${app.email.development-mode:true}")
    private boolean developmentMode;

    @Value("${app.baseUrl}")
    private String baseUrl;

    public EmailService(@Value("${mailjet.api.key:}") String apiKey,
            @Value("${mailjet.api.secret:}") String apiSecret) {
        if (!developmentMode && !apiKey.isEmpty() && !apiSecret.isEmpty()) {
            client = new MailjetClient(ClientOptions.builder()
                    .apiKey(apiKey)
                    .apiSecretKey(apiSecret)
                    .build());
        } else {
            client = null;
        }
    }

    public void sendVerificationEmail(String to, String token) {
        String verificationLink = baseUrl + "/auth/verify?token=" + token;

        if (developmentMode || client == null) {
            // In development mode, just log the verification link
            logger.info("==================================================================================");
            logger.info("DEVELOPMENT MODE: Email verification");
            logger.info("To: {}", to);
            logger.info("Subject: Email Verification");
            logger.info("Verification Link: {}", verificationLink);
            logger.info("==================================================================================");
            return;
        }

        try {
            MailjetRequest request = new MailjetRequest(Emailv31.resource)
                    .property(Emailv31.MESSAGES, new JSONArray()
                            .put(new JSONObject()
                                    .put(Emailv31.Message.FROM, new JSONObject()
                                            .put("Email", senderEmail)
                                            .put("Name", senderName))
                                    .put(Emailv31.Message.TO, new JSONArray()
                                            .put(new JSONObject()
                                                    .put("Email", to)))
                                    .put(Emailv31.Message.SUBJECT, "Email Verification")
                                    .put(Emailv31.Message.TEXTPART,
                                            "Please click on the link below to verify your email:\n\n"
                                                    + verificationLink)
                                    .put(Emailv31.Message.HTMLPART, "<h3>Welcome to MathQuest!</h3>" +
                                            "<p>Please click on the link below to verify your email:</p>" +
                                            "<p><a href='" + verificationLink + "'>Verify Email</a></p>")));

            MailjetResponse response = client.post(request);
            if (response.getStatus() != 200) {
                throw new RuntimeException("Failed to send email: " + response.getData());
            }
        } catch (MailjetException e) {
            throw new RuntimeException("Error sending verification email", e);
        }
    }

    public void sendPasswordResetEmail(String to, String token) {
        String subject = "Reset Your Password";
        // Format the reset link to work with the frontend route
        String resetLink = baseUrl + "/reset-password?token=" + token;
        String content = String.format(
                "Hello,\n\n" +
                        "You have requested to reset your password. Click the link below to set a new password:\n\n" +
                        "%s\n\n" +
                        "If you did not request this, please ignore this email.\n\n" +
                        "Best regards,\n" +
                        "MathQuest Team",
                resetLink);

        if (developmentMode || client == null) {
            // In development mode, just log the email content
            logger.info("==================================================================================");
            logger.info("DEVELOPMENT MODE: Password Reset Email");
            logger.info("To: {}", to);
            logger.info("Subject: {}", subject);
            logger.info("Reset Link: {}", resetLink);
            logger.info("==================================================================================");
            return;
        }

        try {
            MailjetRequest request = new MailjetRequest(Emailv31.resource)
                    .property(Emailv31.MESSAGES, new JSONArray()
                            .put(new JSONObject()
                                    .put(Emailv31.Message.FROM, new JSONObject()
                                            .put("Email", senderEmail)
                                            .put("Name", senderName))
                                    .put(Emailv31.Message.TO, new JSONArray()
                                            .put(new JSONObject()
                                                    .put("Email", to)))
                                    .put(Emailv31.Message.SUBJECT, subject)
                                    .put(Emailv31.Message.TEXTPART, content)
                                    .put(Emailv31.Message.HTMLPART,
                                            "<h3>Reset Your Password</h3>" +
                                                    "<p>You have requested to reset your password. Click the link below to set a new password:</p>"
                                                    +
                                                    "<p><a href='" + resetLink + "'>Reset Password</a></p>" +
                                                    "<p>If you did not request this, please ignore this email.</p>" +
                                                    "<p>Best regards,<br/>MathQuest Team</p>")));

            MailjetResponse response = client.post(request);
            if (response.getStatus() != 200) {
                throw new RuntimeException("Failed to send email: " + response.getData());
            }
        } catch (MailjetException e) {
            throw new RuntimeException("Error sending password reset email", e);
        }
    }

    public void sendEmailUpdateVerification(String to, String token) {
        String verificationLink = baseUrl + "/users/verify-email?token=" + token;
        String subject = "Verify Your Email Update";
        String content = "Please click on the link below to verify your email update:\n\n" + verificationLink +
                "\n\nThis link will expire in 24 hours.";

        if (developmentMode || client == null) {
            // In development mode, just log the verification link
            logger.info("==================================================================================");
            logger.info("DEVELOPMENT MODE: Email Update Verification");
            logger.info("To: {}", to);
            logger.info("Subject: {}", subject);
            logger.info("Verification Link: {}", verificationLink);
            logger.info("Expires in: 24 hours");
            logger.info("==================================================================================");
            return;
        }

        try {
            MailjetRequest request = new MailjetRequest(Emailv31.resource)
                    .property(Emailv31.MESSAGES, new JSONArray()
                            .put(new JSONObject()
                                    .put(Emailv31.Message.FROM, new JSONObject()
                                            .put("Email", senderEmail)
                                            .put("Name", senderName))
                                    .put(Emailv31.Message.TO, new JSONArray()
                                            .put(new JSONObject()
                                                    .put("Email", to)))
                                    .put(Emailv31.Message.SUBJECT, subject)
                                    .put(Emailv31.Message.TEXTPART, content)
                                    .put(Emailv31.Message.HTMLPART, "<h3>Verify Your Email Update</h3>" +
                                            "<p>Please click on the link below to verify your email update:</p>" +
                                            "<p><a href='" + verificationLink + "'>Verify Email Update</a></p>" +
                                            "<p><em>This link will expire in 24 hours.</em></p>")));

            MailjetResponse response = client.post(request);
            if (response.getStatus() != 200) {
                throw new RuntimeException("Failed to send email: " + response.getData());
            }
        } catch (MailjetException e) {
            throw new RuntimeException("Error sending email update verification", e);
        }
    }

    private void sendEmail(String to, String subject, String content) {
        if (developmentMode || client == null) {
            // In development mode, just log the email content
            logger.info("==================================================================================");
            logger.info("DEVELOPMENT MODE: Email");
            logger.info("To: {}", to);
            logger.info("Subject: {}", subject);
            logger.info("Content: {}", content);
            logger.info("==================================================================================");
            return;
        }

        try {
            MailjetRequest request = new MailjetRequest(Emailv31.resource)
                    .property(Emailv31.MESSAGES, new JSONArray()
                            .put(new JSONObject()
                                    .put(Emailv31.Message.FROM, new JSONObject()
                                            .put("Email", senderEmail)
                                            .put("Name", senderName))
                                    .put(Emailv31.Message.TO, new JSONArray()
                                            .put(new JSONObject()
                                                    .put("Email", to)))
                                    .put(Emailv31.Message.SUBJECT, subject)
                                    .put(Emailv31.Message.TEXTPART, content)
                                    .put(Emailv31.Message.HTMLPART,
                                            "<h3>" + subject + "</h3>" +
                                                    "<p>" + content.replace("\n", "<br/>") + "</p>")));

            MailjetResponse response = client.post(request);
            if (response.getStatus() != 200) {
                throw new RuntimeException("Failed to send email: " + response.getData());
            }
        } catch (MailjetException e) {
            throw new RuntimeException("Error sending email", e);
        }
    }
}