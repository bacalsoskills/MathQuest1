package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.Classroom;
import com.mathquest.demo.Model.ClassroomStudent;
import com.mathquest.demo.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassroomStudentRepository extends JpaRepository<ClassroomStudent, Long> {
    List<ClassroomStudent> findByStudentAndIsActiveTrue(User student);

    List<ClassroomStudent> findByClassroomAndIsActiveTrue(Classroom classroom);

    Optional<ClassroomStudent> findByClassroomAndStudent(Classroom classroom, User student);

    Optional<ClassroomStudent> findByClassroomAndStudentAndIsActiveTrue(Classroom classroom, User student);

    @Query("SELECT cs FROM ClassroomStudent cs WHERE cs.classroom.id = :classroomId AND cs.student.id = :studentId")
    Optional<ClassroomStudent> findByClassroomIdAndStudentId(@Param("classroomId") Long classroomId,
            @Param("studentId") Long studentId);

    boolean existsByClassroomAndStudentAndIsActiveTrue(Classroom classroom, User student);

    // Find ALL enrollments (active or inactive) for a classroom - used for deletion
    // cascade
    List<ClassroomStudent> findAllByClassroom(Classroom classroom);
}