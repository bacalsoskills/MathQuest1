package com.mathquest.demo.Controller;

import com.mathquest.demo.Model.Announcement;
import com.mathquest.demo.Repository.AnnouncementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/admin/settings")
public class AnnouncementController {
    private static final Logger logger = LoggerFactory.getLogger(AnnouncementController.class);

    @Autowired
    private AnnouncementRepository announcementRepository;

    /**
     * Get all announcements (admin only)
     */
    @GetMapping("/announcements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Announcement>> getAllAnnouncements() {
        try {
            logger.info("Fetching all announcements");
            List<Announcement> announcements = announcementRepository.findByIsActiveTrue();
            return ResponseEntity.ok(announcements);
        } catch (Exception e) {
            logger.error("Error getting all announcements: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get active announcements for a specific user role
     */
    @GetMapping("/announcements/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Announcement>> getActiveAnnouncements(@RequestParam String userRole) {
        try {
            logger.info("Fetching active announcements for role: {}", userRole);
            LocalDateTime now = LocalDateTime.now();

            List<Announcement> announcements = announcementRepository.findActiveAnnouncements(
                    now, userRole,
                    Announcement.AnnouncementVisibility.EVERYONE,
                    Announcement.AnnouncementVisibility.TEACHERS,
                    Announcement.AnnouncementVisibility.STUDENTS);

            return ResponseEntity.ok(announcements);
        } catch (Exception e) {
            logger.error("Error getting active announcements for role {}: {}", userRole, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Add a new announcement
     */
    @PostMapping("/announcements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Announcement> addAnnouncement(@RequestBody Announcement announcement) {
        try {
            logger.info("Adding new announcement: {}", announcement.getMessage());
            announcement.setCreatedAt(LocalDateTime.now());
            announcement.setActive(true);

            Announcement savedAnnouncement = announcementRepository.save(announcement);
            return ResponseEntity.ok(savedAnnouncement);
        } catch (Exception e) {
            logger.error("Error adding announcement: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Update an existing announcement
     */
    @PutMapping("/announcements/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Announcement> updateAnnouncement(@PathVariable Long id,
            @RequestBody Announcement announcement) {
        try {
            logger.info("Updating announcement with id: {}", id);

            Announcement existingAnnouncement = announcementRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Announcement not found"));

            if (announcement.getMessage() != null) {
                existingAnnouncement.setMessage(announcement.getMessage());
            }
            if (announcement.getStartDate() != null) {
                existingAnnouncement.setStartDate(announcement.getStartDate());
            }
            if (announcement.getEndDate() != null) {
                existingAnnouncement.setEndDate(announcement.getEndDate());
            }
            if (announcement.getVisibility() != null) {
                existingAnnouncement.setVisibility(announcement.getVisibility());
            }
            existingAnnouncement.setActive(announcement.isActive());

            Announcement updatedAnnouncement = announcementRepository.save(existingAnnouncement);
            return ResponseEntity.ok(updatedAnnouncement);
        } catch (Exception e) {
            logger.error("Error updating announcement: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Delete an announcement
     */
    @DeleteMapping("/announcements/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteAnnouncement(@PathVariable Long id) {
        try {
            logger.info("Deleting announcement with id: {}", id);

            Announcement announcement = announcementRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Announcement not found"));

            announcement.setActive(false);
            announcementRepository.save(announcement);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Announcement deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error deleting announcement: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get system settings (simplified version without system_settings table)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getSettings() {
        try {
            logger.info("Fetching system settings");

            // Return default settings since we no longer have a system_settings table
            Map<String, Object> settings = new HashMap<>();
            settings.put("defaultLanguage", "en");
            settings.put("timezone", "UTC");
            settings.put("themeMode", "neutral");
            settings.put("systemName", "MathQuest");
            settings.put("darkModeEnabled", false);

            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            logger.error("Error getting settings: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Update system settings (simplified version)
     */
    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updateSettings(@RequestBody Map<String, Object> settings) {
        try {
            logger.info("Updating system settings");

            // Since we don't have a system_settings table, just return the settings as-is
            // In a real application, you might want to store these in a different way
            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            logger.error("Error updating settings: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Update system logo (simplified version - returns success but doesn't store)
     */
    @PostMapping("/logo")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> updateSystemLogo(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            logger.info("Updating system logo");

            // Since we don't have a system_settings table, just return success
            // In a real application, you might want to store the logo in a different way
            Map<String, String> response = new HashMap<>();
            response.put("message", "Logo updated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error updating system logo: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get system logo (simplified version - returns 404 since no logo is stored)
     */
    @GetMapping("/logo")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> getSystemLogo() {
        try {
            logger.info("Getting system logo");

            // Since we don't have a system_settings table, return 404
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting system logo: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}