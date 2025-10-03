import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FaCompass, FaCrown, FaSkullCrossbones, FaAnchor, FaMap } from 'react-icons/fa';

const Leaderboard = ({ gameId, finalScore }) => {
  const { currentUser, token, isTeacher } = useAuth();
  const { darkMode } = useTheme();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
  
        
        // If finalScore changed, show loading state
        if (finalScore !== null) {
          setLoading(true);
        }
        
        // Add timestamp to prevent caching
        const timestamp = Date.now();
        const response = await api.get(`/games/${gameId}/leaderboard?t=${timestamp}`);
        
        let leaderboardData = response.data;

        
        // Filter data based on user role
        if (!isTeacher()) {
          // For students, only show student entries
          leaderboardData = leaderboardData.filter(entry => 
            entry.role === 'ROLE_STUDENT' || !entry.role
          );
        }
        

        setLeaderboard(leaderboardData);
        
        // Find current user's position in the leaderboard (only for students)
        if (currentUser && !isTeacher()) {
          const userIndex = leaderboardData.findIndex(entry => 
            entry.studentId === currentUser.id || entry.studentEmail === currentUser.email
          );
          
          if (userIndex !== -1) {
            setCurrentUserRank(userIndex + 1);
   
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
    <div className={`rounded-2xl shadow-2xl p-6 sm:p-8 border-2 transition-colors duration-300 ${
      darkMode
        ? 'bg-[#0b1022]/85 border-yellow-700/40'
        : 'bg-gradient-to-br from-amber-100 to-orange-100 border-yellow-300'
    }`} style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}>
      <div className="flex items-center justify-center gap-3 mb-4">
        <FaCompass className={`${darkMode ? 'text-yellow-400' : 'text-yellow-600'} text-2xl`} />
        <h2 className={`text-3xl font-extrabold tracking-wide ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
          {isTeacher() ? 'Captain’s Ledger' : 'Captain’s Board'}
        </h2>
        <FaSkullCrossbones className={`${darkMode ? 'text-yellow-400' : 'text-yellow-600'} text-2xl`} />
      </div>
      
      {!isTeacher() && finalScore !== null && (
        <div className={`mb-6 p-4 rounded-xl border-2 ${
          darkMode
            ? 'bg-[#0f1428] border-yellow-700/40'
            : 'bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-300'
        }`}>
          <p className={`text-center text-lg ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
            <span className="font-extrabold">Your Treasure:</span> {finalScore}
          </p>
          {currentUserRank && (
            <p className={`text-center text-lg ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
              <span className="font-bold">Your Rank:</span> {currentUserRank}{getOrdinalSuffix(currentUserRank)}
            </p>
          )}
        </div>
      )}
      
      {leaderboard.length === 0 ? (
        <div className={`text-center py-8 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
          <p>
            {isTeacher() 
              ? "No sailors have ventured here yet."
              : "No treasures recorded yet. Be the first to sail!"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className={`min-w-full border-2 rounded-xl transition-colors duration-300 ${
            darkMode
              ? 'bg-[#0f1428] border-yellow-700/40'
              : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200'
          }`}>
            <thead>
              <tr className={`${darkMode ? 'bg-[#13183a] text-yellow-200' : 'bg-gradient-to-r from-amber-200 to-yellow-200 text-yellow-900'} text-left`}>
                <th className="py-3 px-4 font-semibold">Rank</th>
                <th className="py-3 px-4 font-semibold">Sailor</th>
                <th className="py-3 px-4 font-semibold text-right">Treasure</th>
                <th className="py-3 px-4 font-semibold text-right">Log Date</th>
              </tr>
            </thead>
            <tbody className={`${darkMode ? 'divide-yellow-700/40' : 'divide-yellow-200'}`}>
              {leaderboard.map((entry, index) => {
                const isCurrentUser = currentUser && 
                  (entry.studentId === currentUser.id || entry.studentEmail === currentUser.email);
                
                return (
                  <tr 
                    key={index} 
                    className={`${isCurrentUser
                      ? (darkMode ? 'bg-[#1a2146]' : 'bg-yellow-100')
                      : (darkMode ? 'hover:bg-[#111633]' : 'hover:bg-amber-100')}`}
                  >
                    <td className={`py-3 px-4 ${darkMode ? 'text-yellow-300' : 'text-yellow-900'}`}>
                      {getPositionEmoji(index + 1)} {index + 1}{getOrdinalSuffix(index + 1)}
                    </td>
                    <td className={`py-3 px-4 font-semibold ${darkMode ? 'text-yellow-200' : 'text-yellow-900'}`}>
                      {entry.studentName || 'Anonymous'} 
                      {isCurrentUser && <span className={`${darkMode ? 'text-yellow-400' : 'text-amber-700'} ml-2`}>(You)</span>}
                    </td>
                    <td className={`py-3 px-4 text-right font-extrabold ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>{entry.score}</td>
                    {(() => {
                      const parsedDate = new Date(entry.playedAt);
                      return (
                        <td className={`py-3 px-4 text-right ${darkMode ? 'text-yellow-400' : 'text-amber-700'}`}>
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