import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { leaderboardService } from '../../services/leaderboardService';
import { useAuth } from '../../context/AuthContext';
import { FaTrophy, FaMedal, FaClock, FaChartLine, FaChevronDown } from 'react-icons/fa';
import { MdOutlineQuiz } from "react-icons/md";
import { Chart } from 'react-chartjs-2';
import { Header } from "../../ui/heading"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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

const formatStudentName = (name) => {
  if (!name) return '-';
  
  // Split the name into parts
  const nameParts = name.split(' ');
  
  // If there's only one part, return it with proper capitalization
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase();
  }
  
  // If there are multiple parts, format as "LastName, FirstName"
  const lastName = nameParts[nameParts.length - 1];
  const firstName = nameParts.slice(0, -1).join(' ');
  
  // Capitalize first letter of each part
  const formattedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
  const formattedFirstName = firstName.split(' ').map(part => 
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  ).join(' ');
  
  return `${formattedLastName}, ${formattedFirstName}`;
};

const LeaderboardTable = ({ entries }) => {
  // Get top 10 entries
  const topEntries = entries?.slice(0, 10) || [];

  // Sort entries by final score (descending) and then by time (ascending)
  const sortedEntries = [...topEntries].sort((a, b) => {
    // First compare by final score
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }
    // If scores are equal, compare by time
    const timeA = a.fastestTimeSeconds || Infinity;
    const timeB = b.fastestTimeSeconds || Infinity;
    return timeA - timeB;
  });

  return (
    <div className="space-y-8">
      {/* Top 3 Podium */}
      <div className="flex justify-center items-end space-x-2 sm:space-x-4 sm:h-80">
        {/* Second Place */}
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-gray-300 mb-2">
            <FaMedal className="text-white text-sm sm:text-2xl" />
          </div>
          <div className="w-20 h-20 sm:w-48 sm:h-48 bg-white rounded-lg shadow-lg p-2 sm:p-4 flex flex-col items-center justify-center">
            <h3 className="text-xs sm:text-xl font-bold mb-1 sm:mb-2">{formatStudentName(sortedEntries[1]?.studentName)}</h3>
            <p className="text-xs sm:text-sm text-gray-500">#2</p>
          </div>
        </div>

        {/* First Place */}
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-yellow-400 mb-2">
            <FaTrophy className="text-white text-sm sm:text-2xl" />
          </div>
          <div className="w-20 h-24 sm:w-48 sm:h-56 bg-white rounded-lg shadow-lg p-2 sm:p-4 flex flex-col items-center justify-center">
            <h3 className="text-xs text-center sm:text-xl font-bold mb-1 sm:mb-2">{formatStudentName(sortedEntries[0]?.studentName)}</h3>
            <p className="text-xs sm:text-sm text-gray-500">#1</p>
          </div>
        </div>

        {/* Third Place */}
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-amber-600 mb-2">
            <FaMedal className="text-white text-sm sm:text-2xl" />
          </div>
          <div className="w-20 h-16 sm:w-48 sm:h-40 bg-white rounded-lg shadow-lg p-2 sm:p-4 flex flex-col items-center justify-center">
            <h3 className="text-xs sm:text-xl font-bold mb-1 sm:mb-2">{formatStudentName(sortedEntries[2]?.studentName)}</h3>
            <p className="text-xs sm:text-sm text-gray-500">#3</p>
          </div>
        </div>
      </div>

      {/* Remaining Entries Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedEntries.map((entry, index) => (
              <tr key={entry?.id || index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{formatStudentName(entry?.studentName)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const QuizAttemptsTable = ({ attempts, quizStatus, quizId, quizList, quizLeaderboards, currentUser }) => {
  if (!attempts || attempts.length === 0) {
    if (quizStatus === 'available') {
      return (
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <p className="text-blue-800 font-medium">This quiz is available!</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Take the quiz now
          </button>
        </div>
      );
    } else if (quizStatus === 'unavailable') {
      return (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-800">Quiz not available</p>
          <p className="text-gray-600 mt-2">Score: 0</p>
        </div>
      );
    } else if (quizStatus === 'upcoming') {
      return (
        <div className="bg-yellow-50 rounded-lg p-6 text-center">
          <p className="text-yellow-800">Quiz will be available soon</p>
          <p className="text-yellow-600 mt-2">Check back later</p>
        </div>
      );
    }
  }

  // Filter attempts for this specific quiz
  const quizAttempts = attempts.filter(attempt => attempt.quizId === quizId);
  
  if (quizAttempts.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-800">No attempts for this quiz yet</p>
      </div>
    );
  }

  // Sort attempts by attempt number
  const sortedAttempts = [...quizAttempts].sort((a, b) => a.attemptNumber - b.attemptNumber);

  // Calculate average score for this quiz
  const totalScore = quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
  const averageScore = totalScore / quizAttempts.length;

  // Get quiz details including passing score
  const quizDetails = quizList?.find(q => q.id === quizId);
  const passingScore = quizDetails?.passing_score || quizDetails?.passingScore || 0;
  const isPassing = averageScore >= passingScore;

  // Get student's rank in this quiz
  const studentRank = quizLeaderboards[quizId]?.findIndex(
    entry => entry.studentId === currentUser.id
  ) + 1;

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      return formattedDate;
    } catch (error) {
      console.error('[QuizAttemptsTable] Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempt #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Spent (minutes)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAttempts.map((attempt) => {
              // Convert seconds to minutes
              const timeSpentSeconds = attempt.timeSpentSeconds || 0;
              const minutes = Math.floor(timeSpentSeconds / 60);
              const seconds = timeSpentSeconds % 60;
              const formattedTime = `${minutes}.${seconds.toString().padStart(2, '0')}`;
              
              return (
                <tr key={attempt.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {attempt.attemptNumber || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {attempt.score || 0}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formattedTime}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      attempt.passed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {attempt.passed ? 'Passed' : 'Keep Learning'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(attempt.completedAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Final Score Display */}
      <div className="bg-blue-100 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Final Score</h3>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold text-blue-600">
            {averageScore}
            {isPassing && (
              <span className="ml-2 text-sm font-normal text-green-600">(Passed)</span>
            )}
          </p>
          {studentRank && studentRank <= 10 && (
            <span className="text-sm font-medium text-gray-600">
              Rank: #{studentRank}
            </span>
          )}
        </div>
        {passingScore > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            Passing Score: {passingScore}
          </p>
        )}
      </div>

      {/* Formula Note */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-800 mb-2">Score Calculation Formula:</h3>
        <p className="text-sm text-gray-600">
          Final Score = Highest Score / Number of Attempts
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Note: In case of tied scores, ranking is determined by completion time (faster completion ranks higher)
        </p>
      </div>
    </div>
  );
};

const PerformanceGraph = ({ quizData }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper to truncate long labels
  const truncateLabel = (label, maxLength = 20) => {
    if (label.length <= maxLength) return label;
    return `${label.substring(0, maxLength)}...`;
  };

  // Process quiz data to get average scores and attempt information
  const processedData = quizData.map(quiz => {
    const attempts = quiz.attempts || [];

    
    // Use quiz.overallScore as the total points
    let totalPoints = quiz.overallScore || 0;
    
    // If overallScore is not available, try to find it in other properties
    if (totalPoints === 0) {
      // Try to find total points from the first attempt that has totalPoints
      for (const attempt of attempts) {
        if (attempt.totalPoints) {
          totalPoints = attempt.totalPoints;
          break;
        }
        if (attempt.totalQuestions) {
          // Assume 1 point per question if totalPoints not available
          totalPoints = attempt.totalQuestions;
          break;
        }
      }
      
      // If still not found, check other quiz properties
      if (totalPoints === 0) {
        totalPoints = quiz.totalPoints || quiz.totalQuestions || 10; // Default to 10 if no information available
      }
    }
    
    const totalScore = attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
    const averageScore = attempts.length > 0 ? totalScore / attempts.length : 0;
    const highestScore = attempts.reduce((max, attempt) => Math.max(max, attempt.score || 0), 0);
    const averageScorePercentage = totalPoints > 0 ? (averageScore / totalPoints) * 100 : 0;
    const highestScorePercentage = totalPoints > 0 ? (highestScore / totalPoints) * 100 : 0;



    return {
      quizName: quiz.quizName || 'Unnamed Quiz',
      averageScore: Number(averageScorePercentage.toFixed(1)),
      highestScorePercentage: Number(highestScorePercentage.toFixed(1)),
      rawAverageScore: Number(averageScore.toFixed(1)),
      rawHighestScore: highestScore,
      attempts: attempts.length,
      totalPoints: totalPoints
    };
  });

  const data = {
    labels: processedData.map(quiz => truncateLabel(quiz.quizName)),
    datasets: [
        {
            type: 'bar',
            label: 'Highest Score',
            data: processedData.map(quiz => quiz.highestScorePercentage),
            backgroundColor: (context) => {
              const ctx = context.chart.ctx;
              if (!ctx) return 'rgba(196, 181, 253, 0.7)';
              const gradient = ctx.createLinearGradient(0, context.chart.height, 0, 0);
              gradient.addColorStop(0, 'rgba(196, 181, 253, 0.6)');
              gradient.addColorStop(1, 'rgba(196, 181, 253, 0.9)');
              return gradient;
            },
            borderColor: 'rgba(196, 181, 253, 1)',
            barPercentage: 0.5,
            categoryPercentage: 0.5,
          },
          {
            type: 'bar',
            label: 'Average Score',
            data: processedData.map(quiz => quiz.averageScore),
            backgroundColor: (context) => {
              const ctx = context.chart.ctx;
              if (!ctx) return 'rgba(125, 211, 252, 0.7)';
              const gradient = ctx.createLinearGradient(0, context.chart.height, 0, 0);
              gradient.addColorStop(0, 'rgba(125, 211, 252, 0.6)');
              gradient.addColorStop(1, 'rgba(125, 211, 252, 0.9)');
              return gradient;
            },
            borderColor: 'rgba(125, 211, 252, 1)',
            barPercentage: 0.5,
            categoryPercentage: 0.5,
          },
      {
        type: 'line',
        label: 'Performance Trend',
        data: processedData.map(quiz => quiz.averageScore),
        borderColor: 'rgb(30, 58, 138)',
        backgroundColor: 'rgb(30, 58, 138)',
        tension: 0,
        fill: false,
        pointBackgroundColor: 'rgb(30, 58, 138)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(30, 58, 138)',
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBorderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false 
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 12,
        },
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        padding: 15,
        displayColors: true,
        callbacks: {
            title: function(context) {
                return context[0].label;
            },
            label: function(context) {
                const datasetLabel = context.dataset.label || '';
                const value = context.parsed.y;
                if (context.dataset.type === 'line') {
                    return `${datasetLabel}: ${value}%`;
                }
                const quizData = processedData[context.dataIndex];
                if (datasetLabel.includes('Highest')) {
                    return `Highest Score: ${quizData.rawHighestScore}/${quizData.totalPoints} (${value}%)`;
                }
                return `Average Score: ${quizData.rawAverageScore}/${quizData.totalPoints} (${value}%)`;
            },
            afterBody: function(context) {
                const quizData = processedData[context[0].dataIndex];
                return `\nAttempts: ${quizData.attempts}`;
            }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: false,
        },
        grid: {
          drawBorder: false,
          color: 'rgba(200, 200, 200, 0.3)',
        },
        ticks: {
          padding: 10,
          stepSize: 10,
          color: '#6b7280',
        },
      },
      x: {
        title: {
          display: false,
        },
        grid: {
          display: false,
        },
        ticks: {
          autoSkip: true,
          maxRotation: isMobile ? 45 : 0,
          minRotation: isMobile ? 45 : 0,
          color: '#6b7280',
        }
      }
    },
    interaction: {
        mode: 'index',
        intersect: false,
    },
  };

  if (!quizData || quizData.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-800">No quiz data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg py-4 sm:py-8"
    style={{
        backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.1) 0.5px, transparent 0.5px)',
        backgroundSize: '10px 10px',
      }}
    >
      <h3 className="text-lg font-medium text-gray-900 mb-4 px-4 sm:px-6">Overall Performance</h3>
      <div className="h-80 pr-4">
        <Chart type="bar" data={data} options={options} />
      </div>
      <div className="mt-6 text-sm text-gray-600 px-4 sm:px-6">
        <p>This graph shows your average score across all attempts for each quiz.</p>
        <p className="mt-2">Hover over points to see detailed information including number of attempts and highest score achieved.</p>
      </div>
    </div>
  );
};

const Leaderboard = ({ classroomId: propClassroomId }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { classroomId: urlClassroomId } = useParams();
  const [activeTab, setActiveTab] = useState('overall');
  const [activeQuizTab, setActiveQuizTab] = useState('overall');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [quizList, setQuizList] = useState([]);
  const [quizLeaderboards, setQuizLeaderboards] = useState({});
  const [studentQuizData, setStudentQuizData] = useState([]);
  const [studentPerformance, setStudentPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
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
    
    loadData();
  }, [effectiveClassroomId, activeTab, activeQuizTab, currentUser, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'overall') {
        // Load overall leaderboard
        const data = await leaderboardService.getClassroomLeaderboard(effectiveClassroomId);
        setLeaderboardData(data || []);
        
        // Load quiz list and their leaderboards
        const quizzes = await leaderboardService.getQuizzesByClassroom(effectiveClassroomId);
        setQuizList(quizzes || []);
        
        // Load leaderboard for each quiz
        const quizLeaderboardData = {};
        for (const quiz of quizzes) {
          try {
            const leaderboard = await leaderboardService.getLeaderboardByQuiz(quiz.id);
            quizLeaderboardData[quiz.id] = leaderboard || [];
          } catch (error) {
            console.error(`[Leaderboard] Error loading leaderboard for quiz ${quiz.id}:`, error);
            quizLeaderboardData[quiz.id] = [];
          }
        }
        setQuizLeaderboards(quizLeaderboardData);
      } else if (activeTab === 'mystatus') {
        // Load student performance
        const data = await leaderboardService.getStudentPerformance(effectiveClassroomId);
        setStudentPerformance(data || {
          averageScore: 0,
          totalQuizzes: 0,
          totalAvailableQuizzes: 0,
          notTakenQuizzes: 0,
          passedQuizzes: 0,
          failedQuizzes: 0,
          currentRank: "-",
          bestScore: 0,
          recentQuizzes: [],
          improvement: 0,
          streak: 0
        });
      } else if (activeTab === 'myquizzes') {
        // Load available quizzes first
        const availableQuizzes = await leaderboardService.getQuizzesByClassroom(effectiveClassroomId);
        
        // Load student's quiz attempts using current user's ID
        const attempts = await leaderboardService.getStudentQuizAttempts(currentUser.id);
        
        // Group attempts by quiz
        const attemptsByQuiz = attempts.reduce((acc, attempt) => {
          if (!acc[attempt.quizId]) {
            acc[attempt.quizId] = [];
          }
          acc[attempt.quizId].push(attempt);
          return acc;
        }, {});
        
        // Combine available quizzes with attempts
        const combinedData = availableQuizzes.map(quiz => {
          const quizAttempts = attemptsByQuiz[quiz.id] || [];
          return {
            ...quiz,
            attempts: quizAttempts,
            status: quiz.status || 'unavailable'
          };
        });
        
        setStudentQuizData(combinedData);
        setQuizList(availableQuizzes);
      }
    } catch (error) {
      console.error('[Leaderboard] Error loading data:', error);
      if (error.message === 'User not authenticated' || error.response?.status === 401) {
        navigate('/login');
      } else {
        setError(`Failed to load data: ${error.message || 'Unknown error'}`);
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

  const getCurrentQuizName = () => {
    if (activeQuizTab === 'overall') {
      return activeTab === 'overall' ? 'Overall Quizzes' : 'Overall';
    }
    const quiz = quizList.find(q => q.id.toString() === activeQuizTab);
    return quiz?.quizName || 'Select Quiz';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Header type="h2" fontSize="2xl" weight="bold" className="text-center mb-8">Leaderboard</Header>
      
      {/* Main Tabs */}
      <div className="flex justify-center mb-8">
        <nav className="flex space-x-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('overall')}
            className={`px-4 py-2 text-sm font-medium rounded-sm ${
              activeTab === 'overall'
                ? 'bg-blue-900 text-gray-50'
                : 'text-gray-500  hover:text-gray-700'
            }`}
          >
            Overall
          </button>
       
          <button
            onClick={() => setActiveTab('myquizzes')}
            className={`px-4 py-2 text-sm font-medium rounded-sm ${
              activeTab === 'myquizzes'
                ? 'bg-blue-900 text-gray-50'
                : 'text-gray-500  hover:text-gray-700'
            }`}
          >
            My Quizzes
          </button>
        </nav>
      </div>

      {/* Quiz Filter Dropdown - Upper Right */}
      <div className="flex justify-end mb-6">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <div className="flex items-center">
              <MdOutlineQuiz className="mr-2 h-4 w-4" />
              {getCurrentQuizName()}
            </div>
            <FaChevronDown className="ml-2 h-4 w-4" />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="py-1">
                <button
                  onClick={() => {
                    setActiveQuizTab('overall');
                    setIsDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {activeTab === 'overall' ? 'Overall Quizzes' : 'Overall'}
                </button>
                {quizList.map(quiz => (
                  <button
                    key={quiz.id}
                    onClick={() => {
                      setActiveQuizTab(quiz.id.toString());
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {quiz.quizName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overall' && (
        <div>
          {activeQuizTab === 'overall' ? (
            <LeaderboardTable entries={leaderboardData} />
          ) : (
            <LeaderboardTable entries={quizLeaderboards[activeQuizTab] || []} />
          )}
        </div>
      )}

      {activeTab === 'myquizzes' && (
        <div>
          {activeQuizTab === 'overall' ? (
            <PerformanceGraph quizData={studentQuizData || []} />
          ) : (
            <QuizAttemptsTable 
              attempts={studentQuizData?.flatMap(q => q.attempts || []) || []}
              quizStatus={quizList?.find(q => q?.id?.toString() === activeQuizTab)?.status || 'unavailable'}
              quizId={parseInt(activeQuizTab)}
              quizList={quizList}
              quizLeaderboards={quizLeaderboards}
              currentUser={currentUser}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard; 

