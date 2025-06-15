package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.ActivitySummaryDTO;
import com.mathquest.demo.DTO.ContentBlockDTO;
import com.mathquest.demo.DTO.LessonDTO;
import com.mathquest.demo.DTO.LessonCompletionDTO;
import com.mathquest.demo.DTO.Request.CreateLessonRequest;
import com.mathquest.demo.Exception.ResourceNotFoundException;
import com.mathquest.demo.Model.*;
import com.mathquest.demo.Repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
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
import com.mathquest.demo.Repository.LessonCompletionRepository;
import com.mathquest.demo.Repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
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

    @Autowired
    private LessonCompletionRepository lessonCompletionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuizRepository quizRepository;

    private static final Logger logger = LoggerFactory.getLogger(LessonServiceImpl.class);

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

        // Add activities associated with this lesson's quizzes
        List<Activity> activities = lesson.getQuizzes().stream()
                .map(Quiz::getActivity)
                .collect(Collectors.toList());
        List<ActivitySummaryDTO> activitySummaryDTOs = activities.stream()
                .map(activity -> {
                    String imageUrl = null;
                    if (activity.getImage() != null) {
                        imageUrl = "/files/activity-images/" + activity.getId();
                    }
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
        logger.info("Starting deletion of lesson {}", id);

        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Lesson not found with id: " + id));

        // Check if the teacher owns the classroom
        if (!lesson.getClassroom().getTeacher().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("You don't have permission to delete this lesson");
        }

        // Find all quizzes associated with this lesson
        List<Quiz> quizzes = quizRepository.findByLesson(lesson);
        logger.info("Found {} quizzes associated with lesson {}", quizzes.size(), id);

        // For each quiz, mark its activity as deleted
        for (Quiz quiz : quizzes) {
            Activity activity = quiz.getActivity();
            if (activity != null) {
                logger.info("Marking activity {} as deleted for quiz {}", activity.getId(), quiz.getId());
                activity.setIsDeleted(true);
                activityRepository.save(activity);
            }
        }

        // Delete the lesson (this will cascade delete content blocks)
        logger.info("Deleting lesson {}", id);
        lessonRepository.delete(lesson);
        logger.info("Successfully deleted lesson {} and all related data", id);
    }

    @Override
    @Transactional
    public void markLessonContentAsRead(Long lessonId, Long studentId) {
        logger.info("Marking lesson {} content as read for student {}", lessonId, studentId);
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new EntityNotFoundException("Lesson not found"));
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student not found"));

        LessonCompletion completion = lessonCompletionRepository.findByLessonAndStudent(lesson, student)
                .orElse(new LessonCompletion(lesson, student));

        completion.markContentAsRead();
        lessonCompletionRepository.save(completion);
        logger.info("Successfully marked lesson {} content as read for student {}", lessonId, studentId);
    }

    @Override
    @Transactional
    public void markLessonQuizAsCompleted(Long lessonId, Long studentId, Integer score) {
        logger.info("Marking lesson {} quiz as completed for student {} with score {}", lessonId, studentId, score);
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new EntityNotFoundException("Lesson not found"));
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student not found"));

        LessonCompletion completion = lessonCompletionRepository.findByLessonAndStudent(lesson, student)
                .orElse(new LessonCompletion(lesson, student));

        completion.completeQuiz(score);
        lessonCompletionRepository.save(completion);
        logger.info("Successfully marked lesson {} quiz as completed for student {}", lessonId, studentId);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getLessonCompletionStats(Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));

        // Get total number of students in the classroom
        long totalStudents = userRepository.countByClassroomIdAndRole(lesson.getClassroom().getId(),
                ERole.ROLE_STUDENT);

        // Get lesson completion stats
        List<LessonCompletion> completions = lessonCompletionRepository.findByLessonId(lessonId);
        long studentsRead = completions.stream().filter(completion -> completion.getContentRead()).count();
        long studentsCompletedQuiz = completions.stream().filter(completion -> completion.getQuizCompleted()).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalStudents", totalStudents);
        stats.put("studentsRead", studentsRead);
        stats.put("studentsCompletedQuiz", studentsCompletedQuiz);
        stats.put("readPercentage", totalStudents > 0 ? (studentsRead * 100.0 / totalStudents) : 0);
        stats.put("quizCompletionPercentage", totalStudents > 0 ? (studentsCompletedQuiz * 100.0 / totalStudents) : 0);

        logger.info("Retrieved completion stats for lesson {}: {} students read, {} completed quiz",
                lessonId, studentsRead, studentsCompletedQuiz);

        return stats;
    }

    @Override
    @Transactional(readOnly = true)
    public LessonCompletionDTO getLessonCompletionStatus(Long lessonId, Long studentId) {
        logger.info("Getting completion status for lesson {} and student {}", lessonId, studentId);
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new EntityNotFoundException("Lesson not found"));
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student not found"));

        LessonCompletion completion = lessonCompletionRepository.findByLessonAndStudent(lesson, student)
                .orElse(new LessonCompletion(lesson, student));

        return LessonCompletionDTO.fromLessonCompletion(completion);
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getStudentsWhoReadLesson(Long lessonId) {
        logger.info("Getting students who read lesson {}", lessonId);
        // Verify lesson exists
        if (!lessonRepository.existsById(lessonId)) {
            throw new EntityNotFoundException("Lesson not found with id: " + lessonId);
        }

        List<User> studentsWhoRead = lessonCompletionRepository.findStudentsWhoReadLesson(lessonId);
        logger.info("Found {} students who read lesson {}", studentsWhoRead.size(), lessonId);
        return studentsWhoRead;
    }
}