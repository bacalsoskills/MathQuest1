import api from './api';
import logger from './logger';

class MultiplicationLearningService {
  // Get user's multiplication learning progress
  async loadProgress() {
    try {
      const response = await api.get('/api/multiplication-learning/progress');
      return response.data;
    } catch (error) {
      logger.error('Error loading multiplication learning progress', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        url: error?.config?.url,
        method: error?.config?.method,
      });
      throw error;
    }
  }

  // Save user's progress
  async saveProgress(progressData) {
    try {
      const response = await api.post('/api/multiplication-learning/progress', progressData);
      return response.data;
    } catch (error) {
      logger.error('Error saving multiplication learning progress', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        url: error?.config?.url,
        method: error?.config?.method,
        payload: progressData,
      });
      throw error;
    }
  }

  // Complete a property
  async completeProperty(propertyIndex, propertyData) {
    try {
      const response = await api.post('/api/multiplication-learning/complete-property', {
        propertyIndex,
        ...propertyData
      });
      return response.data;
    } catch (error) {
      logger.error('Error completing property', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        url: error?.config?.url,
        method: error?.config?.method,
        payload: { propertyIndex, ...propertyData },
      });
      throw error;
    }
  }

  // Save quiz attempt
  async saveQuizAttempt(propertyIndex, stepIndex, quizData) {
    try {
      const response = await api.post('/api/multiplication-learning/quiz-attempt', {
        propertyIndex,
        stepIndex,
        ...quizData
      });
      return response.data;
    } catch (error) {
      logger.error('Error saving quiz attempt', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        url: error?.config?.url,
        method: error?.config?.method,
        payload: { propertyIndex, stepIndex, ...quizData },
      });
      throw error;
    }
  }

  // Get quiz attempts
  async getQuizAttempts(propertyIndex = null, stepIndex = null) {
    try {
      const params = {};
      if (propertyIndex !== null) params.propertyIndex = propertyIndex;
      if (stepIndex !== null) params.stepIndex = stepIndex;
      
      const response = await api.get('/api/multiplication-learning/quiz-attempts', { params });
      return response.data;
    } catch (error) {
      logger.error('Error getting quiz attempts', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        url: error?.config?.url,
        method: error?.config?.method,
        params: { propertyIndex, stepIndex },
      });
      throw error;
    }
  }

  // Get property completions
  async getPropertyCompletions() {
    try {
      const response = await api.get('/api/multiplication-learning/property-completions');
      return response.data;
    } catch (error) {
      logger.error('Error getting property completions', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        url: error?.config?.url,
        method: error?.config?.method,
      });
      throw error;
    }
  }
}

export default new MultiplicationLearningService();
