package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.Classroom;
import com.mathquest.demo.Model.StudentPerformance;
import com.mathquest.demo.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentPerformanceRepository extends JpaRepository<StudentPerformance, Long> {
        Optional<StudentPerformance> findByStudentAndClassroom(User student, Classroom classroom);

        List<StudentPerformance> findByStudent(User student);

        List<StudentPerformance> findByClassroomOrderByAverageQuizScoreDesc(Classroom classroom);

        @Query("SELECT sp FROM StudentPerformance sp WHERE sp.classroom = :classroom " +
                        "ORDER BY sp.averageQuizScore DESC LIMIT 10")
        List<StudentPerformance> findTopPerformersInClassroom(Classroom classroom);

        @Query("SELECT sp FROM StudentPerformance sp WHERE sp.classroom = :classroom " +
                        "ORDER BY sp.averageQuizScore ASC LIMIT 10")
        List<StudentPerformance> findStudentsNeedingAttentionInClassroom(Classroom classroom);

        @Query("SELECT AVG(sp.averageQuizScore) FROM StudentPerformance sp " +
                        "WHERE sp.classroom = :classroom")
        Double getClassroomAverageScore(Classroom classroom);

        List<StudentPerformance> findByClassroom(Classroom classroom);

        @Modifying
        @Query("DELETE FROM StudentPerformance sp WHERE sp.classroom.id = :classroomId")
        void deleteByClassroomId(Long classroomId);
}