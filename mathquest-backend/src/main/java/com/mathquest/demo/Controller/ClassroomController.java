package com.mathquest.demo.Controller;

import com.mathquest.demo.DTO.ClassroomDTO;
import com.mathquest.demo.DTO.CreateClassroomRequest;
import com.mathquest.demo.DTO.JoinClassroomRequest;
import com.mathquest.demo.DTO.UserSummaryDTO;
import com.mathquest.demo.Model.User;
import com.mathquest.demo.Repository.UserRepository;
import com.mathquest.demo.Security.services.UserDetailsImpl;
import com.mathquest.demo.Service.ClassroomService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = { "Authorization", "Content-Type",
        "Accept" }, methods = { RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
                RequestMethod.DELETE, RequestMethod.OPTIONS })
@RestController
@RequestMapping("/classrooms")
public class ClassroomController {

    @Autowired
    private ClassroomService classroomService;

    @Autowired
    private UserRepository userRepository;

    // Endpoint for teachers to create a classroom
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ClassroomDTO> createClassroom(@Valid @ModelAttribute CreateClassroomRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        ClassroomDTO createdClassroom = classroomService.createClassroom(request, currentUser);
        return new ResponseEntity<>(createdClassroom, HttpStatus.CREATED);
    }

    // Endpoint for students to join a classroom
    @PostMapping("/join")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ClassroomDTO> joinClassroom(@Valid @RequestBody JoinClassroomRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        ClassroomDTO joinedClassroom = classroomService.joinClassroom(request.getClassCode(), currentUser);
        return ResponseEntity.ok(joinedClassroom);
    }

    // Endpoint to get a specific classroom by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ClassroomDTO> getClassroomById(@PathVariable Long id) {
        ClassroomDTO classroom = classroomService.getClassroomById(id);
        return ResponseEntity.ok(classroom);
    }

    // Endpoint to get a classroom by code
    @GetMapping("/code/{classCode}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ClassroomDTO> getClassroomByCode(@PathVariable String classCode) {
        ClassroomDTO classroom = classroomService.getClassroomByCode(classCode);
        return ResponseEntity.ok(classroom);
    }

    // Endpoint for teachers to get their classrooms
    @GetMapping("/teacher")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<ClassroomDTO>> getTeacherClassrooms() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        List<ClassroomDTO> classrooms = classroomService.getClassroomsByTeacher(currentUser);
        return ResponseEntity.ok(classrooms);
    }

    // Endpoint for students to get their enrolled classrooms
    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<ClassroomDTO>> getStudentClassrooms() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        List<ClassroomDTO> classrooms = classroomService.getClassroomsByStudent(currentUser);
        return ResponseEntity.ok(classrooms);
    }

    // Endpoint to get all students in a classroom
    @GetMapping("/{id}/students")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<List<UserSummaryDTO>> getStudentsInClassroom(@PathVariable Long id) {
        List<UserSummaryDTO> students = classroomService.getStudentsInClassroom(id);
        return ResponseEntity.ok(students);
    }

    // Endpoint to get the total number of students in a classroom
    @GetMapping("/{id}/students/count")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<Map<String, Integer>> getStudentCount(@PathVariable Long id) {
        int count = classroomService.getStudentCountInClassroom(id);
        return ResponseEntity.ok(Map.of("count", count));
    }

    // Endpoint to search for students by name or username
    @GetMapping("/students/search")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<List<UserSummaryDTO>> searchStudents(
            @RequestParam String searchTerm,
            @RequestParam(required = false) Long classroomId) {

        List<UserSummaryDTO> students = classroomService.searchStudents(searchTerm, classroomId);
        return ResponseEntity.ok(students);
    }

    // Endpoint for Teachers to add a specific student to a classroom
    @PostMapping("/{classroomId}/students/{studentId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ClassroomDTO> addStudentToClassroom(
            @PathVariable Long classroomId,
            @PathVariable Long studentId) {
        ClassroomDTO updatedClassroom = classroomService.addStudentToClassroom(classroomId, studentId);
        return ResponseEntity.ok(updatedClassroom);
    }

    // Endpoint for students to leave a classroom
    @DeleteMapping("/{classroomId}/leave")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> leaveClassroom(@PathVariable Long classroomId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        classroomService.leaveClassroom(classroomId, currentUser);
        return ResponseEntity.noContent().build();
    }

    // Endpoint for teachers to remove a student from a classroom
    @DeleteMapping("/{classroomId}/students/{studentId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> removeStudentFromClassroom(
            @PathVariable Long classroomId,
            @PathVariable Long studentId) {
        classroomService.removeStudentFromClassroom(classroomId, studentId);
        return ResponseEntity.noContent().build();
    }

    // Endpoint for teachers to delete a classroom
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<Void> deleteClassroom(@PathVariable Long id) {
        classroomService.deleteClassroom(id);
        return ResponseEntity.noContent().build();
    }

    // Endpoint for teachers to update a classroom
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ClassroomDTO> updateClassroom(
            @PathVariable Long id,
            @ModelAttribute CreateClassroomRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        // Only allow updates if the teacher owns the classroom
        ClassroomDTO existingClassroom = classroomService.getClassroomById(id);
        if (!existingClassroom.getTeacher().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Create a DTO for updating
        ClassroomDTO classroomDetails = new ClassroomDTO();
        classroomDetails.setName(request.getName());
        classroomDetails.setDescription(request.getDescription());
        classroomDetails.setShortCode(request.getShortCode());

        // The service method will handle image conversion
        ClassroomDTO updatedClassroom = classroomService.updateClassroom(id, classroomDetails, request.getImage());
        return ResponseEntity.ok(updatedClassroom);
    }
}