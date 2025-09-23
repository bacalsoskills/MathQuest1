package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.MultiplicationLearningProgress;
import com.mathquest.demo.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MultiplicationLearningProgressRepository extends JpaRepository<MultiplicationLearningProgress, Long> {
    Optional<MultiplicationLearningProgress> findByUser(User user);
    Optional<MultiplicationLearningProgress> findByUserId(Long userId);
    boolean existsByUser(User user);
    boolean existsByUserId(Long userId);
}
