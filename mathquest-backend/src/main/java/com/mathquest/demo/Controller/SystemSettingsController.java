package com.mathquest.demo.Controller;

import com.mathquest.demo.Model.SystemSettings;
import com.mathquest.demo.Model.Announcement;
import com.mathquest.demo.Service.SystemSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/admin/settings")
public class SystemSettingsController {
    private static final Logger logger = LoggerFactory.getLogger(SystemSettingsController.class);

    @Autowired
    private SystemSettingsService systemSettingsService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getSettings() {
        try {
            SystemSettings settings = systemSettingsService.getSettings();
            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            logger.error("Error fetching settings", e);
            return ResponseEntity.internalServerError().body("Error fetching settings: " + e.getMessage());
        }
    }

    @GetMapping("/announcements/active")
    public ResponseEntity<?> getActiveAnnouncements(@RequestParam String userRole) {
        try {
            logger.info("\n=== Active Announcements Request ===");
            logger.info("1. Request Details:");
            logger.info("- User Role: {}", userRole);
            logger.info("- Current UTC Time: {}", LocalDateTime.now(ZoneOffset.UTC));
            logger.info("- Current System Time: {}", LocalDateTime.now(ZoneId.systemDefault()));

            // Get all announcements first for debugging
            List<Announcement> allAnnouncements = systemSettingsService.getAllAnnouncements();
            logger.info("\n2. All Active Announcements in Database:");
            logger.info("- Total count: {}", allAnnouncements.size());

            for (Announcement a : allAnnouncements) {
                logger.info("\nAnnouncement ID: {}", a.getId());
                logger.info("- Message: {}", a.getMessage());
                logger.info("- Visibility: {}", a.getVisibility());
                logger.info("- Is Active: {}", a.isActive());
                logger.info("- Start Date (UTC): {}", a.getStartDate());
                logger.info("- End Date (UTC): {}", a.getEndDate());
                logger.info("- Created By: {}", a.getCreatedBy());
            }

            // Get active announcements
            List<Announcement> activeAnnouncements = systemSettingsService.getActiveAnnouncements(userRole);
            logger.info("\n3. Filtered Active Announcements:");
            logger.info("- Count: {}", activeAnnouncements.size());

            for (Announcement a : activeAnnouncements) {
                logger.info("\nActive Announcement ID: {}", a.getId());
                logger.info("- Message: {}", a.getMessage());
                logger.info("- Visibility: {}", a.getVisibility());
                logger.info("- Is Active: {}", a.isActive());
                logger.info("- Start Date (UTC): {}", a.getStartDate());
                logger.info("- End Date (UTC): {}", a.getEndDate());
                logger.info("- Created By: {}", a.getCreatedBy());
            }

            return ResponseEntity.ok(activeAnnouncements);
        } catch (Exception e) {
            logger.error("Error in getActiveAnnouncements: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body("Error fetching active announcements: " + e.getMessage());
        }
    }

    // Debug endpoint to check if announcements exist
    @GetMapping("/announcements/debug")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> debugAnnouncements() {
        try {
            List<Announcement> allAnnouncements = systemSettingsService.getAllAnnouncements();
            return ResponseEntity.ok(allAnnouncements);
        } catch (Exception e) {
            logger.error("Error in debugAnnouncements: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body("Error fetching all announcements: " + e.getMessage());
        }
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateSettings(@RequestBody SystemSettings settings) {
        try {
            SystemSettings updatedSettings = systemSettingsService.updateSettings(settings);
            return ResponseEntity.ok(updatedSettings);
        } catch (Exception e) {
            logger.error("Error updating settings", e);
            return ResponseEntity.internalServerError().body("Error updating settings: " + e.getMessage());
        }
    }

    @PostMapping("/logo")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateLogo(@RequestParam("file") MultipartFile file) {
        try {
            SystemSettings settings = systemSettingsService.updateSystemLogo(file);
            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            logger.error("Error updating logo", e);
            return ResponseEntity.badRequest().body("Error updating logo: " + e.getMessage());
        }
    }

    @GetMapping("/logo")
    public ResponseEntity<?> getLogo() {
        try {
            byte[] logo = systemSettingsService.getSystemLogo();
            if (logo != null) {
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(logo);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error fetching logo", e);
            return ResponseEntity.internalServerError().body("Error fetching logo: " + e.getMessage());
        }
    }

    @PostMapping("/announcements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addAnnouncement(@RequestBody Announcement announcement) {
        try {
            Announcement savedAnnouncement = systemSettingsService.addAnnouncement(announcement);
            return ResponseEntity.ok(savedAnnouncement);
        } catch (Exception e) {
            logger.error("Error adding announcement", e);
            return ResponseEntity.internalServerError().body("Error adding announcement: " + e.getMessage());
        }
    }

    @PutMapping("/announcements/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateAnnouncement(
            @PathVariable Long id,
            @RequestBody Announcement announcement) {
        try {
            Announcement updatedAnnouncement = systemSettingsService.updateAnnouncement(id, announcement);
            return ResponseEntity.ok(updatedAnnouncement);
        } catch (Exception e) {
            logger.error("Error updating announcement", e);
            return ResponseEntity.internalServerError().body("Error updating announcement: " + e.getMessage());
        }
    }

    @DeleteMapping("/announcements/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable Long id) {
        try {
            systemSettingsService.deleteAnnouncement(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error deleting announcement", e);
            return ResponseEntity.internalServerError().body("Error deleting announcement: " + e.getMessage());
        }
    }

    // Debug endpoint to check announcement filtering
    @GetMapping("/announcements/filter-debug")
    public ResponseEntity<?> debugAnnouncementFiltering(@RequestParam String userRole) {
        try {
            // Get current time in Asia/Singapore
            ZoneId singaporeZone = ZoneId.of("Asia/Singapore");
            LocalDateTime now = LocalDateTime.now(singaporeZone);
            Map<String, Object> debugInfo = new HashMap<>();

            // 1. Basic Info
            debugInfo.put("currentTime", now.toString());
            debugInfo.put("userRole", userRole);
            debugInfo.put("timezone", "Asia/Singapore");

            // 2. Get all announcements
            List<Announcement> allAnnouncements = systemSettingsService.getAllAnnouncements();
            List<Map<String, Object>> announcementsInfo = new ArrayList<>();

            for (Announcement a : allAnnouncements) {
                Map<String, Object> announcementInfo = new HashMap<>();
                announcementInfo.put("id", a.getId());
                announcementInfo.put("message", a.getMessage());
                announcementInfo.put("visibility", a.getVisibility());
                announcementInfo.put("isActive", a.isActive());
                announcementInfo.put("startDate", a.getStartDate());
                announcementInfo.put("endDate", a.getEndDate());
                announcementInfo.put("createdBy", a.getCreatedBy());

                // Time validation with detailed comparison
                boolean isStartValid = a.getStartDate() == null || !now.isBefore(a.getStartDate());
                boolean isEndValid = a.getEndDate() == null || now.isBefore(a.getEndDate());
                boolean isTimeValid = isStartValid && isEndValid;

                // Add detailed time comparison info
                Map<String, Object> timeComparison = new HashMap<>();
                timeComparison.put("currentTime", now.toString());
                timeComparison.put("startTime", a.getStartDate() != null ? a.getStartDate().toString() : "null");
                timeComparison.put("endTime", a.getEndDate() != null ? a.getEndDate().toString() : "null");
                timeComparison.put("isCurrentAfterStart",
                        a.getStartDate() != null ? !now.isBefore(a.getStartDate()) : true);
                timeComparison.put("isCurrentBeforeEnd", a.getEndDate() != null ? now.isBefore(a.getEndDate()) : true);
                timeComparison.put("startTimeComparison",
                        a.getStartDate() != null ? now.compareTo(a.getStartDate()) : 0);
                timeComparison.put("endTimeComparison", a.getEndDate() != null ? now.compareTo(a.getEndDate()) : 0);
                announcementInfo.put("timeComparison", timeComparison);

                // Role validation
                boolean isRoleValid = a.getVisibility() == Announcement.AnnouncementVisibility.EVERYONE ||
                        (a.getVisibility() == Announcement.AnnouncementVisibility.TEACHERS
                                && userRole.equals("TEACHERS"))
                        ||
                        (a.getVisibility() == Announcement.AnnouncementVisibility.STUDENTS
                                && userRole.equals("STUDENTS"));

                announcementInfo.put("isStartValid", isStartValid);
                announcementInfo.put("isEndValid", isEndValid);
                announcementInfo.put("isTimeValid", isTimeValid);
                announcementInfo.put("isRoleValid", isRoleValid);
                announcementInfo.put("shouldBeVisible", isTimeValid && isRoleValid);

                announcementsInfo.add(announcementInfo);
            }

            debugInfo.put("allAnnouncements", announcementsInfo);

            // 3. Get filtered announcements
            List<Announcement> filteredAnnouncements = systemSettingsService.getActiveAnnouncements(userRole);
            debugInfo.put("filteredAnnouncementsCount", filteredAnnouncements.size());

            return ResponseEntity.ok(debugInfo);
        } catch (Exception e) {
            logger.error("Error in debugAnnouncementFiltering: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body("Error in debug endpoint: " + e.getMessage());
        }
    }
}