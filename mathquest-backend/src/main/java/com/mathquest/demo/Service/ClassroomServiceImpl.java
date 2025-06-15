package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.ClassroomDTO;
import com.mathquest.demo.DTO.CreateClassroomRequest;
import com.mathquest.demo.DTO.UserSummaryDTO;
import com.mathquest.demo.Model.*;
import com.mathquest.demo.Repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ClassroomServiceImpl implements ClassroomService {

    private static final Logger logger = LoggerFactory.getLogger(ClassroomServiceImpl.class);

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClassroomStudentRepository classroomStudentRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private LeaderboardEntryRepository leaderboardEntryRepository;

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private StudentPerformanceRepository studentPerformanceRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Override
    @Transactional
    public ClassroomDTO createClassroom(CreateClassroomRequest request, User teacher) {
        String classCode = generateUniqueClassCode();
        String shortCode = request.getShortCode();

        // Check if shortCode is provided and validate it
        if (shortCode != null && !shortCode.isEmpty()) {
            // Check if the shortCode is already taken
            if (classroomRepository.existsByShortCode(shortCode)) {
                throw new IllegalArgumentException(
                        "Short code '" + shortCode + "' is already taken. Please choose a different short code.");
            }
        } else {
            // Only auto-generate if not provided
            shortCode = generateShortCode(request.getName());
            // Ensure the generated shortCode is unique
            while (classroomRepository.existsByShortCode(shortCode)) {
                logger.warn("Generated short code {} already exists, generating a new one", shortCode);
                shortCode = generateShortCode(request.getName());
            }
        }

        // Double-check to ensure the class code is unique
        while (classroomRepository.existsByClassCode(classCode)) {
            logger.warn("Generated class code {} already exists, generating a new one", classCode);
            classCode = generateUniqueClassCode();
        }

        Classroom classroom = new Classroom();
        classroom.setName(request.getName());
        classroom.setDescription(request.getDescription());
        classroom.setClassCode(classCode);
        classroom.setShortCode(shortCode);

        // If teacher is provided, use it; otherwise, find the teacher by ID from the
        // request
        if (teacher != null) {
            classroom.setTeacher(teacher);
        } else {
            // For admin creating a classroom, find the teacher by ID
            User selectedTeacher = userRepository.findById(request.getTeacherId())
                    .orElseThrow(
                            () -> new EntityNotFoundException("Teacher not found with id: " + request.getTeacherId()));
            classroom.setTeacher(selectedTeacher);
        }

        // Handle image upload if provided
        if (request.getImage() != null && !request.getImage().isEmpty()) {
            try {
                classroom.setImage(request.getImage().getBytes());
            } catch (IOException e) {
                logger.error("Failed to process image upload: {}", e.getMessage(), e);
                throw new RuntimeException("Failed to process image upload: " + e.getMessage());
            }
        }

        try {
            Classroom savedClassroom = classroomRepository.save(classroom);
            logger.info("Classroom saved with ID: {}, image present: {}",
                    savedClassroom.getId(), savedClassroom.getImage() != null);

            return convertToDTO(savedClassroom);
        } catch (Exception e) {
            logger.error("Error saving classroom: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save classroom: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public ClassroomDTO joinClassroom(String classCode, User student) {
        Classroom classroom = classroomRepository.findByClassCode(classCode)
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found with code: " + classCode));

        // Check if student has any previous enrollment (active or inactive)
        Optional<ClassroomStudent> existingEnrollmentOpt = classroomStudentRepository
                .findByClassroomAndStudent(classroom, student);

        if (existingEnrollmentOpt.isPresent()) {
            ClassroomStudent existingEnrollment = existingEnrollmentOpt.get();
            if (existingEnrollment.isActive()) {
                throw new IllegalStateException("Student is already actively enrolled in this classroom");
            } else {
                // Re-activate the enrollment if they are re-joining
                existingEnrollment.setActive(true);
                existingEnrollment.setJoinedAt(java.time.LocalDateTime.now()); // Optionally update joinedAt
                classroomStudentRepository.save(existingEnrollment);
            }
        } else {
            // Create a new enrollment if none exists
            ClassroomStudent classroomStudent = new ClassroomStudent(classroom, student);
            // isActive defaults to true in the constructor
            classroomStudentRepository.save(classroomStudent);
        }

        // Fetch the classroom again or ensure the DTO conversion reflects the current
        // state
        return convertToDTO(classroom);
    }

    @Override
    @Transactional(readOnly = true)
    public ClassroomDTO getClassroomById(Long id) {
        Classroom classroom = classroomRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found with id: " + id));

        return convertToDTO(classroom);
    }

    @Override
    @Transactional(readOnly = true)
    public ClassroomDTO getClassroomByCode(String classCode) {
        Classroom classroom = classroomRepository.findByClassCode(classCode)
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found with code: " + classCode));

        return convertToDTO(classroom);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassroomDTO> getClassroomsByTeacher(User teacher) {
        List<Classroom> classrooms = classroomRepository.findByTeacher(teacher);
        return classrooms.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassroomDTO> getClassroomsByStudent(User student) {
        // Find only active enrollments
        List<ClassroomStudent> enrollments = classroomStudentRepository.findByStudentAndIsActiveTrue(student);
        return enrollments.stream()
                .map(ClassroomStudent::getClassroom)
                .map(this::convertToDTO) // convertToDTO will handle filtering active students within the DTO
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSummaryDTO> getStudentsInClassroom(Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found with id: " + classroomId));

        // Find only active students for this classroom
        List<ClassroomStudent> enrollments = classroomStudentRepository.findByClassroomAndIsActiveTrue(classroom);
        return enrollments.stream()
                .map(ClassroomStudent::getStudent)
                .map(this::convertToUserSummaryDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public int getStudentCountInClassroom(Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found with id: " + classroomId));

        // Count only active enrollments
        return (int) classroomStudentRepository.findByClassroomAndIsActiveTrue(classroom).size();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSummaryDTO> searchStudents(String searchTerm, Long classroomId) {
        // Get all students with ROLE_STUDENT and not deleted
        List<User> allStudents = userRepository
                .findAllByRolesNameAndIsDeletedFalse(com.mathquest.demo.Model.ERole.ROLE_STUDENT);

        // If classroomId is provided, get the classroom and its students
        List<User> studentsInClassroom = new ArrayList<>();

        if (classroomId != null) {
            Classroom classroom = classroomRepository.findById(classroomId)
                    .orElseThrow(() -> new EntityNotFoundException("Classroom not found with id: " + classroomId));

            studentsInClassroom = classroomStudentRepository.findByClassroomAndIsActiveTrue(classroom)
                    .stream()
                    .map(ClassroomStudent::getStudent)
                    .collect(Collectors.toList());
        }

        // Create a final copy of the list for use in the lambda
        final List<User> finalStudentsInClassroom = studentsInClassroom;

        // Filter students matching the search term and mark if they're in the classroom
        return allStudents.stream()
                .filter(student -> matchesSearchTerm(student, searchTerm))
                .map(student -> {
                    UserSummaryDTO dto = convertToUserSummaryDTO(student);
                    if (classroomId != null) {
                        dto.setInClassroom(finalStudentsInClassroom.contains(student));
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // Helper method to check if a student matches the search term
    private boolean matchesSearchTerm(User student, String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return true; // Return all if no search term
        }

        String lowercaseSearchTerm = searchTerm.toLowerCase().trim();

        // Match by username
        if (student.getUsername().toLowerCase().contains(lowercaseSearchTerm)) {
            return true;
        }

        // Match by first name
        if (student.getFirstName().toLowerCase().contains(lowercaseSearchTerm)) {
            return true;
        }

        // Match by last name
        if (student.getLastName().toLowerCase().contains(lowercaseSearchTerm)) {
            return true;
        }

        // Match by full name (first + last)
        String fullName = (student.getFirstName() + " " + student.getLastName()).toLowerCase();
        return fullName.contains(lowercaseSearchTerm);
    }

    @Override
    @Transactional
    public void removeStudentFromClassroom(Long classroomId, Long studentId) {
        // This method (for Teacher/Admin) now also performs a soft delete
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found with id: " + classroomId));

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student not found with id: " + studentId));

        // Find the active enrollment to mark as inactive
        ClassroomStudent enrollment = classroomStudentRepository
                .findByClassroomAndStudentAndIsActiveTrue(classroom, student)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Active enrollment not found for this student in this classroom"));

        enrollment.setActive(false);
        classroomStudentRepository.save(enrollment);
    }

    @Override
    @Transactional
    public void leaveClassroom(Long classroomId, User student) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found with id: " + classroomId));

        // Find the active enrollment for the current student
        ClassroomStudent enrollment = classroomStudentRepository
                .findByClassroomAndStudentAndIsActiveTrue(classroom, student)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Active enrollment not found for this student in this classroom"));

        enrollment.setActive(false);
        classroomStudentRepository.save(enrollment);
    }

    @Override
    @Transactional
    public void deleteClassroom(Long classroomId) {
        logger.info("Attempting to delete classroom with ID: {}", classroomId);
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> {
                    logger.error("Classroom not found for deletion with ID: {}", classroomId);
                    return new EntityNotFoundException("Classroom not found with id: " + classroomId);
                });

        try {
            // 1. First, delete all quiz attempts for this classroom
            List<Quiz> quizzes = quizRepository.findByActivity_Classroom(classroom);
            for (Quiz quiz : quizzes) {
                // Delete leaderboard entries for this quiz
                leaderboardEntryRepository.deleteByQuiz(quiz);
                // Delete quiz attempts for this quiz
                quizAttemptRepository.deleteByQuiz(quiz);
            }

            // 2. Delete all quizzes
            quizRepository.deleteAll(quizzes);

            // 3. Delete all games for this classroom
            List<Game> games = gameRepository.findByActivityClassroomId(classroomId);
            gameRepository.deleteAll(games);

            // 4. Delete all activities
            activityRepository.deleteByClassroomId(classroomId);

            // 5. Delete all lessons for this classroom
            List<Lesson> lessons = lessonRepository.findByClassroom(classroom);
            lessonRepository.deleteAll(lessons);

            // 6. Delete all reports for this classroom
            reportRepository.deleteByClassroomId(classroomId);

            // 7. Delete all student enrollments
            List<ClassroomStudent> enrollments = classroomStudentRepository.findAllByClassroom(classroom);
            if (!enrollments.isEmpty()) {
                classroomStudentRepository.deleteAllInBatch(enrollments);
            }

            // 8. Delete all student performance records
            studentPerformanceRepository.deleteByClassroomId(classroomId);

            // 9. Finally, delete the classroom itself
            classroomRepository.delete(classroom);
            logger.info("Successfully deleted classroom with ID: {}", classroomId);
        } catch (Exception e) {
            logger.error("Error occurred while deleting classroom with ID: {}: {}", classroomId, e.getMessage(), e);
            throw new RuntimeException("Could not delete classroom with ID: " + classroomId, e);
        }
    }

    @Override
    @Transactional
    public ClassroomDTO addStudentToClassroom(Long classroomId, Long studentId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found with id: " + classroomId));

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student not found with id: " + studentId));

        // Optional: Check if the user being added actually has the STUDENT role
        boolean isStudentRole = student.getRoles().stream()
                .anyMatch(role -> role.getName().equals(com.mathquest.demo.Model.ERole.ROLE_STUDENT));
        if (!isStudentRole) {
            throw new IllegalArgumentException("User with id " + studentId + " is not a student.");
        }

        // Check if an enrollment record exists (active or inactive)
        Optional<ClassroomStudent> existingEnrollmentOpt = classroomStudentRepository
                .findByClassroomAndStudent(classroom, student);

        if (existingEnrollmentOpt.isPresent()) {
            ClassroomStudent existingEnrollment = existingEnrollmentOpt.get();
            if (existingEnrollment.isActive()) {
                // Student is already actively enrolled
                String studentName = student.getFirstName() + " " + student.getLastName();
                throw new IllegalStateException("Student " + studentName + " is already added in this classroom");
            } else {
                // Re-activate the enrollment if they were previously removed/left
                existingEnrollment.setActive(true);
                existingEnrollment.setJoinedAt(java.time.LocalDateTime.now()); // Update joined time
                classroomStudentRepository.save(existingEnrollment);
            }
        } else {
            // Create a new enrollment if none exists
            ClassroomStudent classroomStudent = new ClassroomStudent(classroom, student);
            classroomStudentRepository.save(classroomStudent);
        }

        return convertToDTO(classroom);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassroomDTO> getAllClassrooms() {
        List<Classroom> classrooms = classroomRepository.findAll();
        return classrooms.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ClassroomDTO updateClassroom(Long classroomId, ClassroomDTO classroomDetails) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found with id: " + classroomId));

        // Update fields if provided
        if (classroomDetails.getName() != null) {
            classroom.setName(classroomDetails.getName());
        }
        if (classroomDetails.getDescription() != null) {
            classroom.setDescription(classroomDetails.getDescription());
        }
        if (classroomDetails.getClassCode() != null) {
            classroom.setClassCode(classroomDetails.getClassCode());
        }
        if (classroomDetails.getShortCode() != null) {
            classroom.setShortCode(classroomDetails.getShortCode());
        }
        if (classroomDetails.getTeacherId() != null) {
            User newTeacher = userRepository.findById(classroomDetails.getTeacherId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Teacher not found with id: " + classroomDetails.getTeacherId()));
            classroom.setTeacher(newTeacher);
        }

        Classroom updatedClassroom = classroomRepository.save(classroom);
        return convertToDTO(updatedClassroom);
    }

    @Override
    @Transactional
    public ClassroomDTO updateClassroom(Long classroomId, ClassroomDTO classroomDetails, MultipartFile image) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new EntityNotFoundException("Classroom not found with id: " + classroomId));

        // Update fields if provided
        if (classroomDetails.getName() != null) {
            classroom.setName(classroomDetails.getName());
        }
        if (classroomDetails.getDescription() != null) {
            classroom.setDescription(classroomDetails.getDescription());
        }
        if (classroomDetails.getClassCode() != null) {
            classroom.setClassCode(classroomDetails.getClassCode());
        }
        if (classroomDetails.getShortCode() != null) {
            classroom.setShortCode(classroomDetails.getShortCode());
        }

        // Handle image update if provided and not empty
        if (image != null && !image.isEmpty()) {
            try {
                byte[] imageData = image.getBytes();
                // Log image size
                logger.info("Image uploaded with size: {} bytes for classroom update: {}",
                        imageData.length, classroom.getName());

                // Check if the image is too large (over 5MB)
                if (imageData.length > 5 * 1024 * 1024) {
                    logger.warn("Image is too large ({}MB), consider compressing images before upload",
                            imageData.length / (1024 * 1024));
                }

                classroom.setImage(imageData);
            } catch (IOException e) {
                logger.error("Failed to process image upload: {}", e.getMessage(), e);
                throw new RuntimeException("Failed to process image upload: " + e.getMessage());
            }
        }

        Classroom updatedClassroom = classroomRepository.save(classroom);
        return convertToDTO(updatedClassroom);
    }

    @Override
    @Transactional
    public void deleteClassroomById(Long classroomId) {
        logger.info("Attempting to delete classroom with ID: {}", classroomId);
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> {
                    logger.error("Classroom not found for deletion with ID: {}", classroomId);
                    return new EntityNotFoundException("Classroom not found with id: " + classroomId);
                });

        try {
            // First, delete all student enrollments for this classroom
            List<ClassroomStudent> enrollments = classroomStudentRepository.findAllByClassroom(classroom);
            if (!enrollments.isEmpty()) {
                logger.debug("Deleting {} associated student enrollments for classroom ID: {}", enrollments.size(),
                        classroomId);
                classroomStudentRepository.deleteAllInBatch(enrollments);
            }

            // Now delete the classroom
            classroomRepository.delete(classroom);
            logger.info("Successfully deleted classroom with ID: {}", classroomId);
        } catch (Exception e) {
            logger.error("Error occurred while deleting classroom with ID: {}: {}", classroomId, e.getMessage(), e);
            throw new RuntimeException("Could not delete classroom with ID: " + classroomId, e);
        }
    }

    private String generateUniqueClassCode() {
        Random random = new Random();
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        int codeLength = 6;

        String classCode;
        do {
            StringBuilder codeBuilder = new StringBuilder(codeLength);
            for (int i = 0; i < codeLength; i++) {
                codeBuilder.append(chars.charAt(random.nextInt(chars.length())));
            }
            classCode = codeBuilder.toString();
        } while (classroomRepository.existsByClassCode(classCode));

        return classCode;
    }

    private String generateShortCode(String name) {
        Random random = new Random();
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        int codeLength = 6;

        StringBuilder codeBuilder = new StringBuilder(codeLength);
        for (int i = 0; i < codeLength; i++) {
            codeBuilder.append(chars.charAt(random.nextInt(chars.length())));
        }
        return codeBuilder.toString();
    }

    private ClassroomDTO convertToDTO(Classroom classroom) {
        ClassroomDTO dto = new ClassroomDTO();
        dto.setId(classroom.getId());
        dto.setName(classroom.getName());
        dto.setDescription(classroom.getDescription());
        dto.setClassCode(classroom.getClassCode());
        dto.setShortCode(classroom.getShortCode());
        dto.setImage(classroom.getImage());
        dto.setCreatedDate(classroom.getCreatedDate());

        UserSummaryDTO teacherDTO = convertToUserSummaryDTO(classroom.getTeacher());
        dto.setTeacher(teacherDTO);
        dto.setTeacherId(classroom.getTeacher().getId());

        // Only include active students in the DTO
        Set<UserSummaryDTO> studentDTOs = classroom.getStudents().stream()
                .filter(ClassroomStudent::isActive) // Filter for active students only
                .map(ClassroomStudent::getStudent)
                .map(this::convertToUserSummaryDTO)
                .collect(Collectors.toSet());
        dto.setStudents(studentDTOs);

        return dto;
    }

    private UserSummaryDTO convertToUserSummaryDTO(User user) {
        return new UserSummaryDTO(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getUsername(),
                user.getEmail());
    }
}