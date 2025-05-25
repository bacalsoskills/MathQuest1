package com.mathquest.demo.Controller;

import com.mathquest.demo.DTO.ClassroomDTO;
import com.mathquest.demo.DTO.UserSummaryDTO;
import com.mathquest.demo.Model.User;
import com.mathquest.demo.Service.ClassroomService;
import com.mathquest.demo.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private ClassroomService classroomService;

    @Autowired
    private UserService userService;

    // Endpoint for admins to get all classrooms
    @GetMapping("/classrooms")
    public ResponseEntity<List<ClassroomDTO>> getAllClassrooms() {
        List<ClassroomDTO> classrooms = classroomService.getAllClassrooms();
        return ResponseEntity.ok(classrooms);
    }

    // Endpoint for admins to get all students in a classroom
    @GetMapping("/classrooms/{id}/students")
    public ResponseEntity<List<UserSummaryDTO>> getStudentsInClassroom(@PathVariable Long id) {
        List<UserSummaryDTO> students = classroomService.getStudentsInClassroom(id);
        return ResponseEntity.ok(students);
    }

    // Endpoint for Admins to add a specific student to a classroom
    @PostMapping("/classrooms/{classroomId}/students/{studentId}")
    public ResponseEntity<ClassroomDTO> addStudentToClassroomByAdmin(
            @PathVariable Long classroomId,
            @PathVariable Long studentId) {
        ClassroomDTO updatedClassroom = classroomService.addStudentToClassroom(classroomId, studentId);
        return ResponseEntity.ok(updatedClassroom);
    }

    // Endpoint for admins to remove a student from a classroom
    @DeleteMapping("/classrooms/{classroomId}/students/{studentId}")
    public ResponseEntity<Void> removeStudentFromClassroom(
            @PathVariable Long classroomId,
            @PathVariable Long studentId) {
        classroomService.removeStudentFromClassroom(classroomId, studentId);
        return ResponseEntity.noContent().build();
    }

    // Endpoint for admins to delete a classroom
    // @DeleteMapping("/classrooms/{id}")
    // public ResponseEntity<Void> deleteClassroom(@PathVariable Long id) {
    // classroomService.deleteClassroom(id);
    // return ResponseEntity.noContent().build();
    // }

    // Endpoint for admins to get all users (students and teachers)
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // Endpoint for admins to update a user
    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        User updatedUser = userService.updateUserProfile(id, userDetails);
        return ResponseEntity.ok(updatedUser);
    }

    // Endpoint for admins to delete a user
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUserById(id);
        return ResponseEntity.noContent().build();
    }

    // Endpoint for admins to update a classroom
    @PutMapping("/classrooms/{id}")
    public ResponseEntity<ClassroomDTO> updateClassroom(@PathVariable Long id,
            @RequestBody ClassroomDTO classroomDetails) {
        ClassroomDTO updatedClassroom = classroomService.updateClassroom(id, classroomDetails);
        return ResponseEntity.ok(updatedClassroom);
    }

    // Endpoint for admins to delete a classroom by ID
    @DeleteMapping("/classrooms/{id}")
    public ResponseEntity<Void> deleteClassroomById(@PathVariable Long id) {
        classroomService.deleteClassroomById(id);
        return ResponseEntity.noContent().build();
    }
}