package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.LeaderboardEntryDTO;
import com.mathquest.demo.Model.Classroom;
import com.mathquest.demo.Model.LeaderboardEntry;
import com.mathquest.demo.Model.Quiz;
import com.mathquest.demo.Model.QuizAttempt;
import com.mathquest.demo.Repository.LeaderboardEntryRepository;
import com.mathquest.demo.Repository.QuizRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class LeaderboardService {

    private static final Logger logger = LoggerFactory.getLogger(LeaderboardService.class);

    @Autowired
    private LeaderboardEntryRepository leaderboardEntryRepository;

    @Autowired
    private QuizRepository quizRepository;

    /**
     * Update leaderboard based on a quiz attempt
     * 
     * @param attempt The quiz attempt
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateLeaderboard(QuizAttempt attempt) {
        logger.info("[LEADERBOARD] updateLeaderboard called for attemptId={}, studentId={}, quizId={}",
                attempt.getId(),
                attempt.getStudent() != null ? attempt.getStudent().getId() : null,
                attempt.getQuiz() != null ? attempt.getQuiz().getId() : null);

        // Null checks for relationships
        if (attempt.getQuiz() == null) {
            logger.error("[LEADERBOARD] Quiz is null for attemptId={}", attempt.getId());
            return;
        }
        if (attempt.getQuiz().getActivity() == null) {
            logger.error("[LEADERBOARD] Activity is null for quizId={}", attempt.getQuiz().getId());
            return;
        }
        if (attempt.getQuiz().getActivity().getClassroom() == null) {
            logger.error("[LEADERBOARD] Classroom is null for activityId={}", attempt.getQuiz().getActivity().getId());
            return;
        }
        if (attempt.getStudent() == null) {
            logger.error("[LEADERBOARD] Student is null for attemptId={}", attempt.getId());
            return;
        }

        try {
            // Find existing entry or create new one
            Optional<LeaderboardEntry> existingEntry = leaderboardEntryRepository.findByStudentAndQuiz(
                    attempt.getStudent(), attempt.getQuiz());

            if (existingEntry.isPresent()) {
                LeaderboardEntry entry = existingEntry.get();
                logger.info("[LEADERBOARD] Found existing entry id={} for studentId={}, quizId={}",
                        entry.getId(), entry.getStudent().getId(), entry.getQuiz().getId());
                entry.updateScore(attempt.getScore(), attempt.getTimeSpentSeconds(), attempt.getAttemptNumber());
                leaderboardEntryRepository.save(entry);
                logger.info("[LEADERBOARD] Updated leaderboard entry id={}", entry.getId());
            } else {
                logger.info("[LEADERBOARD] Creating new leaderboard entry for studentId={}, quizId={}, classroomId={}",
                        attempt.getStudent().getId(),
                        attempt.getQuiz().getId(),
                        attempt.getQuiz().getActivity().getClassroom().getId());
                LeaderboardEntry newEntry = new LeaderboardEntry(
                        attempt.getStudent(),
                        attempt.getQuiz(),
                        attempt.getQuiz().getActivity().getClassroom(),
                        attempt.getScore(),
                        attempt.getTimeSpentSeconds(),
                        attempt.getAttemptNumber(),
                        999 // Temporary rank
                );
                LeaderboardEntry savedEntry = leaderboardEntryRepository.save(newEntry);
                logger.info("[LEADERBOARD] Created new leaderboard entry with id={}", savedEntry.getId());
            }

            // Update rankings for this quiz
            updateRankings(attempt.getQuiz().getId());
        } catch (Exception e) {
            logger.error("[LEADERBOARD] Exception in updateLeaderboard: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Update rankings for a quiz
     * 
     * @param quizId The quiz ID
     */
    @Transactional
    public void updateRankings(Long quizId) {
        logger.info("Updating rankings for quiz ID: {}", quizId);
        try {
            // Get quiz entity
            Quiz quiz = quizRepository.findById(quizId)
                    .orElseThrow(() -> new RuntimeException("Quiz not found"));

            // Get all entries for this quiz
            List<LeaderboardEntry> entries = leaderboardEntryRepository.findByQuiz(quiz);
            logger.info("Found {} leaderboard entries to rank", entries.size());

            // Sort entries based on: higher score first, then faster time, then fewer
            // attempts
            Comparator<LeaderboardEntry> rankComparator = Comparator
                    .comparing(LeaderboardEntry::getHighestScore, Comparator.reverseOrder())
                    .thenComparing(LeaderboardEntry::getFastestTimeSeconds,
                            Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(LeaderboardEntry::getBestAttemptNumber,
                            Comparator.nullsLast(Comparator.naturalOrder()));

            List<LeaderboardEntry> sortedEntries = entries.stream()
                    .sorted(rankComparator)
                    .collect(Collectors.toList());

            // Update ranks
            int rank = 1;
            for (LeaderboardEntry entry : sortedEntries) {
                // Only log if rank changed
                if (entry.getRank() == null || !entry.getRank().equals(rank)) {
                    logger.debug("Updating rank for student {} from {} to {} (score: {})",
                            entry.getStudent().getId(), entry.getRank(), rank, entry.getHighestScore());
                }
                entry.setRank(rank++);
                leaderboardEntryRepository.save(entry);
            }
            logger.info("Rankings updated successfully for quiz ID: {}", quizId);
        } catch (Exception e) {
            logger.error("Failed to update rankings for quiz ID {}: {}", quizId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Get leaderboard for a quiz
     * 
     * @param quizId The quiz ID
     * @return List of leaderboard entries
     */
    public List<LeaderboardEntryDTO> getLeaderboardByQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        List<LeaderboardEntry> entries = leaderboardEntryRepository.findByQuizOrderByRankAsc(quiz);

        return entries.stream()
                .limit(10)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get leaderboard for a classroom
     * 
     * @param classroomId The classroom ID
     * @return List of leaderboard entries
     */
    public List<LeaderboardEntryDTO> getLeaderboardByClassroom(Long classroomId) {
        // Validate classroomId is not null
        if (classroomId == null) {
            logger.error("getLeaderboardByClassroom called with null classroomId");
            throw new IllegalArgumentException("Classroom ID cannot be null");
        }

        logger.info("Getting leaderboard for classroom ID: {}", classroomId);

        try {
            List<Object[]> results = leaderboardEntryRepository
                    .findTop10StudentsByTotalScoreInClassroom(classroomId);

            logger.info("Found {} entries for classroom leaderboard", results.size());

            return results.stream()
                    .limit(10)
                    .map(result -> {
                        LeaderboardEntryDTO dto = new LeaderboardEntryDTO();
                        dto.setStudentId((Long) result[0]);
                        dto.setStudentName(result[1] + " " + result[2]); // firstName + lastName
                        dto.setHighestScore(((Number) result[3]).intValue()); // totalScore

                        // Handle null fastestTimeSeconds
                        Integer bestTime = result[4] != null ? ((Number) result[4]).intValue() : null;
                        dto.setFastestTimeSeconds(bestTime);

                        // Format time if available
                        if (bestTime != null) {
                            int minutes = bestTime / 60;
                            int seconds = bestTime % 60;
                            dto.setFormattedFastestTime(minutes + "m " + seconds + "s");
                        }

                        dto.setTotalQuizzesCompleted(((Number) result[5]).intValue()); // totalQuizzes
                        return dto;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error retrieving classroom leaderboard: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Get top 10 students by quiz participation in a classroom
     * 
     * @param classroomId The classroom ID
     * @return List of leaderboard entries
     */
    public List<LeaderboardEntryDTO> getTopStudentsByParticipation(Long classroomId) {
        List<Object[]> results = leaderboardEntryRepository
                .findTop10StudentsByQuizParticipation(classroomId);

        return results.stream()
                .limit(10)
                .map(result -> {
                    LeaderboardEntryDTO dto = new LeaderboardEntryDTO();
                    dto.setStudentId((Long) result[0]);
                    dto.setStudentName(result[1] + " " + result[2]); // firstName + lastName
                    dto.setHighestScore(((Number) result[3]).intValue()); // totalScore

                    // Handle null fastestTimeSeconds
                    Integer bestTime = result[4] != null ? ((Number) result[4]).intValue() : null;
                    dto.setFastestTimeSeconds(bestTime);

                    // Format time if available
                    if (bestTime != null) {
                        int minutes = bestTime / 60;
                        int seconds = bestTime % 60;
                        dto.setFormattedFastestTime(minutes + "m " + seconds + "s");
                    }

                    dto.setTotalQuizzesCompleted(((Number) result[5]).intValue()); // totalQuizzes
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /**
     * Convert a LeaderboardEntry entity to a LeaderboardEntryDTO
     * 
     * @param entry The leaderboard entry entity
     * @return The leaderboard entry DTO
     */
    private LeaderboardEntryDTO convertToDTO(LeaderboardEntry entry) {
        LeaderboardEntryDTO dto = new LeaderboardEntryDTO();
        dto.setId(entry.getId());
        dto.setStudentId(entry.getStudent().getId());
        dto.setStudentName(entry.getStudent().getFirstName() + " " + entry.getStudent().getLastName());
        dto.setStudentUsername(entry.getStudent().getUsername());
        dto.setQuizId(entry.getQuiz().getId());
        dto.setQuizName(entry.getQuiz().getQuizName());
        dto.setHighestScore(entry.getHighestScore());
        dto.setFastestTimeSeconds(entry.getFastestTimeSeconds());
        dto.setBestAttemptNumber(entry.getBestAttemptNumber());
        dto.setTotalQuizzesCompleted(entry.getTotalQuizzesCompleted());
        dto.setRank(entry.getRank());

        // Format fastest time (e.g., "5m 30s")
        if (entry.getFastestTimeSeconds() != null) {
            int minutes = entry.getFastestTimeSeconds() / 60;
            int seconds = entry.getFastestTimeSeconds() % 60;
            dto.setFormattedFastestTime(minutes + "m " + seconds + "s");
        }

        return dto;
    }
}