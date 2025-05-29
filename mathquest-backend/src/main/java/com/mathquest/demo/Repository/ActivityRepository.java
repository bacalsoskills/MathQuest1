package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.Activity;
import com.mathquest.demo.Model.ActivityType;
import com.mathquest.demo.Model.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByClassroomOrderByOrderIndexAsc(Classroom classroom);

    @Query("SELECT a FROM Activity a WHERE a.classroom.id = :classroomId AND a.isDeleted = false ORDER BY a.orderIndex ASC")
    List<Activity> findByClassroomIdOrderByOrderIndexAsc(Long classroomId);

    @Query("SELECT a FROM Activity a WHERE a.classroom.id = :classroomId AND a.type = :type AND a.isDeleted = false")
    List<Activity> findByClassroomIdAndType(Long classroomId, ActivityType type);

    @Query("SELECT a FROM Activity a WHERE a.id = :id AND a.classroom.id = :classroomId AND a.isDeleted = false")
    Optional<Activity> findByIdAndClassroomId(Long id, Long classroomId);

    void deleteByClassroomId(Long classroomId);
}