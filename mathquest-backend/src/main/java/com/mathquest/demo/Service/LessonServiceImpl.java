package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.ActivitySummaryDTO;
import com.mathquest.demo.DTO.ContentBlockDTO;
import com.mathquest.demo.DTO.LessonDTO;
import com.mathquest.demo.DTO.Request.CreateLessonRequest;
import com.mathquest.demo.Model.Activity;
import com.mathquest.demo.Model.ActivityCompletion;
import com.mathquest.demo.Model.Classroom;
import com.mathquest.demo.Model.ContentBlock;
import com.mathquest.demo.Model.Lesson;
import com.mathquest.demo.Model.User;
import com.mathquest.demo.Repository.ActivityCompletionRepository;
import com.mathquest.demo.Repository.ActivityRepository;
import com.mathquest.demo.Repository.ClassroomRepository;
import com.mathquest.demo.Repository.ContentBlockRepository;
import com.mathquest.demo.Repository.LessonRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class LessonServiceImpl implements LessonService {

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private ContentBlockRepository contentBlockRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private ActivityCompletionRepository activityCompletionRepository;

    private String getImageUrl(Lesson lesson) {
        if (lesson.getImage() != null) {
            return "/files/lesson-images/" + lesson.getId();
        }
        return null;
    }

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
    public LessonDTO createLesson(CreateLessonRequest request, User teacher) {
        Classroom classroom = classroomRepository.findById(request.getClassroomId())
                .orElseThrow(
                        () -> new EntityNotFoundException("Classroom not found with id: " + request.getClassroomId()));

        // Check if the teacher owns the classroom
        if (!classroom.getTeacher().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("You don't have permission to create lessons for this classroom");
        }

        // If no order index is provided, put it at the end
        if (request.getOrderIndex() == null) {
            Integer count = lessonRepository.countByClassroomId(classroom.getId());
            request.setOrderIndex(count + 1);
        }

        Lesson lesson = new Lesson();
        lesson.setTitle(request.getTitle());
        lesson.setDescription(request.getDescription());
        lesson.setClassroom(classroom);
        lesson.setOrderIndex(request.getOrderIndex());

        // Handle image upload
        if (request.getImage() != null && !request.getImage().isEmpty()) {
            try {
                lesson.setImage(request.getImage().getBytes());
            } catch (IOException e) {
                throw new RuntimeException("Failed to store lesson image", e);
            }
        }

        Lesson savedLesson = lessonRepository.save(lesson);
        return LessonDTO.fromLesson(savedLesson, getImageUrl(savedLesson));
    }

    @Override
    @Transactional(readOnly = true)
    public LessonDTO getLessonById(Long id) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Lesson not found with id: " + id));

        LessonDTO lessonDTO = LessonDTO.fromLesson(lesson, getImageUrl(lesson));

        // Add content blocks
        List<ContentBlock> contentBlocks = contentBlockRepository.findByLessonIdOrderByOrderIndexAsc(id);
        List<ContentBlockDTO> contentBlockDTOs = contentBlocks.stream()
                .map(contentBlock -> {
                    return ContentBlockDTO.fromContentBlock(
                            contentBlock,
                            getImagesUrl(contentBlock),
                            getAttachmentsUrl(contentBlock));
                })
                .collect(Collectors.toList());
        lessonDTO.setContentBlocks(contentBlockDTOs);

        // Add activities from the classroom
        List<Activity> activities = activityRepository
                .findByClassroomIdOrderByOrderIndexAsc(lesson.getClassroom().getId());
        List<ActivitySummaryDTO> activitySummaryDTOs = activities.stream()
                .map(activity -> {
                    String imageUrl = null;
                    if (activity.getImage() != null) {
                        imageUrl = "/files/activity-images/" + activity.getId();
                    }

                    // For now, we don't have user context, so we can't determine completion status
                    return ActivitySummaryDTO.fromActivity(activity, imageUrl, false, null);
                })
                .collect(Collectors.toList());
        lessonDTO.setActivities(activitySummaryDTOs);

        return lessonDTO;
    }

    @Override
    @Transactional(readOnly = true)
    public LessonDTO getLessonByIdAndClassroomId(Long id, Long classroomId) {
        Lesson lesson = lessonRepository.findByIdAndClassroomId(id, classroomId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Lesson not found with id: " + id + " and classroom id: " + classroomId));

        return getLessonById(lesson.getId()); // Reuse the existing method to load details
    }

    @Override
    @Transactional(readOnly = true)
    public List<LessonDTO> getLessonsByClassroomId(Long classroomId) {
        List<Lesson> lessons = lessonRepository.findByClassroomIdOrderByOrderIndexAsc(classroomId);

        return lessons.stream()
                .map(lesson -> {
                    LessonDTO dto = LessonDTO.fromLesson(lesson, getImageUrl(lesson));

                    // We don't load content blocks and activities here for performance reasons
                    // They will be loaded when a specific lesson is requested
                    dto.setContentBlocks(new ArrayList<>());
                    dto.setActivities(new ArrayList<>());

                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public LessonDTO updateLesson(Long id, CreateLessonRequest request, User teacher) {
        if (id == null) {
            throw new IllegalArgumentException("Lesson ID cannot be null");
        }

        if (request == null) {
            throw new IllegalArgumentException("Request cannot be null");
        }

        System.out.println("Updating lesson with ID: " + id + " - Title: " + request.getTitle()
                + " - ClassroomId: " + request.getClassroomId());

        try {
            Lesson lesson = lessonRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Lesson not found with id: " + id));

            // Check if the teacher owns the classroom
            if (!lesson.getClassroom().getTeacher().getId().equals(teacher.getId())) {
                throw new AccessDeniedException("You don't have permission to update this lesson");
            }

            // Default to using the existing classroom if not provided
            final Long classroomIdToUse;
            if (request.getClassroomId() == null) {
                classroomIdToUse = lesson.getClassroom().getId();
                System.out.println("Using existing classroom ID: " + classroomIdToUse);
            } else {
                classroomIdToUse = request.getClassroomId();
            }

            // Only check classroom change if a valid classroomId is provided and it's
            // different
            if (classroomIdToUse != null &&
                    !lesson.getClassroom().getId().equals(classroomIdToUse)) {
                try {
                    Classroom newClassroom = classroomRepository.findById(classroomIdToUse)
                            .orElseThrow(() -> new EntityNotFoundException(
                                    "Classroom not found with id: " + classroomIdToUse));

                    // Check if the teacher owns the new classroom
                    if (!newClassroom.getTeacher().getId().equals(teacher.getId())) {
                        throw new AccessDeniedException("You don't have permission to move lesson to this classroom");
                    }

                    System.out.println("Updating lesson classroom from " + lesson.getClassroom().getId() + " to "
                            + classroomIdToUse);
                    lesson.setClassroom(newClassroom);
                } catch (NumberFormatException e) {
                    System.err.println("Invalid classroom ID format: " + classroomIdToUse);
                    throw new IllegalArgumentException("Invalid classroom ID format: " + classroomIdToUse);
                }
            }

            // Update basic fields if provided
            if (request.getTitle() != null && !request.getTitle().isEmpty()) {
                lesson.setTitle(request.getTitle());
            }

            // These fields are optional
            if (request.getDescription() != null) {
                lesson.setDescription(request.getDescription());
            }

            if (request.getOrderIndex() != null) {
                lesson.setOrderIndex(request.getOrderIndex());
            }

            // Handle image upload
            if (request.getImage() != null && !request.getImage().isEmpty()) {
                try {
                    System.out.println("Updating lesson image, size: " + request.getImage().getSize() + " bytes");
                    lesson.setImage(request.getImage().getBytes());
                } catch (IOException e) {
                    System.err.println("Failed to store lesson image: " + e.getMessage());
                    throw new RuntimeException("Failed to store lesson image: " + e.getMessage(), e);
                }
            }

            Lesson updatedLesson = lessonRepository.save(lesson);
            System.out.println("Lesson successfully updated: " + updatedLesson.getId());
            return getLessonById(updatedLesson.getId()); // Reuse the existing method to load details
        } catch (Exception e) {
            System.err.println("Error updating lesson: " + e.getMessage());
            throw e; // Re-throw to propagate to controller
        }
    }

    @Override
    @Transactional
    public void deleteLesson(Long id, User teacher) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Lesson not found with id: " + id));

        // Check if the teacher owns the classroom
        if (!lesson.getClassroom().getTeacher().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("You don't have permission to delete this lesson");
        }

        // Delete related content blocks and activities (should be handled by cascade)
        lessonRepository.delete(lesson);
    }
}