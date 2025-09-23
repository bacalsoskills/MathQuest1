import React, { createContext, useState, useContext, useEffect } from 'react';
import AuthService from '../services/authService';
import ProgressService from '../services/progressService';
import logger from '../services/logger';
import MultiplicationLearningService from '../services/multiplicationLearningService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [multiplicationProgress, setMultiplicationProgress] = useState(null);

  useEffect(() => {
    // Load user data from localStorage on initial load
    const user = AuthService.getCurrentUser();
    const storedToken = localStorage.getItem('token');
    if (user) {
      setCurrentUser(user);
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = async (usernameOrEmail, password) => {
    try {
      const response = await AuthService.login(usernameOrEmail, password);
      setCurrentUser(response.data);
      setToken(response.data.token);
      return { success: true, user: response.data };
    } catch (error) {
      return { success: false, error: error.message || 'Invalid credentials' };
    }
  };

  // Email validation function
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const register = async (userData) => {
    try {

      const response = await AuthService.register(userData);
      return response; // Just return the backend response which contains message
    } catch (error) {
      throw error; // Let the component handle the specific error
    }
  };

  const logout = () => {
    // Clear user-specific progress from memory (but keep in localStorage)
    ProgressService.clearProgress();
    
    AuthService.logout();
    setCurrentUser(null);
    setToken(null);
    
    logger.info('User logged out and progress cleared from memory');
  };

  // Multiplication Learning: load user's progress from backend
  const loadMultiplicationProgress = async () => {
    try {
      if (!token) return null;
      const progress = await MultiplicationLearningService.loadProgress();
      setMultiplicationProgress(progress);
      return progress;
    } catch (error) {
      logger.error('Failed to load multiplication progress', { error: error.message });
      return null;
    }
  };

  // Multiplication Learning: save overall progress snapshot
  const saveMultiplicationProgress = async (progressData) => {
    try {
      if (!token) return null;
      const saved = await MultiplicationLearningService.saveProgress(progressData);
      setMultiplicationProgress(saved);
      return saved;
    } catch (error) {
      logger.error('Failed to save multiplication progress', { error: error.message });
      throw error;
    }
  };

  // Multiplication Learning: complete a property
  const completeMultiplicationProperty = async (propertyIndex, propertyData) => {
    try {
      if (!token) return null;
      const updated = await MultiplicationLearningService.completeProperty(propertyIndex, propertyData);
      setMultiplicationProgress(updated);
      return updated;
    } catch (error) {
      logger.error('Failed to complete multiplication property', { error: error.message });
      throw error;
    }
  };

  // Multiplication Learning: save a quiz/challenge attempt
  const saveMultiplicationQuizAttempt = async (propertyIndex, stepIndex, quizData) => {
    try {
      if (!token) return null;
      return await MultiplicationLearningService.saveQuizAttempt(propertyIndex, stepIndex, quizData);
    } catch (error) {
      logger.error('Failed to save multiplication quiz attempt', { error: error.message });
      throw error;
    }
  };

  const refreshCurrentUser = async () => {
    try {
      // Update the current user in local storage based on current token
      const updatedUser = await AuthService.refreshUser();
      setCurrentUser(updatedUser);
      if (updatedUser?.token) {
        setToken(updatedUser.token);
      }
      return updatedUser;
    } catch (error) {
      logger.error("Failed to refresh user data", { error: error.message });
      return null;
    }
  };

  const isAdmin = () => {
    return AuthService.isAdmin();
  };

  const isTeacher = () => {
    return AuthService.isTeacher();
  };

  const isStudent = () => {
    return AuthService.isStudent();
  };

  const value = {
    currentUser,
    token,
    login,
    register,
    logout,
    refreshCurrentUser,
    isAdmin,
    isTeacher,
    isStudent,
    // Multiplication learning
    multiplicationProgress,
    loadMultiplicationProgress,
    saveMultiplicationProgress,
    completeMultiplicationProperty,
    saveMultiplicationQuizAttempt
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 