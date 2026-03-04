package com.smarthome.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendPasswordResetCode(String toEmail, String firstName, String resetCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "SmartHome Energy System");
            helper.setTo(toEmail);
            helper.setSubject("🔐 Password Reset Code - SmartHome Energy");

            String htmlContent = buildResetEmailHtml(firstName, resetCode);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Password reset code sent to: {}", toEmail);

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send email. Please try again later.");
        }
    }

    @Async
    public void sendWelcomeEmail(String toEmail, String firstName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "SmartHome Energy System");
            helper.setTo(toEmail);
            helper.setSubject("🏠 Welcome to SmartHome Energy Management!");

            String htmlContent = buildWelcomeEmailHtml(firstName);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Welcome email sent to: {}", toEmail);

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send welcome email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendEmailVerificationCode(String toEmail, String firstName, String verificationCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "SmartHome Energy System");
            helper.setTo(toEmail);
            helper.setSubject("Verify Your Email - SmartHome Energy");

            String htmlContent = buildEmailVerificationHtml(firstName, verificationCode);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email verification code sent to: {}", toEmail);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send verification email. Please try again later.");
        }
    }

    private String buildResetEmailHtml(String firstName, String resetCode) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Password Reset</title>
            </head>
            <body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background-color:#070b14;">
              <div style="max-width:560px;margin:40px auto;background:#0d1117;border-radius:20px;overflow:hidden;border:1px solid rgba(79,195,247,0.15);">
                
                <!-- Header -->
                <div style="background:linear-gradient(135deg,#0a1628,#0d1f3c);padding:40px 40px 30px;text-align:center;">
                  <div style="font-size:36px;margin-bottom:12px;">⚡</div>
                  <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;letter-spacing:-0.3px;">SmartHome Energy</h1>
                  <p style="color:rgba(79,195,247,0.7);font-size:12px;margin:4px 0 0;letter-spacing:1px;text-transform:uppercase;">Management System</p>
                </div>
                
                <!-- Body -->
                <div style="padding:36px 40px;">
                  <p style="color:rgba(255,255,255,0.85);font-size:16px;margin:0 0 8px;">Hello, <strong style="color:#4fc3f7;">%s</strong>!</p>
                  <p style="color:rgba(255,255,255,0.55);font-size:14px;line-height:1.6;margin:0 0 28px;">
                    We received a request to reset your password. Use the code below to complete the process. 
                    This code will expire in <strong style="color:#fbbf24;">10 minutes</strong>.
                  </p>
                  
                  <!-- Code box -->
                  <div style="background:rgba(79,195,247,0.08);border:2px solid rgba(79,195,247,0.25);border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
                    <p style="color:rgba(255,255,255,0.4);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Your Reset Code</p>
                    <div style="font-size:42px;font-weight:700;letter-spacing:12px;color:#4fc3f7;font-family:'Courier New',monospace;">%s</div>
                    <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:12px 0 0;">Enter this code on the password reset page</p>
                  </div>
                  
                  <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:14px 16px;margin-bottom:24px;">
                    <p style="color:#f87171;font-size:13px;margin:0;">
                      ⚠️ If you didn't request a password reset, please ignore this email or contact support immediately.
                    </p>
                  </div>
                  
                  <p style="color:rgba(255,255,255,0.35);font-size:12px;line-height:1.6;">
                    For security reasons, this code can only be used once and expires in 10 minutes.
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background:rgba(0,0,0,0.2);padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
                  <p style="color:rgba(255,255,255,0.25);font-size:11px;margin:0;">
                    © 2024 SmartHome Energy Management System. All rights reserved.
                  </p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(firstName, resetCode);
    }

    private String buildWelcomeEmailHtml(String firstName) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Welcome</title>
            </head>
            <body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background-color:#070b14;">
              <div style="max-width:560px;margin:40px auto;background:#0d1117;border-radius:20px;overflow:hidden;border:1px solid rgba(79,195,247,0.15);">
                
                <div style="background:linear-gradient(135deg,#0a1628,#0d1f3c);padding:40px;text-align:center;">
                  <div style="font-size:48px;margin-bottom:12px;">🏠</div>
                  <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0;">Welcome to SmartHome!</h1>
                  <p style="color:rgba(79,195,247,0.7);font-size:12px;margin:4px 0 0;letter-spacing:1px;text-transform:uppercase;">Energy Management System</p>
                </div>
                
                <div style="padding:36px 40px;text-align:center;">
                  <p style="color:rgba(255,255,255,0.85);font-size:18px;margin:0 0 12px;">Hi, <strong style="color:#4fc3f7;">%s</strong>! 👋</p>
                  <p style="color:rgba(255,255,255,0.55);font-size:14px;line-height:1.7;margin:0 0 28px;">
                    Your account has been created successfully. You're now part of the SmartHome community — saving energy, reducing costs, and living smarter.
                  </p>
                  
                  <div style="display:inline-flex;gap:12px;margin-bottom:28px;flex-direction:column;width:100%%;">
                    <div style="background:rgba(79,195,247,0.08);border:1px solid rgba(79,195,247,0.15);border-radius:12px;padding:16px;text-align:left;">
                      <p style="color:#4fc3f7;font-size:13px;font-weight:600;margin:0 0 4px;">⚡ Start Monitoring</p>
                      <p style="color:rgba(255,255,255,0.45);font-size:12px;margin:0;">Connect your devices and track energy usage in real-time</p>
                    </div>
                    <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.15);border-radius:12px;padding:16px;text-align:left;">
                      <p style="color:#22c55e;font-size:13px;font-weight:600;margin:0 0 4px;">💰 Save Money</p>
                      <p style="color:rgba(255,255,255,0.45);font-size:12px;margin:0;">Our AI optimizes usage patterns to reduce your energy bill</p>
                    </div>
                  </div>
                </div>
                
                <div style="background:rgba(0,0,0,0.2);padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
                  <p style="color:rgba(255,255,255,0.25);font-size:11px;margin:0;">© 2024 SmartHome Energy Management System</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(firstName);
    }

    private String buildEmailVerificationHtml(String firstName, String verificationCode) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Email Verification</title>
            </head>
            <body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background-color:#070b14;">
              <div style="max-width:560px;margin:40px auto;background:#0d1117;border-radius:20px;overflow:hidden;border:1px solid rgba(79,195,247,0.15);">
                <div style="background:linear-gradient(135deg,#0a1628,#0d1f3c);padding:40px;text-align:center;">
                  <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">Verify Your Email</h1>
                  <p style="color:rgba(79,195,247,0.7);font-size:12px;margin:6px 0 0;">SmartHome Energy Management</p>
                </div>
                <div style="padding:36px 40px;">
                  <p style="color:rgba(255,255,255,0.85);font-size:16px;margin:0 0 8px;">Hi, <strong style="color:#4fc3f7;">%s</strong></p>
                  <p style="color:rgba(255,255,255,0.55);font-size:14px;line-height:1.6;margin:0 0 24px;">
                    Use this 6-digit code to verify your email address and activate login access.
                  </p>
                  <div style="background:rgba(79,195,247,0.08);border:2px solid rgba(79,195,247,0.25);border-radius:16px;padding:24px;text-align:center;">
                    <p style="color:rgba(255,255,255,0.4);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">Verification Code</p>
                    <div style="font-size:42px;font-weight:700;letter-spacing:12px;color:#4fc3f7;font-family:'Courier New',monospace;">%s</div>
                  </div>
                  <p style="color:rgba(255,255,255,0.35);font-size:12px;margin:16px 0 0;">
                    This code expires in 10 minutes.
                  </p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(firstName, verificationCode);
    }
}
