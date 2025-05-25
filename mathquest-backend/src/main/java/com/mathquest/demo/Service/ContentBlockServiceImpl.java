package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.ContentBlockDTO;
import com.mathquest.demo.DTO.Request.CreateContentBlockRequest;
import com.mathquest.demo.Model.ContentBlock;
import com.mathquest.demo.Model.Lesson;
import com.mathquest.demo.Model.User;
import com.mathquest.demo.Repository.ContentBlockRepository;
import com.mathquest.demo.Repository.LessonRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContentBlockServiceImpl implements ContentBlockService {

    @Autowired
    private ContentBlockRepository contentBlockRepository;

    @Autowired
    private LessonRepository lessonRepository;

    private String getImagesUrl(ContentBlock contentBlock) {
        if (contentBlock.getImages() != null && contentBlock.getImages().length > 0) {
            return "/files/content-block-images/" + contentBlock.getId();
        }
        return null;
    }

    private String getAttachmentsUrl(ContentBlock contentBlock) {
        if (contentBlock.getAttachments() != null && contentBlock.getAttachments().length > 0) {
            return "/files/content-block-attachments/" + contentBlock.getId();
        }
        return null;
    }

    @Override
    @Transactional
    public ContentBlockDTO createContentBlock(CreateContentBlockRequest request, User teacher) {
        Lesson lesson = lessonRepository.findById(request.getLessonId())
                .orElseThrow(() -> new EntityNotFoundException("Lesson not found with id: " + request.getLessonId()));

        // Check if the teacher owns the classroom
        if (!lesson.getClassroom().getTeacher().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("You don't have permission to create content blocks for this lesson");
        }

        ContentBlock contentBlock = new ContentBlock();
        contentBlock.setStructuredContent(request.getStructuredContent());
        contentBlock.setLesson(lesson);
        contentBlock.setOrderIndex(request.getOrderIndex());

        // Handle images upload
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            try {
                contentBlock.setImages(request.getImages().getBytes());
            } catch (IOException e) {
                throw new RuntimeException("Failed to store content block images", e);
            }
        }

        // Handle attachments upload
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            try {
                contentBlock.setAttachments(request.getAttachments().getBytes());
            } catch (IOException e) {
                throw new RuntimeException("Failed to store content block attachments", e);
            }
        }

        ContentBlock savedContentBlock = contentBlockRepository.save(contentBlock);
        return ContentBlockDTO.fromContentBlock(
                savedContentBlock,
                getImagesUrl(savedContentBlock),
                getAttachmentsUrl(savedContentBlock));
    }

    @Override
    public ContentBlockDTO getContentBlockById(Long id) {
        ContentBlock contentBlock = contentBlockRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Content block not found with id: " + id));
        return ContentBlockDTO.fromContentBlock(
                contentBlock,
                getImagesUrl(contentBlock),
                getAttachmentsUrl(contentBlock));
    }

    @Override
    public List<ContentBlockDTO> getContentBlocksByLessonId(Long lessonId) {
        List<ContentBlock> contentBlocks = contentBlockRepository.findByLessonIdOrderByOrderIndexAsc(lessonId);
        return contentBlocks.stream()
                .map(contentBlock -> ContentBlockDTO.fromContentBlock(
                        contentBlock,
                        getImagesUrl(contentBlock),
                        getAttachmentsUrl(contentBlock)))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ContentBlockDTO updateContentBlock(Long id, CreateContentBlockRequest request, User teacher) {
        ContentBlock contentBlock = contentBlockRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Content block not found with id: " + id));

        // Check if the teacher owns the classroom
        if (!contentBlock.getLesson().getClassroom().getTeacher().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("You don't have permission to update this content block");
        }

        // If lesson ID is changing, verify the new lesson
        if (!contentBlock.getLesson().getId().equals(request.getLessonId())) {
            Lesson newLesson = lessonRepository.findById(request.getLessonId())
                    .orElseThrow(
                            () -> new EntityNotFoundException("Lesson not found with id: " + request.getLessonId()));

            // Check if the teacher owns the new classroom
            if (!newLesson.getClassroom().getTeacher().getId().equals(teacher.getId())) {
                throw new AccessDeniedException("You don't have permission to move content block to this lesson");
            }

            contentBlock.setLesson(newLesson);
        }

        contentBlock.setStructuredContent(request.getStructuredContent());
        contentBlock.setOrderIndex(request.getOrderIndex());

        // Handle images upload
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            try {
                contentBlock.setImages(request.getImages().getBytes());
            } catch (IOException e) {
                throw new RuntimeException("Failed to store content block images", e);
            }
        }

        // Handle attachments upload
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            try {
                contentBlock.setAttachments(request.getAttachments().getBytes());
            } catch (IOException e) {
                throw new RuntimeException("Failed to store content block attachments", e);
            }
        }

        ContentBlock updatedContentBlock = contentBlockRepository.save(contentBlock);
        return ContentBlockDTO.fromContentBlock(
                updatedContentBlock,
                getImagesUrl(updatedContentBlock),
                getAttachmentsUrl(updatedContentBlock));
    }

    @Override
    @Transactional
    public void deleteContentBlock(Long id, User teacher) {
        ContentBlock contentBlock = contentBlockRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Content block not found with id: " + id));

        // Check if the teacher owns the classroom
        if (!contentBlock.getLesson().getClassroom().getTeacher().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("You don't have permission to delete this content block");
        }

        contentBlockRepository.delete(contentBlock);
    }
}