package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.LessonDTO;
import com.mathquest.demo.DTO.LessonCompletionDTO;
import com.mathquest.demo.DTO.Request.CreateLessonRequest;
import com.mathquest.demo.Model.User;

import java.util.List;
import java.util.Map;

public interface LessonService {
    LessonDTO createLesson(CreateLessonRequest request, User teacher);

    LessonDTO getLessonById(Long id);

    LessonDTO getLessonByIdAndClassroomId(Long id, Long classroomId);

    List<LessonDTO> getLessonsByClassroomId(Long classroomId);

    LessonDTO updateLesson(Long id, CreateLessonRequest request, User teacher);

    void deleteLesson(Long id, User teacher);

    void markLessonContentAsRead(Long lessonId, Long studentId);

    void markLessonQuizAsCompleted(Long lessonId, Long studentId, Integer score);

    Map<String, Object> getLessonCompletionStats(Long lessonId);

    LessonCompletionDTO getLessonCompletionStatus(Long lessonId, Long studentId);

    List<User> getStudentsWhoReadLesson(Long lessonId);
}