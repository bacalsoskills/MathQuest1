package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.Classroom;
import com.mathquest.demo.Model.LeaderboardEntry;
import com.mathquest.demo.Model.Quiz;
import com.mathquest.demo.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaderboardEntryRepository extends JpaRepository<LeaderboardEntry, Long> {
    Optional<LeaderboardEntry> findByStudentAndQuiz(User student, Quiz quiz);

    List<LeaderboardEntry> findByQuiz(Quiz quiz);

    List<LeaderboardEntry> findTop10ByQuizOrderByHighestScoreDescFastestTimeSecondsAsc(Quiz quiz);

    List<LeaderboardEntry> findByClassroomOrderByHighestScoreDesc(Classroom classroom);

    @Query("""
            SELECT
                u.id as studentId,
                u.firstName,
                u.lastName,
                COALESCE(SUM(l.highestScore), 0) as totalScore,
                COUNT(DISTINCT l.quiz) as totalQuizzes,
                MIN(l.fastestTimeSeconds) as bestTime,
                COUNT(l) as attempts,
                COALESCE(SUM(l.highestScore) * 100.0 / (
                    SELECT COALESCE(SUM(q.passingScore), 0)
                    FROM Quiz q
                    WHERE q.activity.classroom.id = :classroomId
                ), 0) as averageScore
            FROM LeaderboardEntry l
            JOIN l.student u
            WHERE l.classroom.id = :classroomId
            GROUP BY u.id, u.firstName, u.lastName
            ORDER BY averageScore DESC, bestTime ASC
            """)
    List<Object[]> findStudentPerformanceByClassroom(@Param("classroomId") Long classroomId);

    @Query("""
            SELECT
                u.id as studentId,
                u.firstName,
                u.lastName,
                COALESCE(l.totalScores, 0) as totalScore,
                COALESCE(l.attempts, 0) as attempts,
                l.fastestTimeSeconds as bestTime,
                COALESCE(l.finalScore, 0.0) as finalScore
            FROM LeaderboardEntry l
            JOIN l.student u
            WHERE l.quiz.id = :quizId
            ORDER BY l.finalScore DESC NULLS LAST, l.fastestTimeSeconds ASC NULLS LAST
            """)
    List<Object[]> findStudentPerformanceByQuiz(@Param("quizId") Long quizId);

    @Query("""
            SELECT
                u.id as studentId,
                u.firstName,
                u.lastName,
                COALESCE(SUM(l.highestScore), 0) as totalScore,
                COUNT(l) as attempts,
                MIN(l.fastestTimeSeconds) as bestTime,
                COUNT(DISTINCT l.quiz) as totalQuizzes
            FROM LeaderboardEntry l
            JOIN l.student u
            WHERE l.classroom.id = :classroomId
            GROUP BY u.id, u.firstName, u.lastName
            ORDER BY totalQuizzes DESC
            """)
    List<Object[]> findTop10StudentsByQuizParticipation(@Param("classroomId") Long classroomId);

    @Modifying
    @Query("DELETE FROM LeaderboardEntry le WHERE le.quiz = :quiz")
    void deleteByQuiz(Quiz quiz);
}