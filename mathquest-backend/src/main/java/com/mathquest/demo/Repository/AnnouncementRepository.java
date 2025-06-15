package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.Announcement;
import com.mathquest.demo.Model.Announcement.AnnouncementVisibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    @Query("SELECT a FROM Announcement a WHERE " +
            "a.isActive = true AND " +
            "(a.startDate IS NULL OR :now >= a.startDate) AND " +
            "(a.endDate IS NULL OR :now < a.endDate) AND " +
            "((:userRole = 'ROLE_ADMIN' AND a.visibility != 'EVERYONE') OR " + // Admin sees non-EVERYONE announcements
            "(:userRole != 'ROLE_ADMIN' AND " +
            "(a.visibility = :everyone OR " +
            "(a.visibility = :teachers AND :userRole = 'ROLE_TEACHER') OR " +
            "(a.visibility = :students AND :userRole = 'ROLE_STUDENT')))) " +
            "ORDER BY a.startDate ASC")
    List<Announcement> findActiveAnnouncements(
            @Param("now") LocalDateTime now,
            @Param("userRole") String userRole,
            @Param("everyone") AnnouncementVisibility everyone,
            @Param("teachers") AnnouncementVisibility teachers,
            @Param("students") AnnouncementVisibility students);

    @Query("SELECT a FROM Announcement a WHERE a.isActive = true " +
            "AND (a.visibility = :everyone OR " +
            "(a.visibility = :teachers AND :userRole = 'ROLE_TEACHER') OR " +
            "(a.visibility = :students AND :userRole = 'ROLE_STUDENT')) " +
            "ORDER BY a.startDate DESC")
    List<Announcement> findVisibleAnnouncements(
            @Param("userRole") String userRole,
            @Param("everyone") AnnouncementVisibility everyone,
            @Param("teachers") AnnouncementVisibility teachers,
            @Param("students") AnnouncementVisibility students);

    @Query("SELECT a FROM Announcement a WHERE a.isActive = true " +
            "AND (a.startDate IS NULL OR a.startDate <= :now) " +
            "AND (a.endDate IS NULL OR a.endDate > :now) " +
            "ORDER BY a.startDate DESC")
    List<Announcement> findActiveAnnouncementsByTime(@Param("now") LocalDateTime now);

    // Add a method to get all announcements for debugging
    @Query("SELECT a FROM Announcement a WHERE a.isActive = true")
    List<Announcement> findAllActive();

    // Add a method to get announcements by visibility
    @Query("SELECT a FROM Announcement a WHERE a.isActive = true AND a.visibility = :visibility")
    List<Announcement> findByVisibility(@Param("visibility") AnnouncementVisibility visibility);

    // Basic method for debugging
    List<Announcement> findByIsActiveTrue();
}