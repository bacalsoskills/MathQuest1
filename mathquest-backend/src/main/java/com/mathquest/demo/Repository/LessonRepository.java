package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.Classroom;
import com.mathquest.demo.Model.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByClassroom(Classroom classroom);

    List<Lesson> findByClassroomIdOrderByOrderIndexAsc(Long classroomId);

    Optional<Lesson> findByIdAndClassroomId(Long id, Long classroomId);

    Integer countByClassroomId(Long classroomId);
}