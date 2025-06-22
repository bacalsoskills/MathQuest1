import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Leaderboard = ({ gameId, finalScore }) => {
  const { currentUser, token, isTeacher } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        console.log('[Leaderboard] Fetching leaderboard data:', { gameId, finalScore });
        
        // If finalScore changed, show loading state
        if (finalScore !== null) {
          setLoading(true);
        }
        
        // Add timestamp to prevent caching
        const timestamp = Date.now();
        const response = await api.get(`/games/${gameId}/leaderboard?t=${timestamp}`);
        
        let leaderboardData = response.data;
        console.log('[Leaderboard] Raw leaderboard data:', leaderboardData);
        
        // Filter data based on user role
        if (!isTeacher()) {
          // For students, only show student entries
          leaderboardData = leaderboardData.filter(entry => 
            entry.role === 'ROLE_STUDENT' || !entry.role
          );
        }
        
        console.log('[Leaderboard] Filtered leaderboard data:', leaderboardData);
        setLeaderboard(leaderboardData);
        
        // Find current user's position in the leaderboard (only for students)
        if (currentUser && !isTeacher()) {
          const userIndex = leaderboardData.findIndex(entry => 
            entry.studentId === currentUser.id || entry.studentEmail === currentUser.email
          );
          
          if (userIndex !== -1) {
            setCurrentUserRank(userIndex + 1);
            console.log('[Leaderboard] Current user rank:', userIndex + 1);
          }
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        toast.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchLeaderboard();
    }
  }, [gameId, token, currentUser, finalScore, isTeacher]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isTeacher() ? 'Student Game Leaderboard' : 'Game Leaderboard'}
      </h2>
      
      {!isTeacher() && finalScore !== null && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200" >
          <p className="text-center text-lg">
            <span className="font-bold">Your Score:</span> {finalScore}
          </p>
          {currentUserRank && (
            <p className="text-center text-lg">
              <span className="font-bold">Your Rank:</span> {currentUserRank}{getOrdinalSuffix(currentUserRank)}
            </p>
          )}
        </div>
      )}
      
      {leaderboard.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>
            {isTeacher() 
              ? "No students have played this game yet."
              : "No scores recorded yet. Be the first to play!"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-left">
                <th className="py-3 px-4 font-semibold">Rank</th>
                <th className="py-3 px-4 font-semibold">Player</th>
                <th className="py-3 px-4 font-semibold text-right">Score</th>
                <th className="py-3 px-4 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboard.map((entry, index) => {
                const isCurrentUser = currentUser && 
                  (entry.studentId === currentUser.id || entry.studentEmail === currentUser.email);
                
                return (
                  <tr 
                    key={index} 
                    className={isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  >
                    <td className="py-3 px-4">
                      {getPositionEmoji(index + 1)} {index + 1}{getOrdinalSuffix(index + 1)}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {entry.studentName || 'Anonymous'} 
                      {isCurrentUser && <span className="ml-2 text-blue-600">(You)</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">{entry.score}</td>
                    {(() => {
                      console.log("Raw playedAt:", entry.playedAt);

                      const parsedDate = new Date(entry.playedAt);
                      console.log("Parsed Date object:", parsedDate);

                      return (
                        <td className="py-3 px-4 text-right text-gray-500">
                          {entry.playedAt && !isNaN(parsedDate)
                            ? parsedDate.toLocaleDateString()
                            : '—'}
                        </td>
                      );
                    })()}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Helper function to get ordinal suffix for numbers
const getOrdinalSuffix = (number) => {
  const j = number % 10;
  const k = number % 100;
  
  if (j === 1 && k !== 11) {
    return 'st';
  }
  if (j === 2 && k !== 12) {
    return 'nd';
  }
  if (j === 3 && k !== 13) {
    return 'rd';
  }
  return 'th';
};

// Helper function to get emoji for top positions
const getPositionEmoji = (position) => {
  switch (position) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return '';
  }
};

export default Leaderboard; 