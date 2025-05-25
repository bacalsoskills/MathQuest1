 package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.ContentBlockDTO;
import com.mathquest.demo.DTO.Request.CreateContentBlockRequest;
import com.mathquest.demo.Model.User;

import java.util.List;

public interface ContentBlockService {
    ContentBlockDTO createContentBlock(CreateContentBlockRequest request, User teacher);
    ContentBlockDTO getContentBlockById(Long id);
    List<ContentBlockDTO> getContentBlocksByLessonId(Long lessonId);
    ContentBlockDTO updateContentBlock(Long id, CreateContentBlockRequest request, User teacher);
    void deleteContentBlock(Long id, User teacher);
} 