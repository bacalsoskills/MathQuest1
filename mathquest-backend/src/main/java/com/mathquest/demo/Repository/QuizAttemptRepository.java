package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.Quiz;
import com.mathquest.demo.Model.QuizAttempt;
import com.mathquest.demo.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByStudentOrderByCreatedAtDesc(User student);

    List<QuizAttempt> findByQuizOrderByScoreDesc(Quiz quiz);

    List<QuizAttempt> findByQuizAndStudentOrderByAttemptNumberDesc(Quiz quiz, User student);

    Optional<QuizAttempt> findTopByQuizAndStudentOrderByScoreDesc(Quiz quiz, User student);

    @Query("SELECT COUNT(qa) FROM QuizAttempt qa WHERE qa.quiz = :quiz AND qa.student = :student")
    int countAttemptsByQuizAndStudent(Quiz quiz, User student);

    @Query("SELECT qa FROM QuizAttempt qa WHERE qa.quiz = :quiz ORDER BY qa.score DESC, qa.timeSpentSeconds ASC LIMIT 10")
    List<QuizAttempt> findTop10ByQuizOrderByScoreDescTimeSpentAsc(Quiz quiz);

    @Query("SELECT qa FROM QuizAttempt qa WHERE qa.quiz.activity.classroom.id = :classroomId " +
            "ORDER BY qa.score DESC, qa.timeSpentSeconds ASC LIMIT 10")
    List<QuizAttempt> findTop10ByClassroomIdOrderByScoreDescTimeSpentAsc(Long classroomId);

    List<QuizAttempt> findByQuizIn(List<Quiz> quizzes);

    @Query("SELECT qa FROM QuizAttempt qa WHERE qa.quiz.activity.classroom.id = :classroomId")
    List<QuizAttempt> findByClassroomId(Long classroomId);
}