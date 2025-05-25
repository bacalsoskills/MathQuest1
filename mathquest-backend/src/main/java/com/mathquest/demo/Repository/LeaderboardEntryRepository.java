package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.Classroom;
import com.mathquest.demo.Model.LeaderboardEntry;
import com.mathquest.demo.Model.Quiz;
import com.mathquest.demo.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaderboardEntryRepository extends JpaRepository<LeaderboardEntry, Long> {
        Optional<LeaderboardEntry> findByStudentAndQuiz(User student, Quiz quiz);

        List<LeaderboardEntry> findByQuiz(Quiz quiz);

        List<LeaderboardEntry> findByQuizOrderByRankAsc(Quiz quiz);

        List<LeaderboardEntry> findTop10ByQuizOrderByHighestScoreDescFastestTimeSecondsAsc(Quiz quiz);

        List<LeaderboardEntry> findByClassroomOrderByHighestScoreDesc(Classroom classroom);

        /**
         * Find top 10 students by total score in a classroom
         * 
         * @param classroom The classroom
         * @return List of top 10 students by total score
         */
        @Query("SELECT le.student.id as studentId, " +
                        "le.student.firstName as firstName, " +
                        "le.student.lastName as lastName, " +
                        "SUM(le.highestScore) as totalScore, " +
                        "MIN(le.fastestTimeSeconds) as bestTime, " +
                        "COUNT(le.id) as totalQuizzes " +
                        "FROM LeaderboardEntry le " +
                        "WHERE le.classroom.id = :classroomId " +
                        "GROUP BY le.student.id, le.student.firstName, le.student.lastName " +
                        "ORDER BY totalScore DESC")
        List<Object[]> findTop10StudentsByTotalScoreInClassroom(@Param("classroomId") Long classroomId);

        /**
         * Find top 10 students by quiz participation in a classroom
         * 
         * @param classroomId The classroom ID
         * @return List of top 10 students by quiz participation
         */
        @Query("SELECT le.student.id as studentId, " +
                        "le.student.firstName as firstName, " +
                        "le.student.lastName as lastName, " +
                        "SUM(le.highestScore) as totalScore, " +
                        "MIN(le.fastestTimeSeconds) as bestTime, " +
                        "COUNT(le.id) as totalQuizzes " +
                        "FROM LeaderboardEntry le " +
                        "WHERE le.classroom.id = :classroomId " +
                        "GROUP BY le.student.id, le.student.firstName, le.student.lastName " +
                        "ORDER BY totalQuizzes DESC")
        List<Object[]> findTop10StudentsByQuizParticipation(@Param("classroomId") Long classroomId);
}