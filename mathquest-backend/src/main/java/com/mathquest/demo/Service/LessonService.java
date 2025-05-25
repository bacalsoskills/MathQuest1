package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.LessonDTO;
import com.mathquest.demo.DTO.Request.CreateLessonRequest;
import com.mathquest.demo.Model.User;

import java.util.List;

public interface LessonService {
    LessonDTO createLesson(CreateLessonRequest request, User teacher);
    LessonDTO getLessonById(Long id);
    LessonDTO getLessonByIdAndClassroomId(Long id, Long classroomId);
    List<LessonDTO> getLessonsByClassroomId(Long classroomId);
    LessonDTO updateLesson(Long id, CreateLessonRequest request, User teacher);
    void deleteLesson(Long id, User teacher);
} 