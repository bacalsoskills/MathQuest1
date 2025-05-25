package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.ClassroomDTO;
import com.mathquest.demo.DTO.CreateClassroomRequest;
import com.mathquest.demo.DTO.UserSummaryDTO;
import com.mathquest.demo.Model.User;

import java.util.List;

public interface ClassroomService {
    ClassroomDTO createClassroom(CreateClassroomRequest request, User teacher);

    ClassroomDTO joinClassroom(String classCode, User student);

    ClassroomDTO getClassroomById(Long id);

    ClassroomDTO getClassroomByCode(String classCode);

    List<ClassroomDTO> getClassroomsByTeacher(User teacher);

    List<ClassroomDTO> getClassroomsByStudent(User student);

    List<UserSummaryDTO> getStudentsInClassroom(Long classroomId);

    int getStudentCountInClassroom(Long classroomId);

    // Search for all students by name or username
    List<UserSummaryDTO> searchStudents(String searchTerm, Long classroomId);

    ClassroomDTO addStudentToClassroom(Long classroomId, Long studentId);

    void removeStudentFromClassroom(Long classroomId, Long studentId);

    void leaveClassroom(Long classroomId, User student);

    void deleteClassroom(Long classroomId);

    // Admin specific methods
    List<ClassroomDTO> getAllClassrooms();

    // Method to update classroom details
    ClassroomDTO updateClassroom(Long classroomId, ClassroomDTO classroomDetails);

    // Method to update classroom details with image
    ClassroomDTO updateClassroom(Long classroomId, ClassroomDTO classroomDetails,
            org.springframework.web.multipart.MultipartFile image);

    // Method to delete a classroom by ID
    void deleteClassroomById(Long classroomId);
}