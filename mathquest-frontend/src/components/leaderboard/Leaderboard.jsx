// import React, { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { leaderboardService } from '../../services/leaderboardService';
// import { useAuth } from '../../context/AuthContext';
// import { FaTrophy, FaMedal, FaClock, FaChartLine } from 'react-icons/fa';
// import { Line } from 'react-chartjs-2';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend
// } from 'chart.js';

// // Register ChartJS components
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend
// );

// const LeaderboardCard = ({ rank, student, score, isFirst }) => {
//   return (
//     <div className={`flex flex-col items-center justify-center bg-white rounded-lg shadow-lg p-6 ${isFirst ? 'h-80' : 'h-64'}`}>
//       <div className={`w-16 h-16 flex items-center justify-center rounded-full mb-2 ${
//         rank === 1 ? 'bg-yellow-400' : rank === 2 ? 'bg-gray-300' : 'bg-amber-600'
//       }`}>
//         {rank === 1 ? <FaTrophy className="text-white text-2xl" /> : <FaMedal className="text-white text-2xl" />}
//       </div>
//       <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
//       <h3 className="text-xl font-bold mb-2">{student}</h3>
//       <p className="text-gray-600">Score: {score}</p>
//       <p className="text-sm text-gray-500">#{rank}</p>
//     </div>
//   );
// };

// const formatStudentName = (name) => {
//   if (!name) return '-';
  
//   // Split the name into parts
//   const nameParts = name.split(' ');
  
//   // If there's only one part, return it with proper capitalization
//   if (nameParts.length === 1) {
//     return nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase();
//   }
  
//   // If there are multiple parts, format as "LastName, FirstName"
//   const lastName = nameParts[nameParts.length - 1];
//   const firstName = nameParts.slice(0, -1).join(' ');
  
//   // Capitalize first letter of each part
//   const formattedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
//   const formattedFirstName = firstName.split(' ').map(part => 
//     part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
//   ).join(' ');
  
//   return `${formattedLastName}, ${formattedFirstName}`;
// };

// const LeaderboardTable = ({ entries }) => {
//   // Get top 10 entries
//   const topEntries = entries?.slice(0, 10) || [];

//   return (
//     <div className="space-y-8">
//       {/* Top 3 Podium */}
//       <div className="flex justify-center items-end space-x-4 h-80">
//         {/* Second Place */}
//         <div className="flex flex-col items-center">
//           <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-300 mb-2">
//             <FaMedal className="text-white text-2xl" />
//           </div>
//           <div className="w-48 h-48 bg-white rounded-lg shadow-lg p-4 flex flex-col items-center justify-center">
//             <h3 className="text-xl font-bold mb-2">{formatStudentName(topEntries[1]?.studentName)}</h3>
//             <p className="text-sm text-gray-500">#2</p>
//           </div>
//         </div>

//         {/* First Place */}
//         <div className="flex flex-col items-center">
//           <div className="w-16 h-16 flex items-center justify-center rounded-full bg-yellow-400 mb-2">
//             <FaTrophy className="text-white text-2xl" />
//           </div>
//           <div className="w-48 h-56 bg-white rounded-lg shadow-lg p-4 flex flex-col items-center justify-center">
//             <h3 className="text-xl font-bold mb-2">{formatStudentName(topEntries[0]?.studentName)}</h3>
//             <p className="text-sm text-gray-500">#1</p>
//           </div>
//         </div>

//         {/* Third Place */}
//         <div className="flex flex-col items-center">
//           <div className="w-16 h-16 flex items-center justify-center rounded-full bg-amber-600 mb-2">
//             <FaMedal className="text-white text-2xl" />
//           </div>
//           <div className="w-48 h-40 bg-white rounded-lg shadow-lg p-4 flex flex-col items-center justify-center">
//             <h3 className="text-xl font-bold mb-2">{formatStudentName(topEntries[2]?.studentName)}</h3>
//             <p className="text-sm text-gray-500">#3</p>
//           </div>
//         </div>
//       </div>

//       {/* Remaining Entries Table */}
//       <div className="bg-white rounded-lg shadow-lg overflow-hidden">
//         <table className="min-w-full">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {topEntries.map((entry, index) => (
//               <tr key={entry?.id || index} className="hover:bg-gray-50">
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="text-sm font-medium text-gray-900">{formatStudentName(entry?.studentName)}</div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// const QuizAttemptsTable = ({ attempts, quizStatus, quizId, quizList, quizLeaderboards, currentUser }) => {
//   console.log('[QuizAttemptsTable] Received props:', { attempts, quizStatus, quizId, quizList, quizLeaderboards, currentUser });
//   console.log('[QuizAttemptsTable] Raw attempts data:', JSON.stringify(attempts, null, 2));

//   if (!attempts || attempts.length === 0) {
//     if (quizStatus === 'available') {
//       return (
//         <div className="bg-blue-50 rounded-lg p-6 text-center">
//           <p className="text-blue-800 font-medium">This quiz is available!</p>
//           <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
//             Take the quiz now
//           </button>
//         </div>
//       );
//     } else if (quizStatus === 'unavailable') {
//       return (
//         <div className="bg-gray-50 rounded-lg p-6 text-center">
//           <p className="text-gray-800">Quiz not available</p>
//           <p className="text-gray-600 mt-2">Score: 0</p>
//         </div>
//       );
//     } else if (quizStatus === 'upcoming') {
//       return (
//         <div className="bg-yellow-50 rounded-lg p-6 text-center">
//           <p className="text-yellow-800">Quiz will be available soon</p>
//           <p className="text-yellow-600 mt-2">Check back later</p>
//         </div>
//       );
//     }
//   }

//   // Filter attempts for this specific quiz
//   const quizAttempts = attempts.filter(attempt => {
//     console.log('[QuizAttemptsTable] Filtering attempt:', {
//       attemptQuizId: attempt.quizId,
//       targetQuizId: quizId,
//       matches: attempt.quizId === quizId
//     });
//     return attempt.quizId === quizId;
//   });
  
//   console.log('[QuizAttemptsTable] Filtered quiz attempts:', quizAttempts);
  
//   if (quizAttempts.length === 0) {
//     return (
//       <div className="bg-gray-50 rounded-lg p-6 text-center">
//         <p className="text-gray-800">No attempts for this quiz yet</p>
//       </div>
//     );
//   }

//   // Sort attempts by attempt number
//   const sortedAttempts = [...quizAttempts].sort((a, b) => a.attemptNumber - b.attemptNumber);
//   console.log('[QuizAttemptsTable] Sorted attempts:', sortedAttempts);

//   // Calculate average score for this quiz
//   const totalScore = quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
//   const averageScore = totalScore / quizAttempts.length;
//   console.log('[QuizAttemptsTable] Score calculation:', { totalScore, averageScore });

//   // Get quiz details including passing score
//   const quizDetails = quizList?.find(q => q.id === quizId);
//   console.log('[QuizAttemptsTable] Quiz details:', quizDetails);
//   const passingScore = quizDetails?.passing_score || quizDetails?.passingScore || 0;
//   console.log('[QuizAttemptsTable] Passing score:', passingScore);
//   const isPassing = averageScore >= passingScore;

//   // Get student's rank in this quiz
//   const studentRank = quizLeaderboards[quizId]?.findIndex(
//     entry => entry.studentId === currentUser.id
//   ) + 1;

//   // Format date function
//   const formatDate = (dateString) => {
//     console.log('[QuizAttemptsTable] Formatting date:', dateString);
//     if (!dateString) return 'N/A';
    
//     try {
//       const date = new Date(dateString);
//       console.log('[QuizAttemptsTable] Parsed date:', date);
      
//       if (isNaN(date.getTime())) {
//         console.log('[QuizAttemptsTable] Invalid date detected');
//         return 'Invalid Date';
//       }
      
//       const formattedDate = date.toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//       console.log('[QuizAttemptsTable] Formatted date:', formattedDate);
//       return formattedDate;
//     } catch (error) {
//       console.error('[QuizAttemptsTable] Date formatting error:', error);
//       return 'Invalid Date';
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div className="bg-white rounded-lg shadow-lg overflow-hidden">
//         <table className="min-w-full">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempt #</th>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Spent (minutes)</th>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {sortedAttempts.map((attempt) => {
//               console.log('[QuizAttemptsTable] Rendering attempt:', attempt);
              
//               // Convert seconds to minutes
//               const timeSpentSeconds = attempt.timeSpentSeconds || 0;
//               const minutes = Math.floor(timeSpentSeconds / 60);
//               const seconds = timeSpentSeconds % 60;
//               const formattedTime = `${minutes}.${seconds.toString().padStart(2, '0')}`;
              
//               console.log('[QuizAttemptsTable] Time calculation:', {
//                 timeSpentSeconds,
//                 minutes,
//                 seconds,
//                 formattedTime
//               });
              
//               return (
//                 <tr key={attempt.id} className="hover:bg-gray-50">
//                   <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
//                     {attempt.attemptNumber || '-'}
//                   </td>
//                   <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
//                     {attempt.score || 0}
//                   </td>
//                   <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
//                     {formattedTime}
//                   </td>
//                   <td className="px-4 py-3 whitespace-nowrap text-sm">
//                     <span className={`px-2 py-1 rounded-full text-xs ${
//                       attempt.passed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
//                     }`}>
//                       {attempt.passed ? 'Passed' : 'Keep Learning'}
//                     </span>
//                   </td>
//                   <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
//                     {formatDate(attempt.completedAt)}
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* Final Score Display */}
//       <div className="bg-blue-50 rounded-lg p-4">
//         <h3 className="text-lg font-medium text-blue-800 mb-2">Average Score</h3>
//         <div className="flex items-center justify-between">
//           <p className="text-2xl font-bold text-blue-600">
//             {averageScore.toFixed(1)}
//             {isPassing && (
//               <span className="ml-2 text-sm font-normal text-green-600">(Passed)</span>
//             )}
//             {/* {!isPassing && (
//               <span className="ml-2 text-sm font-normal text-blue-600">(Keep Learning)</span>
//             )} */}
//           </p>
//           {studentRank && studentRank <= 10 && (
//             <span className="text-sm font-medium text-gray-600">
//               Rank: #{studentRank}
//             </span>
//           )}
//         </div>
//         {passingScore > 0 && (
//           <p className="text-sm text-gray-600 mt-2">
//             Target Score: {passingScore}
//           </p>
//         )}
//       </div>

//       {/* Formula Note */}
//       <div className="bg-gray-50 rounded-lg p-4">
//         <h3 className="text-sm font-medium text-gray-800 mb-2">Score Calculation Formula:</h3>
//         <p className="text-sm text-gray-600">
//           Average Score = Total Score / Number of Attempts
//         </p>
//         <p className="text-sm text-gray-600 mt-2">
//           Note: In case of tied scores, ranking is determined by completion time (faster completion ranks higher)
//         </p>
//       </div>
//     </div>
//   );
// };

// const PerformanceGraph = ({ quizData }) => {
//   console.log('[PerformanceGraph] Received quiz data:', quizData);

//   // Process quiz data to get average scores and attempt information
//   const processedData = quizData.map(quiz => {
//     const attempts = quiz.attempts || [];
//     const totalScore = attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
//     const averageScore = attempts.length > 0 ? totalScore / attempts.length : 0;
//     const highestScore = attempts.reduce((max, attempt) => Math.max(max, attempt.score || 0), 0);

//     return {
//       quizName: quiz.quizName || 'Unnamed Quiz',
//       averageScore: Number(averageScore.toFixed(1)),
//       attempts: attempts.length,
//       highestScore: highestScore
//     };
//   });

//   console.log('[PerformanceGraph] Processed data:', processedData);

//   const data = {
//     labels: processedData.map(quiz => quiz.quizName),
//     datasets: [
//       {
//         label: 'Average Score',
//         data: processedData.map(quiz => quiz.averageScore),
//         borderColor: 'rgb(75, 192, 192)',
//         backgroundColor: 'rgba(75, 192, 192, 0.2)',
//         tension: 0.1,
//         fill: true
//       }
//     ]
//   };

//   const options = {
//     responsive: true,
//     plugins: {
//       legend: {
//         position: 'top',
//       },
//       title: {
//         display: true,
//         text: 'Performance Across Quizzes'
//       },
//       tooltip: {
//         callbacks: {
//           label: function(context) {
//             const quizData = processedData[context.dataIndex];
//             return [
//               `Average Score: ${quizData.averageScore}`,
//               `Attempts: ${quizData.attempts}`,
//               `Highest Score: ${quizData.highestScore}`
//             ];
//           }
//         }
//       }
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         max: 100,
//         title: {
//           display: true,
//           text: 'Average Score'
//         }
//       },
//       x: {
//         title: {
//           display: true,
//           text: 'Quizzes'
//         }
//       }
//     }
//   };

//   if (!quizData || quizData.length === 0) {
//     return (
//       <div className="bg-gray-50 rounded-lg p-6 text-center">
//         <p className="text-gray-800">No quiz data available</p>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white rounded-lg shadow-lg p-6">
//       <h3 className="text-lg font-medium text-gray-900 mb-4">Overall Performance</h3>
//       <div className="h-80">
//         <Line data={data} options={options} />
//       </div>
//       <div className="mt-4 text-sm text-gray-600">
//         <p>This graph shows your average score across all attempts for each quiz.</p>
//         <p className="mt-2">Hover over points to see detailed information including number of attempts and highest score achieved.</p>
//       </div>
//     </div>
//   );
// };

// const Leaderboard = ({ classroomId: propClassroomId }) => {
//   const navigate = useNavigate();
//   const { currentUser } = useAuth();
//   const { classroomId: urlClassroomId } = useParams();
//   const [activeTab, setActiveTab] = useState('overall');
//   const [activeQuizTab, setActiveQuizTab] = useState('overall');
//   const [leaderboardData, setLeaderboardData] = useState([]);
//   const [quizList, setQuizList] = useState([]);
//   const [quizLeaderboards, setQuizLeaderboards] = useState({});
//   const [studentQuizData, setStudentQuizData] = useState([]);
//   const [studentPerformance, setStudentPerformance] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
  
//   const effectiveClassroomId = propClassroomId || urlClassroomId;

//   useEffect(() => {
//     console.log('[Leaderboard] Component mounted with classroomId:', effectiveClassroomId);
//     console.log('[Leaderboard] Current user:', currentUser);
    
//     if (!currentUser) {
//       console.log('[Leaderboard] No current user, redirecting to login');
//       navigate('/login');
//       return;
//     }
    
//     if (!effectiveClassroomId) {
//       console.log('[Leaderboard] No classroom ID provided');
//       setError('No classroom ID provided');
//       setLoading(false);
//       return;
//     }
    
//     loadData();
//   }, [effectiveClassroomId, activeTab, activeQuizTab, currentUser, navigate]);

//   const loadData = async () => {
//     try {
//       console.log('[Leaderboard] Starting to load data for tab:', activeTab);
//       setLoading(true);
//       setError(null);
      
//       if (activeTab === 'overall') {
//         console.log('[Leaderboard] Loading overall leaderboard data');
//         // Load overall leaderboard
//         const data = await leaderboardService.getClassroomLeaderboard(effectiveClassroomId);
//         console.log('[Leaderboard] Overall leaderboard data:', data);
//         setLeaderboardData(data || []);
        
//         // Load quiz list and their leaderboards
//         console.log('[Leaderboard] Loading quiz list');
//         const quizzes = await leaderboardService.getQuizzesByClassroom(effectiveClassroomId);
//         console.log('[Leaderboard] Quiz list:', quizzes);
//         setQuizList(quizzes || []);
        
//         // Load leaderboard for each quiz
//         console.log('[Leaderboard] Loading individual quiz leaderboards');
//         const quizLeaderboardData = {};
//         for (const quiz of quizzes) {
//           try {
//             console.log('[Leaderboard] Loading leaderboard for quiz:', quiz.id);
//             const leaderboard = await leaderboardService.getLeaderboardByQuiz(quiz.id);
//             console.log('[Leaderboard] Quiz leaderboard data:', leaderboard);
//             quizLeaderboardData[quiz.id] = leaderboard || [];
//           } catch (error) {
//             console.error(`[Leaderboard] Error loading leaderboard for quiz ${quiz.id}:`, error);
//             quizLeaderboardData[quiz.id] = [];
//           }
//         }
//         console.log('[Leaderboard] All quiz leaderboards:', quizLeaderboardData);
//         setQuizLeaderboards(quizLeaderboardData);
//       } else if (activeTab === 'mystatus') {
//         // Load student performance
//         const data = await leaderboardService.getStudentPerformance(effectiveClassroomId);
//         setStudentPerformance(data || {
//           averageScore: 0,
//           totalQuizzes: 0,
//           totalAvailableQuizzes: 0,
//           notTakenQuizzes: 0,
//           passedQuizzes: 0,
//           failedQuizzes: 0,
//           currentRank: "-",
//           bestScore: 0,
//           recentQuizzes: [],
//           improvement: 0,
//           streak: 0
//         });
//       } else if (activeTab === 'myquizzes') {
//         console.log('[Leaderboard] Loading student quiz data');
//         // Load available quizzes first
//         const availableQuizzes = await leaderboardService.getAvailableQuizzes(effectiveClassroomId);
//         console.log('[Leaderboard] Available quizzes:', availableQuizzes);
        
//         // Load student's quiz attempts using current user's ID
//         const attempts = await leaderboardService.getStudentQuizAttempts(currentUser.id);
//         console.log('[Leaderboard] Student quiz attempts:', attempts);
        
//         // Group attempts by quiz
//         const attemptsByQuiz = attempts.reduce((acc, attempt) => {
//           if (!acc[attempt.quizId]) {
//             acc[attempt.quizId] = [];
//           }
//           acc[attempt.quizId].push(attempt);
//           return acc;
//         }, {});
        
//         // Combine available quizzes with attempts
//         const combinedData = availableQuizzes.map(quiz => {
//           const quizAttempts = attemptsByQuiz[quiz.id] || [];
//           return {
//             ...quiz,
//             attempts: quizAttempts,
//             status: quiz.status || 'unavailable'
//           };
//         });
        
//         console.log('[Leaderboard] Combined quiz data:', combinedData);
//         setStudentQuizData(combinedData);
//         setQuizList(availableQuizzes);
//       }
//     } catch (error) {
//       console.error('[Leaderboard] Error loading data:', error);
//       if (error.message === 'User not authenticated' || error.response?.status === 401) {
//         console.log('[Leaderboard] Authentication error, redirecting to login');
//         navigate('/login');
//       } else {
//         setError(`Failed to load data: ${error.message || 'Unknown error'}`);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Add logging for render
//   console.log('[Leaderboard] Rendering with state:', {
//     activeTab,
//     activeQuizTab,
//     leaderboardData,
//     quizList,
//     quizLeaderboards,
//     studentQuizData,
//     loading,
//     error
//   });

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-center text-red-600 p-4">
//         {error}
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//       <h1 className="text-3xl font-bold text-center mb-8">Leaderboard</h1>
      
//       {/* Main Tabs */}
//       <div className="flex justify-center mb-8">
//         <nav className="flex space-x-4" aria-label="Tabs">
//           <button
//             onClick={() => setActiveTab('overall')}
//             className={`px-4 py-2 text-sm font-medium rounded-md ${
//               activeTab === 'overall'
//                 ? 'bg-blue-100 text-blue-700'
//                 : 'text-gray-500 hover:text-gray-700'
//             }`}
//           >
//             Overall
//           </button>
       
//           <button
//             onClick={() => setActiveTab('myquizzes')}
//             className={`px-4 py-2 text-sm font-medium rounded-md ${
//               activeTab === 'myquizzes'
//                 ? 'bg-blue-100 text-blue-700'
//                 : 'text-gray-500 hover:text-gray-700'
//             }`}
//           >
//             My Quizzes
//           </button>
//         </nav>
//       </div>

//       {activeTab === 'overall' && (
//         <div>
//           {/* Quiz Tabs */}
//           <div className="flex justify-center mb-8">
//             <nav className="flex space-x-4 overflow-x-auto" aria-label="Quiz Tabs">
//               <button
//                 onClick={() => setActiveQuizTab('overall')}
//                 className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
//                   activeQuizTab === 'overall'
//                     ? 'bg-blue-100 text-blue-700'
//                     : 'text-gray-500 hover:text-gray-700'
//                 }`}
//               >
//                 Overall Quizzes
//               </button>
//               {quizList.map(quiz => (
//                 <button
//                   key={quiz.id}
//                   onClick={() => setActiveQuizTab(quiz.id.toString())}
//                   className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
//                     activeQuizTab === quiz.id.toString()
//                       ? 'bg-blue-100 text-blue-700'
//                       : 'text-gray-500 hover:text-gray-700'
//                   }`}
//                 >
//                   {quiz.quizName}
//                 </button>
//               ))}
//             </nav>
//           </div>

//           {/* Leaderboard Content */}
//           {activeQuizTab === 'overall' ? (
//             <LeaderboardTable entries={leaderboardData} />
//           ) : (
//             <LeaderboardTable entries={quizLeaderboards[activeQuizTab] || []} />
//           )}
//         </div>
//       )}

//       {activeTab === 'myquizzes' && (
//         <div>
//           {/* Quiz Tabs */}
//           <div className="flex justify-center mb-8">
//             <nav className="flex space-x-4 overflow-x-auto" aria-label="Quiz Tabs">
//               <button
//                 onClick={() => setActiveQuizTab('overall')}
//                 className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
//                   activeQuizTab === 'overall'
//                     ? 'bg-blue-100 text-blue-700'
//                     : 'text-gray-500 hover:text-gray-700'
//                 }`}
//               >
//                 Overall
//               </button>
//               {quizList && quizList.map(quiz => (
//                 <button
//                   key={quiz?.id || Math.random()}
//                   onClick={() => setActiveQuizTab(quiz?.id?.toString() || '')}
//                   className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
//                     activeQuizTab === (quiz?.id?.toString() || '')
//                       ? 'bg-blue-100 text-blue-700'
//                       : 'text-gray-500 hover:text-gray-700'
//                   }`}
//                 >
//                   {quiz?.quizName || 'Unnamed Quiz'}
//                 </button>
//               ))}
//             </nav>
//           </div>

//           {/* Content */}
//           {activeQuizTab === 'overall' ? (
//             <PerformanceGraph quizData={studentQuizData || []} />
//           ) : (
//             <QuizAttemptsTable 
//               attempts={studentQuizData?.flatMap(q => q.attempts || []) || []}
//               quizStatus={quizList?.find(q => q?.id?.toString() === activeQuizTab)?.status || 'unavailable'}
//               quizId={parseInt(activeQuizTab)}
//               quizList={quizList}
//               quizLeaderboards={quizLeaderboards}
//               currentUser={currentUser}
//             />
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Leaderboard; 

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { leaderboardService } from '../../services/leaderboardService';
import { useAuth } from '../../context/AuthContext';
import { FaTrophy, FaMedal, FaClock, FaChartLine } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  console.log('[LeaderboardTable] Received entries:', entries);

  // Get top 10 entries
  const topEntries = entries?.slice(0, 10) || [];
  console.log('[LeaderboardTable] Top entries:', topEntries);

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
  console.log('[LeaderboardTable] Sorted entries:', sortedEntries);

  // Add logging for final scores
  console.log('[LeaderboardTable] Final scores for ranked students:', 
    sortedEntries.map((entry, index) => ({
      rank: index + 1,
      studentName: entry?.studentName,
      finalScore: entry?.finalScore || 0,
      totalScores: entry?.totalScores || 0,
      attempts: entry?.attempts || 0,
      time: entry?.fastestTimeSeconds ? 
        `${Math.floor(entry.fastestTimeSeconds / 60)}m ${entry.fastestTimeSeconds % 60}s` : 
        'N/A'
    }))
  );

  return (
    <div className="space-y-8">
      {/* Top 3 Podium */}
      <div className="flex justify-center items-end space-x-4 h-80">
        {/* Second Place */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-300 mb-2">
            <FaMedal className="text-white text-2xl" />
          </div>
          <div className="w-48 h-48 bg-white rounded-lg shadow-lg p-4 flex flex-col items-center justify-center">
            <h3 className="text-xl font-bold mb-2">{formatStudentName(sortedEntries[1]?.studentName)}</h3>
            <p className="text-sm text-gray-500">#2</p>
            {/* <p className="text-sm text-gray-600">Total Score: {sortedEntries[1]?.totalScores || 0}</p>
            <p className="text-sm text-gray-600">Final Score: {sortedEntries[1]?.finalScore?.toFixed(2) || 0}</p>
            <p className="text-sm text-gray-600">Attempts: {sortedEntries[1]?.attempts || 0}</p>
            {sortedEntries[1]?.fastestTimeSeconds && (
              <p className="text-sm text-gray-600">
                Time: {Math.floor(sortedEntries[1].fastestTimeSeconds / 60)}m {sortedEntries[1].fastestTimeSeconds % 60}s
              </p>
            )} */}
          </div>
        </div>

        {/* First Place */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-yellow-400 mb-2">
            <FaTrophy className="text-white text-2xl" />
          </div>
          <div className="w-48 h-56 bg-white rounded-lg shadow-lg p-4 flex flex-col items-center justify-center">
            <h3 className="text-xl font-bold mb-2">{formatStudentName(sortedEntries[0]?.studentName)}</h3>
            <p className="text-sm text-gray-500">#1</p>
           
          </div>
        </div>

        {/* Third Place */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-amber-600 mb-2">
            <FaMedal className="text-white text-2xl" />
          </div>
          <div className="w-48 h-40 bg-white rounded-lg shadow-lg p-4 flex flex-col items-center justify-center">
            <h3 className="text-xl font-bold mb-2">{formatStudentName(sortedEntries[2]?.studentName)}</h3>
            <p className="text-sm text-gray-500">#3</p>
           
          </div>
        </div>
      </div>

      {/* Remaining Entries Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
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
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry?.totalScores || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry?.finalScore?.toFixed(2) || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry?.fastestTimeSeconds ? 
                    `${Math.floor(entry.fastestTimeSeconds / 60)}m ${entry.fastestTimeSeconds % 60}s` : 
                    'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry?.attempts || 0}
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};



const QuizAttemptsTable = ({ attempts, quizStatus, quizId, quizList, quizLeaderboards, currentUser }) => {
  console.log('[QuizAttemptsTable] Received props:', { attempts, quizStatus, quizId, quizList, quizLeaderboards, currentUser });
  console.log('[QuizAttemptsTable] Raw attempts data:', JSON.stringify(attempts, null, 2));

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
  const quizAttempts = attempts.filter(attempt => {
    console.log('[QuizAttemptsTable] Filtering attempt:', {
      attemptQuizId: attempt.quizId,
      targetQuizId: quizId,
      matches: attempt.quizId === quizId
    });
    return attempt.quizId === quizId;
  });
  
  console.log('[QuizAttemptsTable] Filtered quiz attempts:', quizAttempts);
  
  if (quizAttempts.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-800">No attempts for this quiz yet</p>
      </div>
    );
  }

  // Sort attempts by attempt number
  const sortedAttempts = [...quizAttempts].sort((a, b) => a.attemptNumber - b.attemptNumber);
  console.log('[QuizAttemptsTable] Sorted attempts:', sortedAttempts);

  // Calculate average score for this quiz
  const totalScore = quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
  const averageScore = totalScore / quizAttempts.length;
  console.log('[QuizAttemptsTable] Score calculation:', { totalScore, averageScore });

  // Get quiz details including passing score
  const quizDetails = quizList?.find(q => q.id === quizId);
  console.log('[QuizAttemptsTable] Quiz details:', quizDetails);
  const passingScore = quizDetails?.passing_score || quizDetails?.passingScore || 0;
  console.log('[QuizAttemptsTable] Passing score:', passingScore);
  const isPassing = averageScore >= passingScore;

  // Get student's rank in this quiz
  const studentRank = quizLeaderboards[quizId]?.findIndex(
    entry => entry.studentId === currentUser.id
  ) + 1;

  // Format date function
  const formatDate = (dateString) => {
    console.log('[QuizAttemptsTable] Formatting date:', dateString);
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      console.log('[QuizAttemptsTable] Parsed date:', date);
      
      if (isNaN(date.getTime())) {
        console.log('[QuizAttemptsTable] Invalid date detected');
        return 'Invalid Date';
      }
      
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      console.log('[QuizAttemptsTable] Formatted date:', formattedDate);
      return formattedDate;
    } catch (error) {
      console.error('[QuizAttemptsTable] Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
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
              console.log('[QuizAttemptsTable] Rendering attempt:', attempt);
              
              // Convert seconds to minutes
              const timeSpentSeconds = attempt.timeSpentSeconds || 0;
              const minutes = Math.floor(timeSpentSeconds / 60);
              const seconds = timeSpentSeconds % 60;
              const formattedTime = `${minutes}.${seconds.toString().padStart(2, '0')}`;
              
              console.log('[QuizAttemptsTable] Time calculation:', {
                timeSpentSeconds,
                minutes,
                seconds,
                formattedTime
              });
              
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
      <div className="bg-blue-50 rounded-lg p-4">
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
  console.log('[PerformanceGraph] Received quiz data:', quizData);

  // Process quiz data to get average scores and attempt information
  const processedData = quizData.map(quiz => {
    const attempts = quiz.attempts || [];
    const totalScore = attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
    const averageScore = attempts.length > 0 ? totalScore / attempts.length : 0;
    const highestScore = attempts.reduce((max, attempt) => Math.max(max, attempt.score || 0), 0);

    return {
      quizName: quiz.quizName || 'Unnamed Quiz',
      averageScore: Number(averageScore.toFixed(1)),
      attempts: attempts.length,
      highestScore: highestScore
    };
  });

  console.log('[PerformanceGraph] Processed data:', processedData);

  const data = {
    labels: processedData.map(quiz => quiz.quizName),
    datasets: [
      {
        label: 'Average Score',
        data: processedData.map(quiz => quiz.averageScore),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        fill: true
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      maintainAspectRatio: false,
      legend: {
        display: false 
      },
      tooltip: {
        enabled: true 
      },
      title: {
        display: true,
        text: 'Performance Across Quizzes'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const quizData = processedData[context.dataIndex];
            return [
              `Average Score: ${quizData.averageScore}`,
              `Attempts: ${quizData.attempts}`,
              `Highest Score: ${quizData.highestScore}`
            ];
          }
        }
      }
      
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Average Score'
        },
        ticks: {
          padding: 10
        },
      },
      x: {
        title: {
          display: true,
          text: 'Quizzes'
        },


       
        
      }
    }
  };

  if (!quizData || quizData.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-800">No quiz data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Overall Performance</h3>
      <div className="h-80">
        <Line data={data} options={options} />
      </div>
      <div className="mt-4 text-sm text-gray-600">
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
  
  const effectiveClassroomId = propClassroomId || urlClassroomId;

  useEffect(() => {
    console.log('[Leaderboard] Component mounted with classroomId:', effectiveClassroomId);
    console.log('[Leaderboard] Current user:', currentUser);
    
    if (!currentUser) {
      console.log('[Leaderboard] No current user, redirecting to login');
      navigate('/login');
      return;
    }
    
    if (!effectiveClassroomId) {
      console.log('[Leaderboard] No classroom ID provided');
      setError('No classroom ID provided');
      setLoading(false);
      return;
    }
    
    loadData();
  }, [effectiveClassroomId, activeTab, activeQuizTab, currentUser, navigate]);

  const loadData = async () => {
    try {
      console.log('[Leaderboard] Starting to load data for tab:', activeTab);
      setLoading(true);
      setError(null);
      
      if (activeTab === 'overall') {
        console.log('[Leaderboard] Loading overall leaderboard data');
        // Load overall leaderboard
        const data = await leaderboardService.getClassroomLeaderboard(effectiveClassroomId);
        console.log('[Leaderboard] Overall leaderboard data:', data);
        setLeaderboardData(data || []);
        
        // Load quiz list and their leaderboards
        console.log('[Leaderboard] Loading quiz list');
        const quizzes = await leaderboardService.getQuizzesByClassroom(effectiveClassroomId);
        console.log('[Leaderboard] Quiz list:', quizzes);
        setQuizList(quizzes || []);
        
        // Load leaderboard for each quiz
        console.log('[Leaderboard] Loading individual quiz leaderboards');
        const quizLeaderboardData = {};
        for (const quiz of quizzes) {
          try {
            console.log('[Leaderboard] Loading leaderboard for quiz:', quiz.id);
            const leaderboard = await leaderboardService.getLeaderboardByQuiz(quiz.id);
            console.log('[Leaderboard] Quiz leaderboard data:', leaderboard);
            quizLeaderboardData[quiz.id] = leaderboard || [];
          } catch (error) {
            console.error(`[Leaderboard] Error loading leaderboard for quiz ${quiz.id}:`, error);
            quizLeaderboardData[quiz.id] = [];
          }
        }
        console.log('[Leaderboard] All quiz leaderboards:', quizLeaderboardData);
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
        console.log('[Leaderboard] Loading student quiz data');
        // Load available quizzes first
        const availableQuizzes = await leaderboardService.getAvailableQuizzes(effectiveClassroomId);
        console.log('[Leaderboard] Available quizzes:', availableQuizzes);
        
        // Load student's quiz attempts using current user's ID
        const attempts = await leaderboardService.getStudentQuizAttempts(currentUser.id);
        console.log('[Leaderboard] Student quiz attempts:', attempts);
        
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
        
        console.log('[Leaderboard] Combined quiz data:', combinedData);
        setStudentQuizData(combinedData);
        setQuizList(availableQuizzes);
      }
    } catch (error) {
      console.error('[Leaderboard] Error loading data:', error);
      if (error.message === 'User not authenticated' || error.response?.status === 401) {
        console.log('[Leaderboard] Authentication error, redirecting to login');
        navigate('/login');
      } else {
        setError(`Failed to load data: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add logging for render
  console.log('[Leaderboard] Rendering with state:', {
    activeTab,
    activeQuizTab,
    leaderboardData,
    quizList,
    quizLeaderboards,
    studentQuizData,
    loading,
    error
  });

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Leaderboard</h1>
      
      {/* Main Tabs */}
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
            onClick={() => setActiveTab('myquizzes')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'myquizzes'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Quizzes
          </button>
        </nav>
      </div>

      {activeTab === 'overall' && (
        <div>
          {/* Quiz Tabs */}
          <div className="flex justify-center mb-8">
            <nav className="flex space-x-4 overflow-x-auto" aria-label="Quiz Tabs">
              <button
                onClick={() => setActiveQuizTab('overall')}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  activeQuizTab === 'overall'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overall Quizzes
              </button>
              {quizList.map(quiz => (
                <button
                  key={quiz.id}
                  onClick={() => setActiveQuizTab(quiz.id.toString())}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                    activeQuizTab === quiz.id.toString()
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {quiz.quizName}
                </button>
              ))}
            </nav>
          </div>

          {/* Leaderboard Content */}
          {activeQuizTab === 'overall' ? (
            <LeaderboardTable entries={leaderboardData} />
          ) : (
            <LeaderboardTable entries={quizLeaderboards[activeQuizTab] || []} />
          )}
        </div>
      )}

      {activeTab === 'myquizzes' && (
        <div>
          {/* Quiz Tabs */}
          <div className="flex justify-center mb-8">
            <nav className="flex space-x-4 overflow-x-auto" aria-label="Quiz Tabs">
              <button
                onClick={() => setActiveQuizTab('overall')}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  activeQuizTab === 'overall'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overall
              </button>
              {quizList && quizList.map(quiz => (
                <button
                  key={quiz?.id || Math.random()}
                  onClick={() => setActiveQuizTab(quiz?.id?.toString() || '')}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                    activeQuizTab === (quiz?.id?.toString() || '')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {quiz?.quizName || 'Unnamed Quiz'}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
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

