package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.MultiplicationQuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MultiplicationQuizAttemptRepository extends JpaRepository<MultiplicationQuizAttempt, Long> {
    List<MultiplicationQuizAttempt> findByProgressId(Long progressId);
    List<MultiplicationQuizAttempt> findByProgressIdOrderByAttemptedAtDesc(Long progressId);
    
    @Query("SELECT q FROM MultiplicationQuizAttempt q WHERE q.progress.id = :progressId ORDER BY q.attemptedAt DESC")
    List<MultiplicationQuizAttempt> findRecentAttemptsByProgressId(@Param("progressId") Long progressId);
    
    List<MultiplicationQuizAttempt> findByProgressIdAndPropertyIndexAndStepIndex(Long progressId, Integer propertyIndex, Integer stepIndex);
}
