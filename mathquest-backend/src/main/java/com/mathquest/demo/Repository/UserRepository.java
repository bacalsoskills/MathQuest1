package com.mathquest.demo.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.mathquest.demo.Model.ERole;
import com.mathquest.demo.Model.User;
import com.mathquest.demo.Model.Classroom;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
        Optional<User> findByUsername(String username);

        Optional<User> findByEmail(String email);

        Optional<User> findByVerificationToken(String token);

        Optional<User> findByPendingEmailToken(String token);

        Optional<User> findByResetPasswordToken(String token);

        Boolean existsByUsername(String username);

        Boolean existsByEmail(String email);

        // Find all users with a specific role
        List<User> findAllByRolesName(ERole roleName);

        // Find all students enrolled in a specific classroom
        @Query("SELECT cs.student FROM ClassroomStudent cs WHERE cs.classroom.id = :classroomId AND cs.isActive = true")
        List<User> findStudentsByClassroomId(@Param("classroomId") Long classroomId);

        // Find all students in a classroom with role STUDENT
        @Query("SELECT DISTINCT u FROM User u JOIN ClassroomStudent cs ON cs.student = u " +
                        "WHERE cs.classroom = :classroom AND cs.isActive = true " +
                        "AND EXISTS (SELECT r FROM u.roles r WHERE r.name = 'ROLE_STUDENT')")
        List<User> findByClassrooms(@Param("classroom") Classroom classroom);

        List<User> findAllByRolesNameAndIsDeletedFalse(ERole role);

        // Count students in a classroom with a specific role
        @Query("SELECT COUNT(DISTINCT u) FROM User u JOIN ClassroomStudent cs ON cs.student = u " +
                        "WHERE cs.classroom.id = :classroomId AND cs.isActive = true " +
                        "AND EXISTS (SELECT r FROM u.roles r WHERE r.name = :role)")
        long countByClassroomIdAndRole(@Param("classroomId") Long classroomId, @Param("role") ERole role);
}