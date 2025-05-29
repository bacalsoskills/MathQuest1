import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { leaderboardService } from '../../services/leaderboardService';
import { useAuth } from '../../context/AuthContext';
import { FaTrophy, FaMedal, FaClock, FaChartLine } from 'react-icons/fa';

const LeaderboardCard = ({ rank, student, score, isFirst }) => {
  return (
    <div className={`flex flex-col items-center justify-center bg-white rounded-lg shadow-lg p-6 ${isFirst ? 'h-80' : 'h-64'}`}>
      <div className={`w-16 h-16 flex items-center justify-center rounded-full mb-2 ${
        rank === 1 ? 'bg-yellow-400' : rank === 2 ? 'bg-gray-300' : 'bg-amber-600'
      }`}>
        {rank === 1 ? <FaTrophy className="text-white text-2xl" /> : <FaMedal className="text-white text-2xl" />}
      </div>
      <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
      <h3 className="text-xl font-bold mb-2">{student}</h3>
      <p className="text-gray-600">Score: {score}</p>
      <p className="text-sm text-gray-500">#{rank}</p>
    </div>
  );
};

const LeaderboardTable = ({ entries }) => {
  // Process entries to ensure best time corresponds to highest score
  const processedEntries = entries.map(entry => {
    // Find the attempt with the highest score to get its time
    let bestTime = entry.formattedFastestTime;
    
    // If there are attempts associated with this entry, find the best time that corresponds to highest score
    if (entry.attempts && entry.attempts.length > 0) {
      const highestScoreAttempt = entry.attempts.reduce((best, current) => {
        return (current.score > best.score) ? current : best;
      }, entry.attempts[0]);
      
      // Use the time from the highest score attempt
      if (highestScoreAttempt) {
        const timeInSeconds = highestScoreAttempt.timeSpentSeconds;
        if (timeInSeconds) {
          const minutes = Math.floor(timeInSeconds / 60);
          const seconds = timeInSeconds % 60;
          bestTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
      }
    }
    
    return {
      ...entry,
      formattedBestTime: bestTime
    };
  });

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden mt-8">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Best Time</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {processedEntries.slice(0, 10).map((entry, index) => (
            <tr key={entry.id || index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{entry.studentName}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.highestScore}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.formattedBestTime || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const QuizAttemptsTable = ({ quizSummaries }) => {
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  
  // If no quiz is selected, select the first one
  useEffect(() => {
    if (quizSummaries.length > 0 && !selectedQuiz) {
      setSelectedQuiz(quizSummaries[0].quizId);
    }
  }, [quizSummaries, selectedQuiz]);
  
  // Get the selected quiz data
  const selectedQuizData = quizSummaries.find(quiz => quiz.quizId === selectedQuiz);
  
  // Format time in seconds to mm:ss
  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4">Quiz Performance</h2>
      
      {/* Quiz Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Quiz</label>
        <select 
          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          value={selectedQuiz || ''}
          onChange={(e) => setSelectedQuiz(e.target.value)}
        >
          {quizSummaries.map(quiz => (
            <option key={quiz.quizId} value={quiz.quizId}>
              {quiz.quizName} {quiz.hasTaken ? `(Best: ${quiz.highestScore}%)` : '(Not attempted)'}
            </option>
          ))}
        </select>
      </div>
      
      {/* Selected Quiz Summary */}
      {selectedQuizData && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Quiz Name</p>
              <p className="font-medium">{selectedQuizData.quizName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Best Score</p>
              <p className="font-medium text-green-600">
                {selectedQuizData.hasTaken ? `${selectedQuizData.highestScore}%` : 'Not attempted'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Best Time</p>
              <p className="font-medium text-blue-600">
                {selectedQuizData.formattedBestTime || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Attempts Table */}
      {selectedQuizData && selectedQuizData.attempts && selectedQuizData.attempts.length > 0 ? (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempt #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Taken</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passed</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedQuizData.attempts.map((attempt, index) => (
                <tr key={attempt.id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{attempt.attemptNumber || index + 1}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {new Date(attempt.completedAt || attempt.startedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      attempt.score >= 80 ? 'bg-green-100 text-green-800' : 
                      attempt.score >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {attempt.score}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(attempt.timeSpentSeconds)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {attempt.passed ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Passed
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center bg-gray-50 rounded-lg p-6">
          {selectedQuizData && !selectedQuizData.hasTaken ? (
            <div>
              <p className="text-lg font-medium text-gray-500 mb-2">You haven't attempted this quiz yet</p>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                Take Quiz
              </button>
            </div>
          ) : (
            <p className="text-gray-500">No attempts found for this quiz.</p>
          )}
        </div>
      )}
    </div>
  );
};

const MyStatusSection = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">My Performance Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Overall Score</h3>
          <p className="text-3xl font-bold text-blue-600">{data.averageScore}%</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Quizzes Completed</h3>
          <p className="text-3xl font-bold text-green-600">{data.totalQuizzes}</p>
          <p className="text-sm text-gray-500 mt-1">
            of {data.totalAvailableQuizzes} available quizzes
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Quiz Status</h3>
          <div className="flex justify-between text-lg">
            <div>
              <p className="text-green-600 font-bold">{data.passedQuizzes}</p>
              <p className="text-sm">Passed</p>
            </div>
            <div>
              <p className="text-red-600 font-bold">{data.failedQuizzes}</p>
              <p className="text-sm">Failed</p>
            </div>
            <div>
              <p className="text-gray-600 font-bold">{data.notTakenQuizzes}</p>
              <p className="text-sm">Not Taken</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Current Rank</h3>
          <p className="text-3xl font-bold text-purple-600">#{data.currentRank}</p>
          <p className="text-sm text-gray-500 mt-1">Best Score: {data.bestScore}%</p>
        </div>
      </div>
    </div>
  );
};

const Leaderboard = ({ classroomId: propClassroomId }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { classroomId: urlClassroomId } = useParams();
  const [activeTab, setActiveTab] = useState('overall');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [quizAttemptsData, setQuizAttemptsData] = useState([]);
  const [studentPerformance, setStudentPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use propClassroomId if provided, otherwise use urlClassroomId
  const effectiveClassroomId = propClassroomId || urlClassroomId;

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (!effectiveClassroomId) {
      setError('No classroom ID provided');
      setLoading(false);
      return;
    }
    
    loadLeaderboardData();
  }, [effectiveClassroomId, activeTab, currentUser, navigate]);

  const loadLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      let data;
      
      if (!effectiveClassroomId) {
        console.error("[Error] No classroom ID provided");
        throw new Error('No classroom ID provided');
      }
      
      console.log(`[Loading] Loading ${activeTab} data for classroom ${effectiveClassroomId}`);
      
      if (activeTab === 'overall') {
        console.log("[API] Fetching classroom leaderboard...");
        data = await leaderboardService.getClassroomLeaderboard(effectiveClassroomId);
        console.log("[Data] Classroom leaderboard data:", data);
        setLeaderboardData(data);
      } else if (activeTab === 'mystatus') {
        console.log("[API] Fetching student performance...");
        data = await leaderboardService.getStudentPerformance(effectiveClassroomId);
        console.log("[Data] Student performance data:", data);
        setStudentPerformance(data);
      } else if (activeTab === 'quizzes') {
        console.log("[API] Fetching student quiz attempts...");
        data = await leaderboardService.getStudentQuizAttempts(effectiveClassroomId);
        console.log("[Data] Student quiz attempts data:", data);
        setQuizAttemptsData(data);
      }
    } catch (error) {
      console.error('[Error] Error loading leaderboard:', error);
      
      // Check if it's an authentication error
      if (error.message === 'User not authenticated' || error.response?.status === 401) {
        console.log('[Auth] User not authenticated, redirecting to login...');
        navigate('/login');
      } else {
        // Get a more descriptive error message
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load leaderboard data';
        console.error('[Error] Detailed error:', errorMessage);
        setError(`Failed to load leaderboard data: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  // Only get top3 for the overall tab
  const top3Students = activeTab === 'overall' ? leaderboardData.slice(0, 3) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Leaderboard</h1>
      
      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <nav className="flex space-x-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('overall')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'overall'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Overall
          </button>
          <button
            onClick={() => setActiveTab('mystatus')}
            className={`px-4 py-2 text-sm font-medium rounded-md cursor-not-allowed ${
              activeTab === 'mystatus'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            disabled={true}
          >
            My Status
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-4 py-2 text-sm font-medium rounded-md cursor-not-allowed ${
              activeTab === 'quizzes'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            disabled={true}
          >
            My Quizzes
          </button>
        </nav>
      </div>

      {activeTab === 'overall' && (
        <>
          {/* Top 3 Display */}
          <div className="grid grid-cols-3 gap-8 mb-8">
            {/* Second Place */}
            {top3Students[1] && (
              <LeaderboardCard
                rank={2}
                student={top3Students[1].studentName}
                score={top3Students[1].highestScore}
              />
            )}
            
            {/* First Place */}
            {top3Students[0] && (
              <LeaderboardCard
                rank={1}
                student={top3Students[0].studentName}
                score={top3Students[0].highestScore}
                isFirst={true}
              />
            )}
            
            {/* Third Place */}
            {top3Students[2] && (
              <LeaderboardCard
                rank={3}
                student={top3Students[2].studentName}
                score={top3Students[2].highestScore}
              />
            )}
          </div>

          {/* Leaderboard Table */}
          <LeaderboardTable entries={leaderboardData} />
        </>
      )}

      {activeTab === 'mystatus' && studentPerformance && (
        <MyStatusSection data={studentPerformance} />
      )}

      {activeTab === 'quizzes' && (
        <QuizAttemptsTable quizSummaries={quizAttemptsData} />
      )}
    </div>
  );
};

export default Leaderboard; 