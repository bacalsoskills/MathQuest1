package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.Game;
import com.mathquest.demo.Model.GameType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameRepository extends JpaRepository<Game, Long> {
    Optional<Game> findByActivityId(Long activityId);

    @Query("SELECT g FROM Game g WHERE g.activity.classroom.id = :classroomId")
    List<Game> findByActivityClassroomId(@Param("classroomId") Long classroomId);

    @Query("SELECT g FROM Game g WHERE g.activity.classroom.id = :classroomId AND g.type = :type")
    List<Game> findByActivityClassroomIdAndType(@Param("classroomId") Long classroomId, @Param("type") GameType type);
}