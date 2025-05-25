package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.Quiz;
import com.mathquest.demo.Model.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {
    List<QuizQuestion> findByQuizOrderByQuestionNumber(Quiz quiz);

    List<QuizQuestion> findByQuizIdOrderByQuestionNumber(Long quizId);
}