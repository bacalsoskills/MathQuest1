package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.Classroom;
import com.mathquest.demo.Model.Report;
import com.mathquest.demo.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByTeacherOrderByCreatedAtDesc(User teacher);

    List<Report> findByClassroomOrderByCreatedAtDesc(Classroom classroom);

    List<Report> findByTeacherAndClassroomOrderByCreatedAtDesc(User teacher, Classroom classroom);

    List<Report> findByReportTypeOrderByCreatedAtDesc(String reportType);

    @Modifying
    @Query("DELETE FROM Report r WHERE r.classroom.id = :classroomId")
    void deleteByClassroomId(Long classroomId);
}