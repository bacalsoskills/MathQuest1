import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const UserProgressContext = createContext();

export const useUserProgress = () => useContext(UserProgressContext);

export const UserProgressProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [userProgress, setUserProgress] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initial badges data
  const initialBadges = [
    { id: 1, name: 'First Steps', description: 'Complete your first practice problem', icon: '👣', points: 10 },
    { id: 2, name: 'Quick Learner', description: 'Complete 5 practice problems', icon: '⚡', points: 50 },
    { id: 3, name: 'Math Master', description: 'Score 100% on a challenge', icon: '🏆', points: 100 },
    { id: 4, name: 'Property Pro', description: 'Learn all multiplication properties', icon: '📚', points: 75 },
    { id: 5, name: 'Perfect Score', description: 'Get all answers correct in a game', icon: '💯', points: 150 }
  ];

  useEffect(() => {
    // Load user progress from localStorage
    const storedProgress = localStorage.getItem('userProgress');
    if (storedProgress) {
      setUserProgress(JSON.parse(storedProgress));
    } else {
      // Initialize with empty progress if nothing is stored
      const initialProgress = {};
      setUserProgress(initialProgress);
      localStorage.setItem('userProgress', JSON.stringify(initialProgress));
    }
    setLoading(false);
  }, []);

  const updateProgress = (userId, data) => {
    console.log('Updating user progress:', { userId, data });
    const updatedProgress = {
      ...userProgress,
      [userId]: {
        ...userProgress[userId],
        ...data,
        lastUpdated: new Date().toISOString()
      }
    };
    console.log('Updated progress:', updatedProgress);
    setUserProgress(updatedProgress);
    localStorage.setItem('userProgress', JSON.stringify(updatedProgress));
    updateLeaderboard();
  };

  const addPoints = (userId, points) => {
    const currentPoints = userProgress[userId]?.points || 0;
    updateProgress(userId, { points: currentPoints + points });
  };

  const awardBadge = (userId, badgeId) => {
    const userBadges = userProgress[userId]?.badges || [];
    if (!userBadges.includes(badgeId)) {
      const badge = initialBadges.find(b => b.id === badgeId);
      if (badge) {
        updateProgress(userId, {
          badges: [...userBadges, badgeId],
          points: (userProgress[userId]?.points || 0) + badge.points
        });
      }
    }
  };

  const updateLeaderboard = () => {
    const leaderboardData = Object.entries(userProgress)
      .map(([userId, data]) => ({
        userId,
        points: data.points || 0,
        badges: data.badges?.length || 0,
        lastUpdated: data.lastUpdated
      }))
      .sort((a, b) => b.points - a.points);
    setLeaderboard(leaderboardData);
  };

  const getUserProgress = (userId) => {
    return userProgress[userId] || {
      points: 0,
      badges: [],
      completedProblems: [],
      completedChallenges: []
    };
  };

  const value = {
    userProgress,
    leaderboard,
    initialBadges,
    updateProgress,
    addPoints,
    awardBadge,
    getUserProgress
  };

  return (
    <UserProgressContext.Provider value={value}>
      {!loading && children}
    </UserProgressContext.Provider>
  );
}; 