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
        String verificationLink = baseUrl + "/#/auth/verify?token=" + token;

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

        String htmlContent = "<!DOCTYPE html>" +
                "<html>" +
                "<head><meta charset='UTF-8'></head>" +
                "<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;'>" +
                "<div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>" +
                "<h1 style='color: white; margin: 0; font-size: 28px;'>Welcome to MathQuest! 🎓</h1>" +
                "</div>" +
                "<div style='background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;'>" +
                "<h2 style='color: #667eea; margin-top: 0;'>Verify Your Email Address</h2>" +
                "<p>Thank you for registering with MathQuest! We're excited to have you join our learning community.</p>" +
                "<p>To complete your registration and start your math adventure, please verify your email address by clicking the button below:</p>" +
                "<div style='text-align: center; margin: 30px 0;'>" +
                "<a href='" + verificationLink + "' style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Verify Email Address</a>" +
                "</div>" +
                "<p style='color: #666; font-size: 14px;'>Or copy and paste this link into your browser:</p>" +
                "<p style='background: white; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;'>" + verificationLink + "</p>" +
                "<hr style='border: none; border-top: 1px solid #ddd; margin: 30px 0;'>" +
                "<p style='color: #666; font-size: 13px;'>If you didn't create a MathQuest account, you can safely ignore this email.</p>" +
                "<p style='color: #999; font-size: 12px; text-align: center; margin-top: 30px;'>" +
                "© 2024 MathQuest. All rights reserved.<br>" +
                "This is an automated message, please do not reply to this email." +
                "</p>" +
                "</div>" +
                "</body>" +
                "</html>";

        String textContent = "Welcome to MathQuest!\n\n" +
                "Thank you for registering with MathQuest! We're excited to have you join our learning community.\n\n" +
                "To complete your registration and start your math adventure, please verify your email address by visiting this link:\n\n" +
                verificationLink + "\n\n" +
                "If you didn't create a MathQuest account, you can safely ignore this email.\n\n" +
                "Best regards,\n" +
                "The MathQuest Team\n\n" +
                "© 2024 MathQuest. All rights reserved.";

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
                                    .put(Emailv31.Message.SUBJECT, "Verify Your MathQuest Account")
                                    .put(Emailv31.Message.TEXTPART, textContent)
                                    .put(Emailv31.Message.HTMLPART, htmlContent)
                                    .put(Emailv31.Message.CUSTOMID, "EmailVerification")));

            MailjetResponse response = client.post(request);
            if (response.getStatus() != 200) {
                throw new RuntimeException("Failed to send email: " + response.getData());
            }
        } catch (MailjetException e) {
            throw new RuntimeException("Error sending verification email", e);
        }
    }

    public void sendPasswordResetEmail(String to, String token) {
        String subject = "Reset Your MathQuest Password";
        // Format the reset link to work with the frontend route
        String resetLink = baseUrl + "/#/reset-password?token=" + token;

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

        String htmlContent = "<!DOCTYPE html>" +
                "<html>" +
                "<head><meta charset='UTF-8'></head>" +
                "<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;'>" +
                "<div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>" +
                "<h1 style='color: white; margin: 0; font-size: 28px;'>Password Reset Request 🔐</h1>" +
                "</div>" +
                "<div style='background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;'>" +
                "<h2 style='color: #667eea; margin-top: 0;'>Reset Your Password</h2>" +
                "<p>We received a request to reset the password for your MathQuest account.</p>" +
                "<p>To create a new password, click the button below:</p>" +
                "<div style='text-align: center; margin: 30px 0;'>" +
                "<a href='" + resetLink + "' style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Reset Password</a>" +
                "</div>" +
                "<p style='color: #666; font-size: 14px;'>Or copy and paste this link into your browser:</p>" +
                "<p style='background: white; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;'>" + resetLink + "</p>" +
                "<div style='background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;'>" +
                "<p style='margin: 0; color: #856404; font-size: 14px;'><strong>Security Note:</strong> This link will expire soon for your security. If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>" +
                "</div>" +
                "<hr style='border: none; border-top: 1px solid #ddd; margin: 30px 0;'>" +
                "<p style='color: #999; font-size: 12px; text-align: center; margin-top: 30px;'>" +
                "© 2024 MathQuest. All rights reserved.<br>" +
                "This is an automated message, please do not reply to this email." +
                "</p>" +
                "</div>" +
                "</body>" +
                "</html>";

        String textContent = "Password Reset Request\n\n" +
                "We received a request to reset the password for your MathQuest account.\n\n" +
                "To create a new password, visit this link:\n\n" +
                resetLink + "\n\n" +
                "SECURITY NOTE: This link will expire soon for your security.\n\n" +
                "If you didn't request this password reset, please ignore this email and your password will remain unchanged.\n\n" +
                "Best regards,\n" +
                "The MathQuest Team\n\n" +
                "© 2024 MathQuest. All rights reserved.";

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
                                    .put(Emailv31.Message.TEXTPART, textContent)
                                    .put(Emailv31.Message.HTMLPART, htmlContent)
                                    .put(Emailv31.Message.CUSTOMID, "PasswordReset")));

            MailjetResponse response = client.post(request);
            if (response.getStatus() != 200) {
                throw new RuntimeException("Failed to send email: " + response.getData());
            }
        } catch (MailjetException e) {
            throw new RuntimeException("Error sending password reset email", e);
        }
    }

    public void sendEmailUpdateVerification(String to, String token) {
        String verificationLink = baseUrl + "/#/users/verify-email?token=" + token;
        String subject = "Verify Your MathQuest Email Update";

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

        String htmlContent = "<!DOCTYPE html>" +
                "<html>" +
                "<head><meta charset='UTF-8'></head>" +
                "<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;'>" +
                "<div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>" +
                "<h1 style='color: white; margin: 0; font-size: 28px;'>Email Update Verification ✉️</h1>" +
                "</div>" +
                "<div style='background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;'>" +
                "<h2 style='color: #667eea; margin-top: 0;'>Verify Your New Email Address</h2>" +
                "<p>We received a request to update the email address for your MathQuest account.</p>" +
                "<p>To confirm this change and verify your new email address, click the button below:</p>" +
                "<div style='text-align: center; margin: 30px 0;'>" +
                "<a href='" + verificationLink + "' style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Verify Email Address</a>" +
                "</div>" +
                "<p style='color: #666; font-size: 14px;'>Or copy and paste this link into your browser:</p>" +
                "<p style='background: white; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;'>" + verificationLink + "</p>" +
                "<div style='background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;'>" +
                "<p style='margin: 0; color: #856404; font-size: 14px;'><strong>Important:</strong> This verification link will expire in 24 hours. If you didn't request this email change, please contact us immediately.</p>" +
                "</div>" +
                "<hr style='border: none; border-top: 1px solid #ddd; margin: 30px 0;'>" +
                "<p style='color: #999; font-size: 12px; text-align: center; margin-top: 30px;'>" +
                "© 2024 MathQuest. All rights reserved.<br>" +
                "This is an automated message, please do not reply to this email." +
                "</p>" +
                "</div>" +
                "</body>" +
                "</html>";

        String textContent = "Email Update Verification\n\n" +
                "We received a request to update the email address for your MathQuest account.\n\n" +
                "To confirm this change and verify your new email address, visit this link:\n\n" +
                verificationLink + "\n\n" +
                "IMPORTANT: This verification link will expire in 24 hours.\n\n" +
                "If you didn't request this email change, please contact us immediately.\n\n" +
                "Best regards,\n" +
                "The MathQuest Team\n\n" +
                "© 2024 MathQuest. All rights reserved.";

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
                                    .put(Emailv31.Message.TEXTPART, textContent)
                                    .put(Emailv31.Message.HTMLPART, htmlContent)
                                    .put(Emailv31.Message.CUSTOMID, "EmailUpdate")));

            MailjetResponse response = client.post(request);
            if (response.getStatus() != 200) {
                throw new RuntimeException("Failed to send email: " + response.getData());
            }
        } catch (MailjetException e) {
            throw new RuntimeException("Error sending email update verification", e);
        }
    }

    public void sendEmail(String to, String subject, String content) {
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