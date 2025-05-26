package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.Activity;
import com.mathquest.demo.Model.Classroom;
import com.mathquest.demo.Model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
        Optional<Quiz> findByActivity(Activity activity);

        Optional<Quiz> findByActivityId(Long activityId);

        List<Quiz> findByActivity_Classroom(Classroom classroom);

        @Query("SELECT q FROM Quiz q WHERE q.activity.classroom = :classroom ORDER BY q.activity.createdDate DESC")
        List<Quiz> findByClassroomOrderByCreatedAtDesc(Classroom classroom);

        @Query("SELECT q FROM Quiz q WHERE q.activity.classroom = :classroom " +
                        "AND (q.availableFrom IS NULL OR q.availableFrom <= :now) " +
                        "AND (q.availableTo IS NULL OR q.availableTo >= :now)")
        List<Quiz> findAvailableQuizzes(Classroom classroom, LocalDateTime now);
}