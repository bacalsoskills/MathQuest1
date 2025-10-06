package com.mathquest.demo.Controller;

import com.mathquest.demo.Model.Announcement;
import com.mathquest.demo.Repository.AnnouncementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/announcements")
public class PublicAnnouncementController {
    private static final Logger logger = LoggerFactory.getLogger(PublicAnnouncementController.class);

    @Autowired
    private AnnouncementRepository announcementRepository;

    /**
     * Get active announcements for a specific user role (public endpoint)
     */
    @GetMapping("/active")
    public ResponseEntity<List<Announcement>> getActiveAnnouncements(@RequestParam String userRole) {
        try {
            logger.info("Fetching active announcements for role: {}", userRole);
            LocalDateTime now = LocalDateTime.now();

            List<Announcement> announcements = announcementRepository.findActiveAnnouncements(
                    now, userRole,
                    Announcement.AnnouncementVisibility.EVERYONE,
                    Announcement.AnnouncementVisibility.TEACHERS,
                    Announcement.AnnouncementVisibility.STUDENTS);

            logger.info("Found {} active announcements for role: {}", announcements.size(), userRole);
            return ResponseEntity.ok(announcements);
        } catch (Exception e) {
            logger.error("Error getting active announcements for role {}: {}", userRole, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all active announcements (public endpoint)
     */
    @GetMapping("/all")
    public ResponseEntity<List<Announcement>> getAllActiveAnnouncements() {
        try {
            logger.info("Fetching all active announcements");
            LocalDateTime now = LocalDateTime.now();
            
            List<Announcement> announcements = announcementRepository.findActiveAnnouncementsByTime(now);
            
            logger.info("Found {} active announcements", announcements.size());
            return ResponseEntity.ok(announcements);
        } catch (Exception e) {
            logger.error("Error getting all active announcements: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
