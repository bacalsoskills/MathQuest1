package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.ActivityCompletionDTO;
import com.mathquest.demo.DTO.ActivityDTO;
import com.mathquest.demo.DTO.Request.CreateActivityRequest;
import com.mathquest.demo.DTO.Request.SubmitActivityRequest;
import com.mathquest.demo.Model.ActivityType;
import com.mathquest.demo.Model.User;

import java.util.List;
import java.util.Map;

public interface ActivityService {
    ActivityDTO createActivity(CreateActivityRequest request, User teacher);

    ActivityDTO getActivityById(Long id);

    ActivityDTO getActivityByIdAndClassroomId(Long id, Long classroomId);

    List<ActivityDTO> getActivitiesByClassroomId(Long classroomId);

    List<ActivityDTO> getActivitiesByClassroomIdAndType(Long classroomId, ActivityType type);

    ActivityDTO updateActivity(Long id, CreateActivityRequest request, User teacher);

    void deleteActivity(Long id, User teacher);

    // Activity completion methods
    ActivityCompletionDTO startActivity(Long activityId, User student);

    ActivityCompletionDTO submitActivity(SubmitActivityRequest request, User student);

    List<ActivityCompletionDTO> getActivityCompletionsByActivityId(Long activityId);

    List<ActivityCompletionDTO> getActivityCompletionsByStudentId(Long studentId);

    List<ActivityCompletionDTO> getActivityCompletionsByClassroomIdAndStudentId(Long classroomId, Long studentId);

    // Analytics methods
    Map<String, Object> getStudentLeaderboard(Long classroomId);

    Map<String, Object> getStudentProgress(Long classroomId, Long studentId);
}