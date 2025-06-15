package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.Lesson;
import com.mathquest.demo.Model.LessonCompletion;
import com.mathquest.demo.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonCompletionRepository extends JpaRepository<LessonCompletion, Long> {
    Optional<LessonCompletion> findByLessonAndStudent(Lesson lesson, User student);

    List<LessonCompletion> findByLessonId(Long lessonId);

    List<LessonCompletion> findByStudentId(Long studentId);

    @Query("SELECT COUNT(lc) FROM LessonCompletion lc WHERE lc.lesson.id = :lessonId AND lc.contentRead = true")
    Integer countStudentsWhoReadLesson(@Param("lessonId") Long lessonId);

    @Query("SELECT COUNT(lc) FROM LessonCompletion lc WHERE lc.lesson.id = :lessonId AND lc.quizCompleted = true")
    Integer countStudentsWhoCompletedQuiz(@Param("lessonId") Long lessonId);

    @Query("SELECT lc FROM LessonCompletion lc WHERE lc.lesson.classroom.id = :classroomId AND lc.student.id = :studentId")
    List<LessonCompletion> findByClassroomIdAndStudentId(@Param("classroomId") Long classroomId,
            @Param("studentId") Long studentId);

    @Query("SELECT lc.student FROM LessonCompletion lc WHERE lc.lesson.id = :lessonId AND lc.contentRead = true")
    List<User> findStudentsWhoReadLesson(@Param("lessonId") Long lessonId);
}