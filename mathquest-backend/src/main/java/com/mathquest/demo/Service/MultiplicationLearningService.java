package com.mathquest.demo.Service;

import com.mathquest.demo.DTO.*;
import com.mathquest.demo.Model.MultiplicationLearningProgress;
import com.mathquest.demo.Model.MultiplicationPropertyCompletion;
import com.mathquest.demo.Model.MultiplicationQuizAttempt;
import com.mathquest.demo.Model.User;
import com.mathquest.demo.Repository.MultiplicationLearningProgressRepository;
import com.mathquest.demo.Repository.MultiplicationPropertyCompletionRepository;
import com.mathquest.demo.Repository.MultiplicationQuizAttemptRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class MultiplicationLearningService {

    @Autowired
    private MultiplicationLearningProgressRepository progressRepository;

    @Autowired
    private MultiplicationPropertyCompletionRepository propertyCompletionRepository;

    @Autowired
    private MultiplicationQuizAttemptRepository quizAttemptRepository;

    @Autowired
    private ObjectMapper objectMapper;

    public MultiplicationLearningProgressDTO getProgress(User user) {
        Optional<MultiplicationLearningProgress> progressOpt = progressRepository.findByUser(user);
        
        if (progressOpt.isEmpty()) {
            // Create new progress for user
            MultiplicationLearningProgress newProgress = new MultiplicationLearningProgress(user);
            newProgress = progressRepository.save(newProgress);
            return convertToDTO(newProgress);
        }
        
        return convertToDTO(progressOpt.get());
    }

    public MultiplicationLearningProgressDTO saveProgress(User user, SaveProgressRequest request) {
        Optional<MultiplicationLearningProgress> progressOpt = progressRepository.findByUser(user);
        
        MultiplicationLearningProgress progress;
        if (progressOpt.isEmpty()) {
            progress = new MultiplicationLearningProgress(user);
        } else {
            progress = progressOpt.get();
        }

        try {
            progress.setCompletedProperties(objectMapper.writeValueAsString(request.getCompletedProperties()));
            progress.setActivePropertyIndex(request.getActivePropertyIndex());
            progress.setTotalPropertiesCompleted(request.getTotalPropertiesCompleted());
            
            progress = progressRepository.save(progress);
            return convertToDTO(progress);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error saving progress", e);
        }
    }

    public MultiplicationLearningProgressDTO completeProperty(User user, CompletePropertyRequest request) {
        Optional<MultiplicationLearningProgress> progressOpt = progressRepository.findByUser(user);
        
        MultiplicationLearningProgress progress;
        if (progressOpt.isEmpty()) {
            progress = new MultiplicationLearningProgress(user);
        } else {
            progress = progressOpt.get();
        }

        try {
            // Update completed properties
            List<Integer> completedProperties = getCompletedPropertiesList(progress);
            if (!completedProperties.contains(request.getPropertyIndex())) {
                completedProperties.add(request.getPropertyIndex());
                progress.setCompletedProperties(objectMapper.writeValueAsString(completedProperties));
            }

            // Update active property index
            if (request.getPropertyIndex() + 1 < 5) {
                progress.setActivePropertyIndex(request.getPropertyIndex() + 1);
            }

            // Update total completed
            progress.setTotalPropertiesCompleted(completedProperties.size());

            progress = progressRepository.save(progress);

            // Save property completion record
            MultiplicationPropertyCompletion completion = new MultiplicationPropertyCompletion(
                progress,
                request.getPropertyIndex(),
                request.getPropertyName(),
                request.getBadgeName(),
                request.getTotalSteps()
            );
            completion.setCompletionTimeSeconds(request.getCompletionTimeSeconds());
            propertyCompletionRepository.save(completion);

            return convertToDTO(progress);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error completing property", e);
        }
    }

    public MultiplicationQuizAttemptDTO saveQuizAttempt(User user, SaveQuizAttemptRequest request) {
        Optional<MultiplicationLearningProgress> progressOpt = progressRepository.findByUser(user);
        
        MultiplicationLearningProgress progress;
        if (progressOpt.isEmpty()) {
            progress = new MultiplicationLearningProgress(user);
            progress = progressRepository.save(progress);
        } else {
            progress = progressOpt.get();
        }

        MultiplicationQuizAttempt attempt = new MultiplicationQuizAttempt(
            progress,
            request.getPropertyIndex(),
            request.getStepIndex(),
            request.getQuestion(),
            request.getUserAnswer(),
            request.getCorrectAnswer(),
            request.getIsCorrect(),
            request.getStepType(),
            request.getStepTitle()
        );

        attempt = quizAttemptRepository.save(attempt);
        return convertToDTO(attempt);
    }

    public List<MultiplicationQuizAttemptDTO> getQuizAttempts(User user, Integer propertyIndex, Integer stepIndex) {
        Optional<MultiplicationLearningProgress> progressOpt = progressRepository.findByUser(user);
        
        if (progressOpt.isEmpty()) {
            return new ArrayList<>();
        }

        List<MultiplicationQuizAttempt> attempts = quizAttemptRepository
            .findByProgressIdAndPropertyIndexAndStepIndex(progressOpt.get().getId(), propertyIndex, stepIndex);
        
        return attempts.stream().map(this::convertToDTO).toList();
    }

    public List<MultiplicationPropertyCompletionDTO> getPropertyCompletions(User user) {
        Optional<MultiplicationLearningProgress> progressOpt = progressRepository.findByUser(user);
        
        if (progressOpt.isEmpty()) {
            return new ArrayList<>();
        }

        List<MultiplicationPropertyCompletion> completions = propertyCompletionRepository
            .findByProgressId(progressOpt.get().getId());
        
        return completions.stream().map(this::convertToDTO).toList();
    }

    private List<Integer> getCompletedPropertiesList(MultiplicationLearningProgress progress) {
        try {
            if (progress.getCompletedProperties() == null || progress.getCompletedProperties().isEmpty()) {
                return new ArrayList<>();
            }
            return objectMapper.readValue(progress.getCompletedProperties(), new TypeReference<List<Integer>>() {});
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }

    private MultiplicationLearningProgressDTO convertToDTO(MultiplicationLearningProgress progress) {
        MultiplicationLearningProgressDTO dto = new MultiplicationLearningProgressDTO();
        dto.setId(progress.getId());
        dto.setUserId(progress.getUser().getId());
        dto.setUsername(progress.getUser().getUsername());
        dto.setCompletedProperties(getCompletedPropertiesList(progress));
        dto.setActivePropertyIndex(progress.getActivePropertyIndex());
        dto.setTotalPropertiesCompleted(progress.getTotalPropertiesCompleted());
        dto.setLastUpdated(progress.getLastUpdated());
        dto.setCreatedAt(progress.getCreatedAt());

        // Get recent quiz attempts (last 10)
        List<MultiplicationQuizAttempt> recentAttempts = quizAttemptRepository
            .findRecentAttemptsByProgressId(progress.getId());
        dto.setRecentQuizAttempts(recentAttempts.stream()
            .limit(10)
            .map(this::convertToDTO)
            .toList());

        // Get property completions
        List<MultiplicationPropertyCompletion> completions = propertyCompletionRepository
            .findByProgressId(progress.getId());
        dto.setPropertyCompletions(completions.stream()
            .map(this::convertToDTO)
            .toList());

        return dto;
    }

    private MultiplicationPropertyCompletionDTO convertToDTO(MultiplicationPropertyCompletion completion) {
        MultiplicationPropertyCompletionDTO dto = new MultiplicationPropertyCompletionDTO();
        dto.setId(completion.getId());
        dto.setPropertyIndex(completion.getPropertyIndex());
        dto.setPropertyName(completion.getPropertyName());
        dto.setBadgeName(completion.getBadgeName());
        dto.setCompletedAt(completion.getCompletedAt());
        dto.setTotalSteps(completion.getTotalSteps());
        dto.setCompletionTimeSeconds(completion.getCompletionTimeSeconds());
        return dto;
    }

    private MultiplicationQuizAttemptDTO convertToDTO(MultiplicationQuizAttempt attempt) {
        MultiplicationQuizAttemptDTO dto = new MultiplicationQuizAttemptDTO();
        dto.setId(attempt.getId());
        dto.setPropertyIndex(attempt.getPropertyIndex());
        dto.setStepIndex(attempt.getStepIndex());
        dto.setQuestion(attempt.getQuestion());
        dto.setUserAnswer(attempt.getUserAnswer());
        dto.setCorrectAnswer(attempt.getCorrectAnswer());
        dto.setIsCorrect(attempt.getIsCorrect());
        dto.setStepType(attempt.getStepType());
        dto.setStepTitle(attempt.getStepTitle());
        dto.setAttemptedAt(attempt.getAttemptedAt());
        return dto;
    }
}
