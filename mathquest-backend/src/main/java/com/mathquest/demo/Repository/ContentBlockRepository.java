package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.ContentBlock;
import com.mathquest.demo.Model.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContentBlockRepository extends JpaRepository<ContentBlock, Long> {
    List<ContentBlock> findByLesson(Lesson lesson);

    List<ContentBlock> findByLessonId(Long lessonId);

    List<ContentBlock> findByLessonIdOrderByOrderIndexAsc(Long lessonId);

    void deleteByLessonId(Long lessonId);
}