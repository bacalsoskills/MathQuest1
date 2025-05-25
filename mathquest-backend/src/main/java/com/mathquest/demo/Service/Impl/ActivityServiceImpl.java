package com.mathquest.demo.Service.Impl;

import com.mathquest.demo.DTO.ActivityCompletionDTO;
import com.mathquest.demo.DTO.ActivityDTO;
import com.mathquest.demo.DTO.Request.CreateActivityRequest;
import com.mathquest.demo.DTO.Request.SubmitActivityRequest;
import com.mathquest.demo.Model.*;
import com.mathquest.demo.Repository.*;
import com.mathquest.demo.Service.ActivityService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ActivityServiceImpl implements ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private ActivityCompletionRepository activityCompletionRepository;

    @Autowired
    private UserRepository userRepository;

    private String getImageUrl(Activity activity) {
        if (activity.getImage() != null) {
            return "/files/activity-images/" + activity.getId();
        }
        return null;
    }

    @Override
    @Transactional
    public ActivityDTO createActivity(CreateActivityRequest request, User teacher) {
        Classroom classroom = classroomRepository.findById(request.getClassroomId())
                .orElseThrow(
                        () -> new EntityNotFoundException("Classroom not found with id: " + request.getClassroomId()));

        // Check if the teacher owns the classroom
        if (!classroom.getTeacher().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("You don't have permission to create activities for this classroom");
        }

        Activity activity = new Activity();
        activity.setTitle(request.getTitle());
        activity.setDescription(request.getDescription());
        activity.setType(request.getType());
        activity.setContent(request.getContent());
        activity.setOrderIndex(request.getOrderIndex());
        activity.setMaxScore(request.getMaxScore());
        activity.setTimeLimit(request.getTimeLimit());
        activity.setClassroom(classroom);

        // Handle image upload
        if (request.getImage() != null && !request.getImage().isEmpty()) {
            try {
                activity.setImage(request.getImage().getBytes());
            } catch (IOException e) {
                throw new RuntimeException("Failed to store activity image", e);
            }
        }

        Activity savedActivity = activityRepository.save(activity);
        return ActivityDTO.fromActivity(savedActivity, getImageUrl(savedActivity));
    }

    @Override
    public ActivityDTO getActivityById(Long id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with id: " + id));
        return ActivityDTO.fromActivity(activity, getImageUrl(activity));
    }

    @Override
    public ActivityDTO getActivityByIdAndClassroomId(Long id, Long classroomId) {
        Activity activity = activityRepository.findByIdAndClassroomId(id, classroomId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Activity not found with id: " + id + " and classroom id: " + classroomId));
        return ActivityDTO.fromActivity(activity, getImageUrl(activity));
    }

    @Override
    public List<ActivityDTO> getActivitiesByClassroomId(Long classroomId) {
        List<Activity> activities = activityRepository.findByClassroomIdOrderByOrderIndexAsc(classroomId);
        return activities.stream()
                .map(activity -> ActivityDTO.fromActivity(activity, getImageUrl(activity)))
                .collect(Collectors.toList());
    }

    @Override
    public List<ActivityDTO> getActivitiesByClassroomIdAndType(Long classroomId, ActivityType type) {
        List<Activity> activities = activityRepository.findByClassroomIdAndType(classroomId, type);
        return activities.stream()
                .map(activity -> ActivityDTO.fromActivity(activity, getImageUrl(activity)))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ActivityDTO updateActivity(Long id, CreateActivityRequest request, User teacher) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with id: " + id));

        // Check if the teacher owns the classroom
        if (!activity.getClassroom().getTeacher().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("You don't have permission to update this activity");
        }

        // If classroom is changing, verify the new classroom
        if (!activity.getClassroom().getId().equals(request.getClassroomId())) {
            Classroom newClassroom = classroomRepository.findById(request.getClassroomId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Classroom not found with id: " + request.getClassroomId()));

            // Check if the teacher owns the new classroom
            if (!newClassroom.getTeacher().getId().equals(teacher.getId())) {
                throw new AccessDeniedException("You don't have permission to move activity to this classroom");
            }

            activity.setClassroom(newClassroom);
        }

        activity.setTitle(request.getTitle());
        activity.setDescription(request.getDescription());
        activity.setType(request.getType());
        activity.setContent(request.getContent());
        activity.setOrderIndex(request.getOrderIndex());
        activity.setMaxScore(request.getMaxScore());
        activity.setTimeLimit(request.getTimeLimit());

        // Handle image upload
        if (request.getImage() != null && !request.getImage().isEmpty()) {
            try {
                activity.setImage(request.getImage().getBytes());
            } catch (IOException e) {
                throw new RuntimeException("Failed to store activity image", e);
            }
        }

        Activity updatedActivity = activityRepository.save(activity);
        return ActivityDTO.fromActivity(updatedActivity, getImageUrl(updatedActivity));
    }

    @Override
    @Transactional
    public void deleteActivity(Long id, User teacher) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with id: " + id));

        // Check if the teacher owns the classroom
        if (!activity.getClassroom().getTeacher().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("You don't have permission to delete this activity");
        }

        activityRepository.delete(activity);
    }

    @Override
    @Transactional
    public ActivityCompletionDTO startActivity(Long activityId, User student) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with id: " + activityId));

        // Check if student is enrolled in the classroom
        boolean isEnrolled = activity.getClassroom().getStudents().stream()
                .anyMatch(cs -> cs.getStudent().getId().equals(student.getId()) && cs.isActive());

        if (!isEnrolled) {
            throw new AccessDeniedException("You are not enrolled in this classroom");
        }

        // Check if the student has already started this activity
        Optional<ActivityCompletion> existingCompletion = activityCompletionRepository
                .findByActivityAndStudent(activity, student);

        if (existingCompletion.isPresent()) {
            return ActivityCompletionDTO.fromActivityCompletion(existingCompletion.get());
        }

        // Create new activity completion
        ActivityCompletion completion = new ActivityCompletion(activity, student);
        ActivityCompletion savedCompletion = activityCompletionRepository.save(completion);

        return ActivityCompletionDTO.fromActivityCompletion(savedCompletion);
    }

    @Override
    @Transactional
    public ActivityCompletionDTO submitActivity(SubmitActivityRequest request, User student) {
        Activity activity = activityRepository.findById(request.getActivityId())
                .orElseThrow(
                        () -> new EntityNotFoundException("Activity not found with id: " + request.getActivityId()));

        // Find existing completion or create new one
        ActivityCompletion completion = activityCompletionRepository
                .findByActivityAndStudent(activity, student)
                .orElseGet(() -> new ActivityCompletion(activity, student));

        completion.setScore(request.getScore());
        completion.setTimeSpent(request.getTimeSpent());
        completion.setAnswers(request.getAnswers());
        completion.setCompleted(true);
        completion.setCompletedAt(LocalDateTime.now());

        ActivityCompletion savedCompletion = activityCompletionRepository.save(completion);
        return ActivityCompletionDTO.fromActivityCompletion(savedCompletion);
    }

    @Override
    public List<ActivityCompletionDTO> getActivityCompletionsByActivityId(Long activityId) {
        List<ActivityCompletion> completions = activityCompletionRepository.findByActivityId(activityId);
        return completions.stream()
                .map(ActivityCompletionDTO::fromActivityCompletion)
                .collect(Collectors.toList());
    }

    @Override
    public List<ActivityCompletionDTO> getActivityCompletionsByStudentId(Long studentId) {
        List<ActivityCompletion> completions = activityCompletionRepository.findByStudentId(studentId);
        return completions.stream()
                .map(ActivityCompletionDTO::fromActivityCompletion)
                .collect(Collectors.toList());
    }

    @Override
    public List<ActivityCompletionDTO> getActivityCompletionsByClassroomIdAndStudentId(Long classroomId,
            Long studentId) {
        List<ActivityCompletion> completions = activityCompletionRepository
                .findByClassroomIdAndStudentId(classroomId, studentId);
        return completions.stream()
                .map(ActivityCompletionDTO::fromActivityCompletion)
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getStudentLeaderboard(Long classroomId) {
        // Get all students in the classroom
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found with id: " + classroomId));

        List<Map<String, Object>> leaderboard = new ArrayList<>();
        for (ClassroomStudent cs : classroom.getStudents()) {
            if (!cs.isActive())
                continue;

            User student = cs.getStudent();
            Integer totalScore = activityCompletionRepository
                    .getTotalScoreByStudentAndClassroom(student.getId(), classroomId);
            Integer completedActivities = activityCompletionRepository
                    .getCompletedActivitiesByStudentAndClassroom(student.getId(), classroomId);

            Map<String, Object> studentStats = new HashMap<>();
            studentStats.put("studentId", student.getId());
            studentStats.put("studentName", student.getFirstName() + " " + student.getLastName());
            studentStats.put("username", student.getUsername());
            studentStats.put("totalScore", totalScore != null ? totalScore : 0);
            studentStats.put("completedActivities", completedActivities != null ? completedActivities : 0);
            leaderboard.add(studentStats);
        }

        // Sort by total score (descending)
        leaderboard.sort((a, b) -> Integer.compare(
                (Integer) b.get("totalScore"),
                (Integer) a.get("totalScore")));

        // Add rank information
        for (int i = 0; i < leaderboard.size(); i++) {
            leaderboard.get(i).put("rank", i + 1);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("leaderboard", leaderboard);
        result.put("totalStudents", classroom.getStudents().size());
        result.put("classroomName", classroom.getName());

        return result;
    }

    @Override
    public Map<String, Object> getStudentProgress(Long classroomId, Long studentId) {
        // Check if student exists
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student not found with id: " + studentId));

        // Get all completions for this student in this classroom
        List<ActivityCompletion> completions = activityCompletionRepository
                .findByClassroomIdAndStudentId(classroomId, studentId);

        // Calculate statistics
        int totalActivities = 0;
        int completedActivities = 0;
        int totalScore = 0;
        int maxPossibleScore = 0;

        // Get all activities in the classroom
        List<Activity> activities = activityRepository.findByClassroomIdOrderByOrderIndexAsc(classroomId);
        totalActivities = activities.size();

        // Create a map of activity completions for quick lookup
        Map<Long, ActivityCompletion> completionMap = completions.stream()
                .collect(Collectors.toMap(
                        completion -> completion.getActivity().getId(),
                        completion -> completion));

        List<Map<String, Object>> activityProgress = new ArrayList<>();
        for (Activity activity : activities) {
            Map<String, Object> progress = new HashMap<>();
            progress.put("activityId", activity.getId());
            progress.put("title", activity.getTitle());
            progress.put("type", activity.getType());
            progress.put("maxScore", activity.getMaxScore());

            ActivityCompletion completion = completionMap.get(activity.getId());
            if (completion != null && completion.getCompleted()) {
                completedActivities++;
                totalScore += completion.getScore();
                progress.put("completed", true);
                progress.put("score", completion.getScore());
                progress.put("completedAt", completion.getCompletedAt());
            } else {
                progress.put("completed", false);
            }

            maxPossibleScore += activity.getMaxScore() != null ? activity.getMaxScore() : 0;
            activityProgress.add(progress);
        }

        // Calculate completion percentage
        double completionPercentage = totalActivities > 0
                ? ((double) completedActivities / totalActivities) * 100
                : 0;

        // Calculate score percentage
        double scorePercentage = maxPossibleScore > 0
                ? ((double) totalScore / maxPossibleScore) * 100
                : 0;

        Map<String, Object> result = new HashMap<>();
        result.put("studentId", studentId);
        result.put("studentName", student.getFirstName() + " " + student.getLastName());
        result.put("totalActivities", totalActivities);
        result.put("completedActivities", completedActivities);
        result.put("completionPercentage", completionPercentage);
        result.put("totalScore", totalScore);
        result.put("maxPossibleScore", maxPossibleScore);
        result.put("scorePercentage", scorePercentage);
        result.put("activities", activityProgress);

        return result;
    }
}