package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.MultiplicationPropertyCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MultiplicationPropertyCompletionRepository extends JpaRepository<MultiplicationPropertyCompletion, Long> {
    List<MultiplicationPropertyCompletion> findByProgressId(Long progressId);
    boolean existsByProgressIdAndPropertyIndex(Long progressId, Integer propertyIndex);
}
