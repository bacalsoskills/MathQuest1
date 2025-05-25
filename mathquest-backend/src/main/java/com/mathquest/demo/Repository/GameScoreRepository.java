package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.GameScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameScoreRepository extends JpaRepository<GameScore, Long> {

    List<GameScore> findByGameId(Long gameId);

    List<GameScore> findByStudentId(Long studentId);

    List<GameScore> findByGameIdAndStudentId(Long gameId, Long studentId);

    @Query("SELECT gs FROM GameScore gs WHERE gs.game.id = :gameId ORDER BY gs.score DESC")
    List<GameScore> findTopScoresByGameId(Long gameId);

    @Query("SELECT gs FROM GameScore gs JOIN gs.game g JOIN g.activity a WHERE a.classroom.id = :classroomId ORDER BY gs.score DESC")
    List<GameScore> findTopScoresByClassroomId(Long classroomId);

    @Query("SELECT gs FROM GameScore gs JOIN gs.game g WHERE g.level = :level AND g.topic = :topic ORDER BY gs.score DESC")
    List<GameScore> findTopScoresByLevelAndTopic(String level, String topic);
}