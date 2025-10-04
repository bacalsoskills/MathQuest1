import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState({
    dashboard: 0,
    classrooms: 0,
    activities: 0,
    leaderboard: 0,
    profile: 0,
    help: 0
  });
  
  const [loading, setLoading] = useState(false);
  const { currentUser, isAdmin, isTeacher, isStudent } = useAuth();

  // Function to fetch notifications based on user role
  const fetchNotifications = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Try to fetch from API first, fallback to mock data
      try {
        const apiNotifications = await notificationService.getNotificationCounts();
        setNotifications(apiNotifications);
      } catch (apiError) {
        console.log('API not available, using mock notifications');
        const mockNotifications = await getMockNotifications();
        setNotifications(mockNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock notification data - replace with actual API calls
  const getMockNotifications = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (isAdmin()) {
      return {
        dashboard: 2, // New users, system alerts
        classrooms: 1, // New classroom requests
        activities: 0,
        leaderboard: 0,
        profile: 0,
        help: 0
      };
    } else if (isTeacher()) {
      return {
        dashboard: 1, // New student enrollments
        classrooms: 3, // New submissions, student messages
        activities: 2, // New quiz attempts, game completions
        leaderboard: 0,
        profile: 0,
        help: 0
      };
    } else if (isStudent()) {
      return {
        dashboard: 1, // New assignments, announcements
        classrooms: 2, // New lessons, quiz results
        activities: 1, // New games, achievements
        leaderboard: 1, // Ranking updates
        profile: 0,
        help: 0
      };
    }
    
    return {
      dashboard: 0,
      classrooms: 0,
      activities: 0,
      leaderboard: 0,
      profile: 0,
      help: 0
    };
  };

  // Function to mark notification as read
  const markAsRead = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: 0
    }));
  };

  // Function to add notification
  const addNotification = (type, count = 1) => {
    setNotifications(prev => ({
      ...prev,
      [type]: prev[type] + count
    }));
  };

  // Function to clear all notifications
  const clearAllNotifications = () => {
    setNotifications({
      dashboard: 0,
      classrooms: 0,
      activities: 0,
      leaderboard: 0,
      profile: 0,
      help: 0
    });
  };

  // Get total notification count
  const getTotalNotifications = () => {
    return Object.values(notifications).reduce((total, count) => total + count, 0);
  };

  // Check if there are any notifications
  const hasNotifications = () => {
    return getTotalNotifications() > 0;
  };

  // Fetch notifications when user changes
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      
      // Set up periodic refresh (every 30 seconds)
      const interval = setInterval(fetchNotifications, 30000);
      
      return () => clearInterval(interval);
    }
  }, [currentUser, isAdmin, isTeacher, isStudent]);

  const value = {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    addNotification,
    clearAllNotifications,
    getTotalNotifications,
    hasNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
