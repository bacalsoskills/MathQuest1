package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.LeaderboardEntryDTO;
import com.mathquest.demo.Model.Classroom;
import com.mathquest.demo.Model.LeaderboardEntry;
import com.mathquest.demo.Model.Quiz;
import com.mathquest.demo.Model.QuizAttempt;
import com.mathquest.demo.Repository.LeaderboardEntryRepository;
import com.mathquest.demo.Repository.QuizRepository;
import jakarta.annotation.PostConstruct;
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
    private static final int MAX_TIME_MINUTES = 70;
    private static final int MAX_ATTEMPTS = 3;

    @Autowired
    private LeaderboardEntryRepository leaderboardEntryRepository;

    @Autowired
    private QuizRepository quizRepository;

    @PostConstruct
    public void initialize() {
        updateAllFinalScores();
    }

    /**
     * Update final scores for all existing leaderboard entries
     */
    @Transactional
    public void updateAllFinalScores() {
        logger.info("Updating final scores for all leaderboard entries");
        try {
            List<LeaderboardEntry> entries = leaderboardEntryRepository.findAll();
            for (LeaderboardEntry entry : entries) {
                if (entry.getTotalQuizzesCompleted() > 0) {
                    entry.setFinalScore((double) entry.getHighestScore() / entry.getTotalQuizzesCompleted());
                    leaderboardEntryRepository.save(entry);
                }
            }
            logger.info("Successfully updated final scores for {} entries", entries.size());
        } catch (Exception e) {
            logger.error("Failed to update final scores: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Calculate final score based on the new formula:
     * Final Score = Average Score + Time Bonus + Attempt Bonus
     * where:
     * - Time Bonus = MAX_TIME_MINUTES - time taken (in minutes)
     * - Attempt Bonus = MAX_ATTEMPTS - number of attempts
     * 
     * @param avgScore    Average score
     * @param timeMinutes Time taken in minutes
     * @param attempts    Number of attempts
     * @return Final score
     */
    private double calculateFinalScore(double avgScore, double timeMinutes, int attempts) {
        // Calculate time bonus (max time - actual time)
        double timeBonus = Math.max(0, MAX_TIME_MINUTES - timeMinutes);

        // Calculate attempt bonus (max attempts - actual attempts)
        double attemptBonus = Math.max(0, MAX_ATTEMPTS - attempts);

        // Calculate final score
        return avgScore + timeBonus + attemptBonus;
    }

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

                // Update highest score if new score is better
                if (attempt.getScore() > entry.getHighestScore()) {
                    entry.setHighestScore(attempt.getScore());
                    entry.setBestAttemptNumber(attempt.getAttemptNumber());
                }

                // Update fastest time if new time is better
                if (attempt.getTimeSpentSeconds() < entry.getFastestTimeSeconds()
                        || entry.getFastestTimeSeconds() == null) {
                    entry.setFastestTimeSeconds(attempt.getTimeSpentSeconds());
                }

                // Update attempts and total scores
                entry.setAttempts(entry.getAttempts() != null ? entry.getAttempts() + 1 : 1);
                entry.setTotalScores(entry.getTotalScores() != null ? entry.getTotalScores() + attempt.getScore()
                        : attempt.getScore());

                // Calculate final score as average of all attempts
                entry.setFinalScore((double) entry.getTotalScores() / entry.getAttempts());

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
                newEntry.setAttempts(1);
                newEntry.setTotalScores(attempt.getScore());
                newEntry.setFinalScore((double) attempt.getScore());
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

            // Sort entries based on: higher final score first, then faster time, then fewer
            // attempts
            Comparator<LeaderboardEntry> rankComparator = Comparator
                    .comparing(LeaderboardEntry::getFinalScore, Comparator.reverseOrder())
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
                    logger.debug("Updating rank for student {} from {} to {} (final score: {})",
                            entry.getStudent().getId(), entry.getRank(), rank, entry.getFinalScore());
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
     * Get leaderboard for a classroom (overall ranking)
     */
    public List<LeaderboardEntryDTO> getLeaderboardByClassroom(Long classroomId) {
        if (classroomId == null) {
            logger.error("getLeaderboardByClassroom called with null classroomId");
            throw new IllegalArgumentException("Classroom ID cannot be null");
        }

        logger.info("Getting overall leaderboard for classroom ID: {}", classroomId);

        try {
            List<Object[]> results = leaderboardEntryRepository
                    .findStudentPerformanceByClassroom(classroomId);

            if (results == null || results.isEmpty()) {
                logger.info("No leaderboard entries found for classroom ID: {}", classroomId);
                return new ArrayList<>();
            }

            logger.debug("Found {} leaderboard entries for classroom ID: {}", results.size(), classroomId);

            return results.stream()
                    .map(result -> {
                        try {
                            LeaderboardEntryDTO dto = new LeaderboardEntryDTO();
                            dto.setStudentId((Long) result[0]);
                            dto.setStudentName(result[1] + " " + result[2]); // firstName + lastName

                            // Get total score
                            double totalScore = ((Number) result[3]).doubleValue();
                            dto.setTotalScore(totalScore);

                            // Get total quizzes completed
                            int totalQuizzes = ((Number) result[4]).intValue();
                            dto.setTotalQuizzesCompleted(totalQuizzes);

                            // Get best time
                            Integer bestTime = result[5] != null ? ((Number) result[5]).intValue() : null;
                            dto.setFastestTimeSeconds(bestTime);

                            // Get attempts count
                            int attempts = ((Number) result[6]).intValue();
                            dto.setAttempts(attempts);

                            // Get average score percentage
                            double averageScore = ((Number) result[7]).doubleValue();
                            dto.setAverageScore(averageScore);

                            // Set final score as average score for ranking
                            dto.setFinalScore(averageScore);

                            return dto;
                        } catch (Exception e) {
                            logger.error("Error processing leaderboard entry: {}", e.getMessage(), e);
                            return null;
                        }
                    })
                    .filter(dto -> dto != null)
                    .sorted(Comparator.comparing(LeaderboardEntryDTO::getFinalScore).reversed())
                    .limit(10)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error retrieving classroom leaderboard: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve classroom leaderboard: " + e.getMessage(), e);
        }
    }

    /**
     * Get leaderboard for a specific quiz
     */
    public List<LeaderboardEntryDTO> getLeaderboardByQuiz(Long quizId) {
        logger.info("Getting leaderboard for quiz ID: {}", quizId);
        try {
            Quiz quiz = quizRepository.findById(quizId)
                    .orElseThrow(() -> new RuntimeException("Quiz not found"));

            List<Object[]> results = leaderboardEntryRepository
                    .findStudentPerformanceByQuiz(quizId);

            if (results == null || results.isEmpty()) {
                logger.info("No leaderboard entries found for quiz ID: {}", quizId);
                return new ArrayList<>();
            }

            logger.debug("Found {} leaderboard entries for quiz ID: {}", results.size(), quizId);

            return results.stream()
                    .map(result -> {
                        try {
                            LeaderboardEntryDTO dto = new LeaderboardEntryDTO();
                            dto.setStudentId((Long) result[0]);
                            dto.setStudentName(result[1] + " " + result[2]); // firstName + lastName

                            // Get total score
                            Integer totalScores = ((Number) result[3]).intValue();
                            dto.setTotalScores(totalScores);

                            // Get attempts count
                            Integer attempts = ((Number) result[4]).intValue();
                            dto.setAttempts(attempts);

                            // Get best time
                            Integer bestTime = result[5] != null ? ((Number) result[5]).intValue() : null;
                            dto.setFastestTimeSeconds(bestTime);

                            // Get final score directly from the database
                            Double finalScore = ((Number) result[6]).doubleValue();
                            dto.setFinalScore(finalScore);

                            return dto;
                        } catch (Exception e) {
                            logger.error("Error processing leaderboard entry: {}", e.getMessage(), e);
                            return null;
                        }
                    })
                    .filter(dto -> dto != null)
                    .sorted(Comparator.comparing(LeaderboardEntryDTO::getFinalScore).reversed())
                    .limit(10)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error retrieving quiz leaderboard: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve quiz leaderboard: " + e.getMessage(), e);
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
                    } else {
                        dto.setFormattedFastestTime("N/A");
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