import api from './api';
import AuthService from './authService';
import logger from './logger';

const ProgressService = {
  // Get user identifier for progress storage
  getUserIdentifier: () => {
    const user = AuthService.getCurrentUser();
    if (!user) {
      console.warn('⚠️ No authenticated user found for progress storage');
      logger.warn('No authenticated user found for progress storage');
      return null;
    }
    
    console.log('🔍 ProgressService: Getting user identifier:', {
      user,
      username: user.username,
      email: user.email,
      roles: user.roles,
      token: localStorage.getItem('token'),
      isAuthenticated: AuthService.isAuthenticated(),
      isStudent: AuthService.isStudent()
    });
    
    // Verify user has student role
    if (!AuthService.isStudent()) {
      console.error('❌ User does not have STUDENT role:', user.roles);
      return null;
    }
    
    // Use username as primary identifier, fallback to email
    return user.username || user.email;
  },

  // Generate progress key for localStorage
  getProgressKey: (userIdentifier) => {
    return `multiplicationProgress_${userIdentifier}`;
  },

  // Save progress to backend API (with localStorage fallback)
  saveProgress: async (progressData) => {
    try {
      const userIdentifier = ProgressService.getUserIdentifier();
      if (!userIdentifier) {
        console.error('❌ Cannot save progress: No authenticated user');
        logger.error('Cannot save progress: No authenticated user');
        return false;
      }

      console.log('🔄 Attempting to save progress to backend:', {
        userIdentifier,
        progressData,
        timestamp: new Date().toISOString(),
        user: AuthService.getCurrentUser(),
        token: localStorage.getItem('token')
      });

      // Try to save to backend first
      try {
        logger.info('Saving progress to backend for user:', userIdentifier);
        console.log('🔄 Sending progress to backend:', progressData);
        
        const response = await api.post('/api/learning-progress/save', progressData);
        
        console.log('✅ Backend save response:', response.data);
        
        if (response.data) {
          logger.info('Progress saved successfully to backend');
          
          // Also save to localStorage as backup
          ProgressService.saveProgressToLocalStorage(progressData);
          return true;
        } else {
          console.warn('⚠️ Backend returned empty response');
          throw new Error('Backend returned empty response');
        }
      } catch (backendError) {
        console.error('❌ Backend save failed:', {
          error: backendError.message,
          status: backendError.response?.status,
          statusText: backendError.response?.statusText,
          data: backendError.response?.data,
          url: backendError.config?.url,
          headers: backendError.config?.headers,
          requestData: progressData
        });
        logger.warn('Backend save failed, falling back to localStorage:', backendError.message);
        
        // If it's an authentication error, don't fall back to localStorage
        if (backendError.response?.status === 401) {
          console.error('🚫 Authentication failed - not saving to localStorage');
          return false;
        }
      }

      // Fallback to localStorage if backend fails
      console.log('🔄 Falling back to localStorage save');
      const localStorageResult = ProgressService.saveProgressToLocalStorage(progressData);
      console.log('📱 localStorage save result:', localStorageResult);
      return localStorageResult;
    } catch (error) {
      console.error('💥 Failed to save progress:', error);
      logger.error('Failed to save progress', { error: error.message });
      return false;
    }
  },

  // Start a lesson
  startLesson: async (lessonId) => {
    try {
      const response = await api.post('/progress/start-lesson', { lessonId });
      console.log('✅ Lesson started:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to start lesson:', error);
      throw error;
    }
  },

  // Save quiz state after each answer
  saveQuizState: async (lessonId, quizState) => {
    try {
      const userIdentifier = ProgressService.getUserIdentifier();
      if (!userIdentifier) {
        console.error('❌ Cannot save quiz state: No authenticated user');
        return false;
      }

      const quizData = {
        userIdentifier,
        lessonId,
        quizState,
        timestamp: new Date().toISOString()
      };

      console.log('🔄 Saving quiz state:', quizData);

      // Try backend first
      try {
        // Convert quiz state to the new API format
        const latestAnswer = quizState.questionsAnswered[quizState.questionsAnswered.length - 1];
        if (latestAnswer) {
          const answerData = {
            lessonId: lessonId,
            questionIndex: latestAnswer.questionIndex,
            userAnswer: latestAnswer.userAnswer,
            correctAnswer: latestAnswer.correctAnswer,
            isCorrect: latestAnswer.isCorrect,
            questionType: latestAnswer.questionType,
            stepTitle: latestAnswer.stepTitle
          };
          
          const response = await api.post('/progress/save-answer', answerData);
          if (response.data) {
            // Also save to localStorage as backup
            ProgressService.saveQuizStateToLocalStorage(lessonId, quizState);
            return true;
          }
        }
      } catch (backendError) {
        console.warn('⚠️ Backend quiz state save failed, using localStorage:', backendError.message);
      }

      // Fallback to localStorage
      return ProgressService.saveQuizStateToLocalStorage(lessonId, quizState);
    } catch (error) {
      console.error('💥 Failed to save quiz state:', error);
      return false;
    }
  },

  // Load quiz state for a specific lesson
  loadQuizState: async (lessonId) => {
    try {
      const userIdentifier = ProgressService.getUserIdentifier();
      if (!userIdentifier) {
        return null;
      }

      // Try backend first
      try {
        const response = await api.get(`/progress/lesson/${lessonId}`);
        if (response.data) {
          // Convert backend response to frontend quiz state format
          return {
            currentQuestion: response.data.currentQuestion,
            questionsAnswered: response.data.answeredQuestions || [],
            totalQuestions: response.data.totalQuestions,
            isCompleted: response.data.isCompleted
          };
        }
      } catch (backendError) {
        console.warn('⚠️ Backend quiz state load failed, trying localStorage:', backendError.message);
      }

      // Fallback to localStorage
      return ProgressService.loadQuizStateFromLocalStorage(lessonId);
    } catch (error) {
      console.error('💥 Failed to load quiz state:', error);
      return null;
    }
  },

  // Clear quiz state when lesson is completed
  clearQuizState: async (lessonId) => {
    try {
      const userIdentifier = ProgressService.getUserIdentifier();
      if (!userIdentifier) {
        return false;
      }

      // Try backend first
      try {
        await api.post('/progress/complete', { lessonId });
      } catch (backendError) {
        console.warn('⚠️ Backend quiz state clear failed:', backendError.message);
      }

      // Always clear from localStorage
      return ProgressService.clearQuizStateFromLocalStorage(lessonId);
    } catch (error) {
      console.error('💥 Failed to clear quiz state:', error);
      return false;
    }
  },

  // Load progress from backend API (with localStorage fallback)
  loadProgress: async () => {
    try {
      const userIdentifier = ProgressService.getUserIdentifier();
      if (!userIdentifier) {
        logger.warn('Cannot load progress: No authenticated user');
        return null;
      }

      console.log('🔄 Attempting to load progress from backend:', {
        userIdentifier,
        timestamp: new Date().toISOString()
      });

      // Try to load from backend first
      try {
        logger.info('Loading progress from backend for user:', userIdentifier);
        console.log('🔄 Loading progress from backend...');
        
        const response = await api.get('/progress/current');
        
        console.log('✅ Backend load response:', response.data);
        
        if (response.data) {
          logger.info('Progress loaded successfully from backend');
          // Convert backend response to frontend format
          return {
            completed: response.data.lessonProgressList.map(lp => lp.isCompleted),
            active: response.data.nextLessonId - 1 || 0,
            quizScores: response.data.lessonProgressList.map(lp => lp.correctAnswers),
            quizAttempts: response.data.lessonProgressList.map(lp => lp.totalAttempts),
            quizHistory: {}, // Will be populated from answeredQuestions
            quizStates: response.data.lessonProgressList.reduce((acc, lp) => {
              if (!lp.isCompleted) {
                acc[lp.lessonId] = {
                  currentQuestion: lp.currentQuestion,
                  questionsAnswered: lp.answeredQuestions || [],
                  totalQuestions: lp.totalQuestions,
                  isCompleted: lp.isCompleted
                };
              }
              return acc;
            }, {})
          };
        } else {
          console.warn('⚠️ Backend returned empty response for load');
          return null;
        }
      } catch (backendError) {
        console.error('❌ Backend load failed:', {
          error: backendError.message,
          status: backendError.response?.status,
          statusText: backendError.response?.statusText,
          data: backendError.response?.data,
          url: backendError.config?.url,
          headers: backendError.config?.headers
        });
        logger.warn('Backend load failed, falling back to localStorage:', backendError.message);
        
        // If it's an authentication error, don't fall back to localStorage
        if (backendError.response?.status === 401) {
          console.error('🚫 Authentication failed - not loading from localStorage');
          return null;
        }
      }

      // Fallback to localStorage if backend fails
      console.log('🔄 Falling back to localStorage load');
      const localStorageResult = ProgressService.loadProgressFromLocalStorage();
      console.log('📱 localStorage load result:', localStorageResult);
      return localStorageResult;
    } catch (error) {
      console.error('💥 Failed to load progress:', error);
      logger.error('Failed to load progress', { error: error.message });
      return null;
    }
  },

  // Complete a lesson via backend API
  completeLesson: async (propertyIndex, lessonIndex) => {
    try {
      logger.info('Completing lesson via backend:', propertyIndex, lessonIndex);
      const response = await api.post('/api/learning-progress/complete-lesson', null, {
        params: {
          propertyIndex,
          lessonIndex
        }
      });
      
      if (response.data) {
        logger.info('Lesson completed successfully via backend');
        return response.data;
      }
      
      return null;
    } catch (error) {
      logger.error('Error completing lesson via backend:', error);
      return null;
    }
  },

  // Complete a property (quiz) via backend API
  completeProperty: async (propertyIndex, score) => {
    try {
      logger.info('Completing property via backend:', propertyIndex, score);
      const response = await api.post('/api/learning-progress/complete-property', null, {
        params: {
          propertyIndex,
          score
        }
      });
      
      if (response.data) {
        logger.info('Property completed successfully via backend');
        return response.data;
      }
      
      return null;
    } catch (error) {
      logger.error('Error completing property via backend:', error);
      return null;
    }
  },

  // Get leaderboard from backend
  getLeaderboard: async () => {
    try {
      logger.info('Getting leaderboard from backend');
      const response = await api.get('/api/learning-progress/leaderboard');
      return response.data || [];
    } catch (error) {
      logger.error('Error getting leaderboard from backend:', error);
      return [];
    }
  },

  // Get top performers from backend
  getTopPerformers: async (minProperties = 1) => {
    try {
      logger.info('Getting top performers from backend');
      const response = await api.get('/api/learning-progress/top-performers', {
        params: { minProperties }
      });
      return response.data || [];
    } catch (error) {
      logger.error('Error getting top performers from backend:', error);
      return [];
    }
  },

  // Get progress statistics from backend
  getProgressStatistics: async () => {
    try {
      logger.info('Getting progress statistics from backend');
      const response = await api.get('/api/learning-progress/statistics');
      return response.data || {};
    } catch (error) {
      logger.error('Error getting progress statistics from backend:', error);
      return {};
    }
  },

  // Clear progress for current user
  clearProgress: () => {
    try {
      const userIdentifier = ProgressService.getUserIdentifier();
      if (!userIdentifier) {
        logger.warn('Cannot clear progress: No authenticated user');
        return false;
      }

      const progressKey = ProgressService.getProgressKey(userIdentifier);
      localStorage.removeItem(progressKey);
      logger.info('Progress cleared successfully', { userIdentifier, progressKey });
      return true;
    } catch (error) {
      logger.error('Failed to clear progress', { error: error.message });
      return false;
    }
  },

  // Clear all progress (for admin purposes or complete reset)
  clearAllProgress: () => {
    try {
      const keys = Object.keys(localStorage);
      const progressKeys = keys.filter(key => key.startsWith('multiplicationProgress_'));
      
      progressKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      logger.info('All progress cleared', { clearedKeys: progressKeys });
      return true;
    } catch (error) {
      logger.error('Failed to clear all progress', { error: error.message });
      return false;
    }
  },

  // localStorage fallback methods
  saveProgressToLocalStorage: (progressData) => {
    try {
      const userIdentifier = ProgressService.getUserIdentifier();
      if (!userIdentifier) {
        logger.error('Cannot save progress to localStorage: No user ID found.');
        return false;
      }

      const progressKey = ProgressService.getProgressKey(userIdentifier);
      const progressToSave = {
        ...progressData,
        lastUpdated: new Date().toISOString(),
        userIdentifier: userIdentifier
      };

      localStorage.setItem(progressKey, JSON.stringify(progressToSave));
      logger.info('Progress saved to localStorage as backup', { userIdentifier, progressKey });
      return true;
    } catch (error) {
      logger.error('Error saving progress to localStorage:', error);
      return false;
    }
  },

  // Quiz state localStorage methods
  saveQuizStateToLocalStorage: (lessonId, quizState) => {
    try {
      const userIdentifier = ProgressService.getUserIdentifier();
      if (!userIdentifier) {
        logger.error('Cannot save quiz state to localStorage: No user ID found.');
        return false;
      }

      const quizKey = `quizState_${userIdentifier}_${lessonId}`;
      const quizToSave = {
        ...quizState,
        lastUpdated: new Date().toISOString(),
        userIdentifier: userIdentifier,
        lessonId: lessonId
      };

      localStorage.setItem(quizKey, JSON.stringify(quizToSave));
      logger.info('Quiz state saved to localStorage', { userIdentifier, lessonId, quizKey });
      return true;
    } catch (error) {
      logger.error('Error saving quiz state to localStorage:', error);
      return false;
    }
  },

  loadQuizStateFromLocalStorage: (lessonId) => {
    try {
      const userIdentifier = ProgressService.getUserIdentifier();
      if (!userIdentifier) {
        logger.warn('Cannot load quiz state from localStorage: No authenticated user');
        return null;
      }

      const quizKey = `quizState_${userIdentifier}_${lessonId}`;
      const savedQuizState = localStorage.getItem(quizKey);
      
      if (!savedQuizState) {
        logger.info('No saved quiz state found in localStorage for lesson', { userIdentifier, lessonId });
        return null;
      }

      const quizState = JSON.parse(savedQuizState);
      
      // Verify the quiz state belongs to the current user and lesson
      if (quizState.userIdentifier !== userIdentifier || quizState.lessonId !== lessonId) {
        logger.warn('Quiz state mismatch, clearing quiz state', { 
          expectedUser: userIdentifier, 
          foundUser: quizState.userIdentifier,
          expectedLesson: lessonId,
          foundLesson: quizState.lessonId
        });
        ProgressService.clearQuizStateFromLocalStorage(lessonId);
        return null;
      }

      logger.info('Quiz state loaded from localStorage', { userIdentifier, lessonId, quizKey });
      return quizState;
    } catch (error) {
      logger.error('Failed to load quiz state from localStorage', { error: error.message });
      return null;
    }
  },

  clearQuizStateFromLocalStorage: (lessonId) => {
    try {
      const userIdentifier = ProgressService.getUserIdentifier();
      if (!userIdentifier) {
        logger.warn('Cannot clear quiz state from localStorage: No authenticated user');
        return false;
      }

      const quizKey = `quizState_${userIdentifier}_${lessonId}`;
      localStorage.removeItem(quizKey);
      logger.info('Quiz state cleared from localStorage', { userIdentifier, lessonId, quizKey });
      return true;
    } catch (error) {
      logger.error('Failed to clear quiz state from localStorage', { error: error.message });
      return false;
    }
  },

  loadProgressFromLocalStorage: () => {
    try {
      const userIdentifier = ProgressService.getUserIdentifier();
      if (!userIdentifier) {
        logger.warn('Cannot load progress from localStorage: No authenticated user');
        return null;
      }

      const progressKey = ProgressService.getProgressKey(userIdentifier);
      const savedProgress = localStorage.getItem(progressKey);
      
      if (!savedProgress) {
        logger.info('No saved progress found in localStorage for user', { userIdentifier });
        return null;
      }

      const progress = JSON.parse(savedProgress);
      
      // Verify the progress belongs to the current user
      if (progress.userIdentifier !== userIdentifier) {
        logger.warn('Progress user mismatch, clearing progress', { 
          expected: userIdentifier, 
          found: progress.userIdentifier 
        });
        ProgressService.clearProgress();
        return null;
      }

      logger.info('Progress loaded from localStorage fallback', { userIdentifier, progressKey });
      return progress;
    } catch (error) {
      logger.error('Failed to load progress from localStorage', { error: error.message });
      return null;
    }
  },

  // Force save progress to backend (for testing)
  forceSaveToBackend: async (progressData) => {
    try {
      const userIdentifier = ProgressService.getUserIdentifier();
      if (!userIdentifier) {
        console.error('❌ Cannot force save: No authenticated user');
        return false;
      }

      console.log('🔄 Force saving progress to backend:', {
        userIdentifier,
        progressData,
        timestamp: new Date().toISOString()
      });

      const response = await api.post('/api/learning-progress/save', progressData);
      
      if (response.data) {
        console.log('✅ Force save successful:', response.data);
        return true;
      } else {
        console.error('❌ Force save failed: Empty response');
        return false;
      }
    } catch (error) {
      console.error('❌ Force save failed:', error);
      return false;
    }
  },

  // Get progress summary for current user
  getProgressSummary: async () => {
    try {
      const progress = await ProgressService.loadProgress();
      if (!progress) {
        return {
          completedProperties: [],
          completedLessons: {},
          totalLessonsCompleted: 0,
          totalPropertiesCompleted: 0,
          lastUpdated: null
        };
      }

      const completedLessons = progress.completedLessons || {};
      const completedProperties = progress.completedProperties || [];
      
      return {
        completedProperties,
        completedLessons,
        totalLessonsCompleted: Object.keys(completedLessons).length,
        totalPropertiesCompleted: completedProperties.length,
        lastUpdated: progress.lastUpdated
      };
    } catch (error) {
      logger.error('Failed to get progress summary', { error: error.message });
      return {
        completedProperties: [],
        completedLessons: {},
        totalLessonsCompleted: 0,
        totalPropertiesCompleted: 0,
        lastUpdated: null
      };
    }
  },

  // Export progress data (for backup or migration)
  exportProgress: () => {
    try {
      const userIdentifier = ProgressService.getUserIdentifier();
      if (!userIdentifier) {
        throw new Error('No authenticated user');
      }

      const progress = ProgressService.loadProgress();
      if (!progress) {
        throw new Error('No progress data found');
      }

      const exportData = {
        userIdentifier,
        progress,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      return exportData;
    } catch (error) {
      logger.error('Failed to export progress', { error: error.message });
      throw error;
    }
  },

  // Import progress data (for restore or migration)
  importProgress: (importData) => {
    try {
      const userIdentifier = ProgressService.getUserIdentifier();
      if (!userIdentifier) {
        throw new Error('No authenticated user');
      }

      if (!importData || !importData.progress) {
        throw new Error('Invalid import data');
      }

      // Verify the import data belongs to the current user
      if (importData.userIdentifier !== userIdentifier) {
        throw new Error('Import data does not match current user');
      }

      const success = ProgressService.saveProgress(importData.progress);
      if (!success) {
        throw new Error('Failed to save imported progress');
      }

      logger.info('Progress imported successfully', { userIdentifier });
      return true;
    } catch (error) {
      logger.error('Failed to import progress', { error: error.message });
      throw error;
    }
  }
};

export default ProgressService;

