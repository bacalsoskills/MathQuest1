import React, { createContext, useState, useContext, useEffect } from 'react';
import AuthService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

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
    AuthService.logout();
    setCurrentUser(null);
    setToken(null);
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
      console.error("Failed to refresh user data:", error);
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
    isStudent
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 