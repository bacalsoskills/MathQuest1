package com.mathquest.demo.Service;

import com.mathquest.demo.Model.SystemSettings;
import com.mathquest.demo.Model.Announcement;
import com.mathquest.demo.Model.Announcement.AnnouncementVisibility;
import com.mathquest.demo.Repository.SystemSettingsRepository;
import com.mathquest.demo.Repository.AnnouncementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SystemSettingsService {
    private static final Logger logger = LoggerFactory.getLogger(SystemSettingsService.class);

    @Autowired
    private SystemSettingsRepository systemSettingsRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    public SystemSettings getSettings() {
        try {
            Optional<SystemSettings> settings = systemSettingsRepository.findFirstByOrderByIdAsc();
            if (settings.isPresent()) {
                return settings.get();
            } else {
                // Create default settings if none exist
                SystemSettings defaultSettings = new SystemSettings();
                defaultSettings.setDefaultLanguage("en");
                defaultSettings.setTimezone("UTC");
                defaultSettings.setThemeMode("neutral");
                return systemSettingsRepository.save(defaultSettings);
            }
        } catch (Exception e) {
            logger.error("Error getting settings", e);
            throw new RuntimeException("Failed to get settings", e);
        }
    }

    public List<Announcement> getActiveAnnouncements(String userRole) {
        try {
            logger.info("Fetching active announcements for user role: {}", userRole);
            if (announcementRepository == null) {
                logger.error("AnnouncementRepository is null");
                throw new RuntimeException("AnnouncementRepository not initialized");
            }

            // Get current time in Asia/Singapore
            ZoneId singaporeZone = ZoneId.of("Asia/Singapore");
            LocalDateTime now = LocalDateTime.now(singaporeZone);
            logger.info("Current Singapore time for announcement filtering: {}", now);
            logger.info("Current system default time: {}", LocalDateTime.now(ZoneId.systemDefault()));

            // Map frontend role to database role
            String mappedRole;
            switch (userRole) {
                case "ADMIN":
                    mappedRole = "ROLE_ADMIN";
                    break;
                case "TEACHERS":
                    mappedRole = "ROLE_TEACHER";
                    break;
                case "STUDENTS":
                    mappedRole = "ROLE_STUDENT";
                    break;
                default:
                    mappedRole = userRole;
            }
            logger.info("Mapped role from {} to {}", userRole, mappedRole);

            // Get all active announcements first for debugging
            List<Announcement> allActive = announcementRepository.findByIsActiveTrue();
            logger.info("Total active announcements: {}", allActive.size());

            for (Announcement a : allActive) {
                logger.info("Active announcement details - ID: {}, Message: {}, Visibility: {}, IsActive: {}",
                        a.getId(), a.getMessage(), a.getVisibility(), a.isActive());
                logger.info("Time comparison for announcement {}:", a.getId());
                logger.info("- Start date (Singapore): {}", a.getStartDate());
                logger.info("- End date (Singapore): {}", a.getEndDate());
                logger.info("- Current time (Singapore): {}", now);

                boolean isStartValid = a.getStartDate() == null || !now.isBefore(a.getStartDate());
                boolean isEndValid = a.getEndDate() == null || now.isBefore(a.getEndDate());
                logger.info("- Is start valid: {}", isStartValid);
                logger.info("- Is end valid: {}", isEndValid);
                logger.info("- Is active by time: {}", isStartValid && isEndValid);
                logger.info("- Is visible to role: {}",
                        a.getVisibility() == AnnouncementVisibility.EVERYONE ||
                                (a.getVisibility() == AnnouncementVisibility.TEACHERS
                                        && mappedRole.equals("ROLE_TEACHER"))
                                ||
                                (a.getVisibility() == AnnouncementVisibility.STUDENTS
                                        && mappedRole.equals("ROLE_STUDENT")));
            }

            // Get final active announcements
            List<Announcement> announcements = announcementRepository.findActiveAnnouncements(
                    now,
                    mappedRole,
                    AnnouncementVisibility.EVERYONE,
                    AnnouncementVisibility.TEACHERS,
                    AnnouncementVisibility.STUDENTS);
            logger.info("Found {} active announcements after all filtering", announcements.size());

            return announcements;
        } catch (Exception e) {
            logger.error("Error getting active announcements for role {}: {}", userRole, e.getMessage(), e);
            throw new RuntimeException("Failed to get active announcements: " + e.getMessage(), e);
        }
    }

    @Transactional
    public SystemSettings updateSettings(SystemSettings settings) {
        try {
            SystemSettings existingSettings = getSettings();
            if (settings.getDefaultLanguage() != null) {
                existingSettings.setDefaultLanguage(settings.getDefaultLanguage());
            }
            if (settings.getTimezone() != null) {
                existingSettings.setTimezone(settings.getTimezone());
            }
            if (settings.getThemeMode() != null) {
                existingSettings.setThemeMode(settings.getThemeMode());
            }
            return systemSettingsRepository.save(existingSettings);
        } catch (Exception e) {
            logger.error("Error updating settings", e);
            throw new RuntimeException("Failed to update settings", e);
        }
    }

    @Transactional
    public Announcement addAnnouncement(Announcement announcement) {
        try {
            logger.info("Adding announcement with visibility: {}", announcement.getVisibility());
            logger.info("Received announcement dates - Raw values:");
            logger.info("Start Date: {}", announcement.getStartDate());
            logger.info("End Date: {}", announcement.getEndDate());

            if (announcement.getVisibility() == null) {
                announcement.setVisibility(AnnouncementVisibility.EVERYONE);
            }
            if (announcement.getCreatedAt() == null) {
                announcement.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
            }

            // Store dates as-is since they are already in UTC from frontend
            if (announcement.getStartDate() != null) {
                // The incoming date is already in UTC, store it as is
                LocalDateTime startDate = announcement.getStartDate();
                announcement.setStartDate(startDate);
                logger.info("Start date (UTC): {}", startDate);
            }
            if (announcement.getEndDate() != null) {
                // The incoming date is already in UTC, store it as is
                LocalDateTime endDate = announcement.getEndDate();
                announcement.setEndDate(endDate);
                logger.info("End date (UTC): {}", endDate);
            }

            // Ensure visibility is set correctly
            if (announcement.getVisibility() == null) {
                announcement.setVisibility(AnnouncementVisibility.EVERYONE);
            }
            logger.info("Final announcement details:");
            logger.info("- Visibility: {}", announcement.getVisibility());
            logger.info("- Start Date: {}", announcement.getStartDate());
            logger.info("- End Date: {}", announcement.getEndDate());
            logger.info("- Created At: {}", announcement.getCreatedAt());

            announcement = announcementRepository.save(announcement);
            SystemSettings settings = getSettings();
            settings.getAnnouncements().add(announcement);
            systemSettingsRepository.save(settings);
            return announcement;
        } catch (Exception e) {
            logger.error("Error adding announcement", e);
            throw new RuntimeException("Failed to add announcement", e);
        }
    }

    @Transactional
    public Announcement updateAnnouncement(Long id, Announcement announcement) {
        try {
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

            return announcementRepository.save(existingAnnouncement);
        } catch (Exception e) {
            logger.error("Error updating announcement", e);
            throw new RuntimeException("Failed to update announcement", e);
        }
    }

    @Transactional
    public void deleteAnnouncement(Long id) {
        try {
            SystemSettings settings = getSettings();
            settings.getAnnouncements().removeIf(a -> a.getId().equals(id));
            systemSettingsRepository.save(settings);
            announcementRepository.deleteById(id);
        } catch (Exception e) {
            logger.error("Error deleting announcement", e);
            throw new RuntimeException("Failed to delete announcement", e);
        }
    }

    @Transactional
    public SystemSettings updateSystemLogo(MultipartFile file) throws IOException {
        try {
            SystemSettings currentSettings = getSettings();
            if (file != null && !file.isEmpty()) {
                currentSettings.setSystemLogo(file.getBytes());
                currentSettings.setSystemLogoName(file.getOriginalFilename());
            }
            return systemSettingsRepository.save(currentSettings);
        } catch (Exception e) {
            logger.error("Error updating system logo", e);
            throw new RuntimeException("Failed to update system logo", e);
        }
    }

    public byte[] getSystemLogo() {
        try {
            SystemSettings settings = getSettings();
            return settings != null ? settings.getSystemLogo() : null;
        } catch (Exception e) {
            logger.error("Error getting system logo", e);
            throw new RuntimeException("Failed to get system logo", e);
        }
    }

    public List<Announcement> getAllAnnouncements() {
        try {
            logger.info("Fetching all active announcements");
            return announcementRepository.findByIsActiveTrue();
        } catch (Exception e) {
            logger.error("Error getting all announcements: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get all announcements: " + e.getMessage(), e);
        }
    }
}