package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.Activity;
import com.mathquest.demo.Model.ActivityType;
import com.mathquest.demo.Model.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByClassroomOrderByOrderIndexAsc(Classroom classroom);

    List<Activity> findByClassroomIdOrderByOrderIndexAsc(Long classroomId);

    List<Activity> findByClassroomIdAndType(Long classroomId, ActivityType type);

    Optional<Activity> findByIdAndClassroomId(Long id, Long classroomId);

    void deleteByClassroomId(Long classroomId);
}