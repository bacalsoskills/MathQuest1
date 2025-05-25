package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.Activity;
import com.mathquest.demo.Model.ActivityCompletion;
import com.mathquest.demo.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ActivityCompletionRepository extends JpaRepository<ActivityCompletion, Long> {
        List<ActivityCompletion> findByActivityId(Long activityId);

        List<ActivityCompletion> findByStudentId(Long studentId);

        List<ActivityCompletion> findByActivityIdAndStudentId(Long activityId, Long studentId);

        Optional<ActivityCompletion> findByActivityAndStudent(Activity activity, User student);

        @Query("SELECT ac FROM ActivityCompletion ac WHERE ac.activity.classroom.id = :classroomId AND ac.student.id = :studentId")
        List<ActivityCompletion> findByClassroomIdAndStudentId(@Param("classroomId") Long classroomId,
                        @Param("studentId") Long studentId);

        @Query("SELECT SUM(ac.score) FROM ActivityCompletion ac WHERE ac.student.id = :studentId AND ac.activity.classroom.id = :classroomId AND ac.completed = true")
        Integer getTotalScoreByStudentAndClassroom(@Param("studentId") Long studentId,
                        @Param("classroomId") Long classroomId);

        @Query("SELECT COUNT(ac) FROM ActivityCompletion ac WHERE ac.student.id = :studentId AND ac.activity.classroom.id = :classroomId AND ac.completed = true")
        Integer getCompletedActivitiesByStudentAndClassroom(@Param("studentId") Long studentId,
                        @Param("classroomId") Long classroomId);
}