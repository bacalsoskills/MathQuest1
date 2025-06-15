// import React, { useState, useEffect, useCallback } from 'react';
// import { useParams, useNavigate, useLocation } from 'react-router-dom';
// import { toast } from 'react-hot-toast';
// import quizService from '../../services/quizService';
// import { useAuth } from '../../context/AuthContext';
// import { FaArrowLeft, FaArrowRight, FaVolumeUp, FaTimes, FaTrophy } from 'react-icons/fa';
// import api from '../../services/api';

// // Placeholder for actual UI components, will be built out
// const MultipleChoiceQuestion = ({ question, onAnswer, selectedAnswer }) => {
//   return (
//     <div className="space-y-3">
//       {question.options.map((option, index) => {
//         const isSelected = selectedAnswer === option;
//         let buttonClass = `w-full text-left p-4 rounded-lg transition-colors
//           ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white hover:bg-gray-50'} 
//           text-black border border-gray-200`;
        
//         return (
//           <button
//             key={index}
//             onClick={() => onAnswer(question.id, option)}
//             className={buttonClass}
//           >
//             {option}
//           </button>
//         );
//       })}
//     </div>
//   );
// };

// // Add new ReviewModal component
// const ReviewModal = ({ show, onHide, questions, answers, onSubmit }) => {
//   if (!show) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
//         <div className="flex justify-between items-center border-b p-4">
//           <h3 className="text-xl font-semibold">Review Your Answers</h3>
//           <button 
//             onClick={onHide}
//             className="text-gray-500 hover:text-gray-700"
//           >
//             ×
//           </button>
//         </div>
//         <div className="p-6 overflow-y-auto flex-grow">
//           <div className="space-y-6">
//             {questions.map((question, index) => {
//               const questionId = question.id || `question_${index}`;
//               const userAnswer = answers[questionId];
//               const isAnswered = userAnswer !== undefined && 
//                                (Array.isArray(userAnswer) ? userAnswer.length > 0 : userAnswer !== '');

//               return (
//                 <div key={questionId} className="bg-gray-50 p-4 rounded-lg">
//                   <div className="flex items-start gap-3">
//                     <span className="font-semibold text-gray-700 min-w-[2rem]">{index + 1}.</span>
//                     <div className="flex-grow">
//                       <p className="text-gray-800 mb-2">{question.questionText || question.question}</p>
//                       <div className="mt-2">
//                         <p className="text-sm font-medium text-gray-600">Your Answer:</p>
//                         {isAnswered ? (
//                           <div className="mt-1">
//                             {Array.isArray(userAnswer) ? (
//                               <ul className="list-disc list-inside">
//                                 {userAnswer.map((ans, i) => (
//                                   <li key={i} className="text-gray-700">{ans}</li>
//                                 ))}
//                               </ul>
//                             ) : (
//                               <p className="text-gray-700">{userAnswer}</p>
//                             )}
//                           </div>
//                         ) : (
//                           <p className="text-red-500 italic">Not answered</p>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//         <div className="border-t p-4 flex justify-end space-x-3">
//           <button 
//             onClick={onHide}
//             className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded text-gray-800"
//           >
//             Back to Quiz
//           </button>
//           <button 
//             onClick={onSubmit}
//             className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded text-white"
//           >
//             Submit Quiz
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Modify IdentificationQuestion to reset on question change
// const IdentificationQuestion = ({ question, onAnswer, currentAnswer, questionId }) => {
//   const [inputValue, setInputValue] = useState('');

//   // Reset input when question changes
//   useEffect(() => {
//     setInputValue(currentAnswer || '');
//   }, [questionId, currentAnswer]);

//   const handleChange = (e) => {
//     setInputValue(e.target.value);
//     onAnswer(question.id, e.target.value, false); // Pass false to indicate not auto-advancing
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter') {
//       onAnswer(question.id, inputValue, true); // Pass true to indicate auto-advancing
//     }
//   };

//   return (
//     <div>
//       <input
//         type="text"
//         value={inputValue}
//         onChange={handleChange}
//         onKeyPress={handleKeyPress}
//         placeholder="Type your answer here"
//         className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
//       />
//     </div>
//   );
// };

// const CheckboxQuestion = ({ question, onAnswer, selectedAnswers = [] }) => {
//   const handleCheckboxChange = (option) => {
//     const newAnswers = selectedAnswers.includes(option)
//       ? selectedAnswers.filter(ans => ans !== option)
//       : [...selectedAnswers, option];
//     onAnswer(question.id, newAnswers);
//   };

//   return (
//     <div className="space-y-3">
//       {question.options.map((option, index) => {
//         const isSelected = selectedAnswers.includes(option);
//         return (
//           <label
//             key={index}
//             className={`flex items-center p-4 rounded-lg cursor-pointer transition-colors border 
//               ${isSelected 
//                 ? 'bg-blue-100 border-blue-500 font-semibold' 
//                 : 'bg-gray-50 border-gray-300 opacity-85 hover:opacity-100 hover:bg-gray-100'}`}
//           >
//             <input
//               type="checkbox"
//               checked={isSelected}
//               onChange={() => handleCheckboxChange(option)}
//               className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
//             />
//             <span className={`${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{option}</span>
//           </label>
//         );
//       })}
//     </div>
//   );
// };

// // Results modal component
// const QuizResultModal = ({ show, onHide, result, onViewLeaderboard }) => {
//   if (!result || !show) return null;
  
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto overflow-hidden">
//         <div className="flex justify-between items-center border-b p-4">
//           <h3 className="text-xl font-semibold">Quiz Results</h3>
//           <button 
//             onClick={onHide}
//             className="text-gray-500 hover:text-gray-700"
//           >
//             ×
//           </button>
//         </div>
//         <div className="p-6">
//           <div className="text-center">
//             <div className="mb-4">
//               <div className="text-5xl font-bold text-blue-600 mb-2">{result.score}%</div>
//               <div className="text-lg text-gray-700">
//                 {result.passed ? 
//                   <span className="text-green-600 font-semibold">Passed</span> : 
//                   <span className="text-red-600 font-semibold">Try Again</span>
//                 }
//               </div>
//               <div className="mt-2 text-gray-600">
//                 Points: <span className="font-semibold">{result.pointsEarned}</span> / <span>{result.totalPoints}</span>
//               </div>
//             </div>
            
//             <div className="bg-gray-100 p-4 rounded-lg mb-4">
//               <div className="grid grid-cols-2 gap-3 text-left">
//                 <div>
//                   <p className="text-sm text-gray-500">Quiz Name</p>
//                   <p className="font-medium">{result.quizName}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-500">Attempt</p>
//                   <p className="font-medium">{result.attemptNumber}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-500">Time Spent</p>
//                   <p className="font-medium">{result.formattedTimeSpent || 'N/A'}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-500">Rank</p>
//                   <p className="font-medium">{result.rank || 'N/A'}</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//         <div className="border-t p-4 flex justify-end space-x-3">
//           <button 
//             onClick={onHide}
//             className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded text-gray-800"
//           >
//             Return to Classroom
//           </button>
//           <button 
//             onClick={onViewLeaderboard}
//             className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white flex items-center"
//           >
//             <FaTrophy className="mr-2" /> View Leaderboard
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };


// const QuizAttemptPage = () => {
//   const { quizId, attemptId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { currentUser: user } = useAuth();
//   const [quizDetails, setQuizDetails] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [answers, setAnswers] = useState({});
//   const [showResultModal, setShowResultModal] = useState(false);
//   const [quizResult, setQuizResult] = useState(null);
//   const { onComplete, activityId } = location.state || {};
//   const [timeLeft, setTimeLeft] = useState(null);
//   const [error, setError] = useState(null);
//   const [isMuted, setIsMuted] = useState(false);
//   const [classroomId, setClassroomId] = useState(null);
//   const [showReviewModal, setShowReviewModal] = useState(false);

//   // Fetch quiz and attempt details
//   useEffect(() => {
//     const fetchQuizData = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         const quizData = await quizService.getQuiz(quizId);
//         const attemptData = await quizService.getQuizAttempt(attemptId);

//         if (!quizData || !attemptData) {
//           throw new Error('Quiz or attempt data not found.');
//         }

//         // Get the activity data to find the classroom ID
//         if (quizData.activityId) {
//           try {
//             const activityResponse = await api.get(`/activities/${quizData.activityId}`);
//             const activityData = activityResponse.data;
//             setClassroomId(activityData.classroomId);
//           } catch (activityError) {
//             console.error('Error fetching activity data:', activityError);
//             toast.error('Failed to load classroom information');
//           }
//         }
        
//         // Parse quizContent if it's a string
//         let parsedQuestions = quizData.quizContent;
//         if (typeof quizData.quizContent === 'string') {
//           try {
//             parsedQuestions = JSON.parse(quizData.quizContent);
//           } catch (e) {
//             console.error("Failed to parse quizContent:", e);
//             throw new Error("Invalid quiz content format.");
//           }
//         }
        
//         if (!Array.isArray(parsedQuestions)) {
//              console.error("Parsed quiz content is not an array:", parsedQuestions);
//              throw new Error("Quiz content is not structured as an array of questions.");
//         }

//         // Ensure each question has an ID
//         parsedQuestions = parsedQuestions.map((q, index) => {
//           if (!q.id) {
//             return { ...q, id: `question_${index}` };
//           }
//           return q;
//         });

//         setQuizDetails({ ...quizData, questions: parsedQuestions });
        
//         // Initialize answers from attempt if any, or empty
//         setAnswers(attemptData.answers ? JSON.parse(attemptData.answers) : {});

//         if (quizData.timeLimitMinutes && quizData.timeLimitMinutes > 0) {
//           const timeLimitSeconds = quizData.timeLimitMinutes * 60;
          
//           // Parse the startedAt timestamp correctly
//           const startTime = new Date(attemptData.startedAt).getTime();
//           const now = new Date().getTime();
          
//           // Calculate time elapsed since starting the quiz
//           const elapsedSeconds = Math.floor((now - startTime) / 1000);
          
//           // Calculate remaining time
//           const remaining = Math.max(timeLimitSeconds - elapsedSeconds, 0);
//           console.log(`Time limit: ${timeLimitSeconds}s, Elapsed: ${elapsedSeconds}s, Remaining: ${remaining}s`);
          
//           setTimeLeft(remaining);
//         }
        
//       } catch (err) {
//         console.error('Error fetching quiz data:', err);
//         setError(err.message || 'Failed to load quiz. Please try again.');
//         toast.error(err.message || 'Failed to load quiz.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (quizId && attemptId && user) {
//       fetchQuizData();
//     } else if (!user) {
//         navigate('/login');
//         toast.error('Please log in to take the quiz.');
//     }
//   }, [quizId, attemptId, user, navigate]);

//   // Timer logic
//   useEffect(() => {
//     // Only set up timer if timeLeft is positive
//     if (!timeLeft || timeLeft <= 0) {
//       if (timeLeft === 0) handleSubmitQuiz(); // Auto-submit if time runs out
//       return;
//     }
    
//     // Reduce logging - only log significant changes
//     if (timeLeft % 60 === 0) {
//       console.log(`Timer: ${Math.floor(timeLeft / 60)} minutes remaining`);
//     }
    
//     const timerId = setInterval(() => {
//       setTimeLeft(prevTime => {
//         const newTime = prevTime - 1;
//         if (newTime <= 0) {
//           console.log('Timer reached zero, auto-submitting');
//           clearInterval(timerId);
//           return 0;
//         }
//         return newTime;
//       });
//     }, 1000);
    
//     // Clean up the interval on component unmount
//     return () => clearInterval(timerId);
//   }, [timeLeft]);

//   // Add keyboard event handler
//   useEffect(() => {
//     const handleKeyPress = (e) => {
//       if (e.key === 'Enter') {
//         // If on last question, trigger submit
//         if (currentQuestionIndex === quizDetails?.questions?.length - 1) {
//           handleSubmitQuiz();
//         } else {
//           // Otherwise go to next question
//           goToNextQuestion();
//         }
//       }
//     };

//     // Add event listener
//     window.addEventListener('keypress', handleKeyPress);

//     // Cleanup
//     return () => {
//       window.removeEventListener('keypress', handleKeyPress);
//     };
//   }, [currentQuestionIndex, quizDetails?.questions?.length]);

//   // Remove auto-advance from handleAnswerSelect
//   const handleAnswerSelect = useCallback((questionId, answer) => {
//     // Make sure we have a valid ID
//     const validQuestionId = questionId || `question_${currentQuestionIndex}`;
    
//     console.log(`Saving answer for question ID: ${validQuestionId}`, answer);
    
//     setAnswers(prevAnswers => ({
//       ...prevAnswers,
//       [validQuestionId]: answer,
//     }));
//   }, [currentQuestionIndex]);

//   const currentQuestion = quizDetails?.questions?.[currentQuestionIndex];

//   const renderQuestion = () => {
//     if (!currentQuestion) return <p>No question to display.</p>;

//     switch (currentQuestion.questionType) {
//       case 'MULTIPLE_CHOICE':
//         return (
//           <MultipleChoiceQuestion
//             question={currentQuestion}
//             onAnswer={handleAnswerSelect}
//             selectedAnswer={answers[currentQuestion.id]}
//           />
//         );
//       case 'IDENTIFICATION':
//         return (
//           <IdentificationQuestion
//             question={currentQuestion}
//             onAnswer={handleAnswerSelect}
//             currentAnswer={answers[currentQuestion.id]}
//             questionId={currentQuestion.id}
//           />
//         );
//       case 'CHECKBOX':
//         return (
//           <CheckboxQuestion
//             question={currentQuestion}
//             onAnswer={handleAnswerSelect}
//             selectedAnswers={answers[currentQuestion.id]}
//           />
//         );
//       default:
//         return <p>Unsupported question type: {currentQuestion.questionType}</p>;
//     }
//   };
  
//   const goToNextQuestion = () => {
//     if (currentQuestionIndex < quizDetails.questions.length - 1) {
//       setCurrentQuestionIndex(prevIndex => prevIndex + 1);
//     }
//   };

//   const goToPreviousQuestion = () => {
//     if (currentQuestionIndex > 0) {
//       setCurrentQuestionIndex(prevIndex => prevIndex - 1);
//     }
//   };

//   const calculateScore = () => {
//     if (!quizDetails?.questions || quizDetails.questions.length === 0) return 0;
    
//     let totalCorrect = 0;
//     let totalQuestions = quizDetails.questions.length;
//     let totalPoints = 0;
//     let earnedPoints = 0;
    
//     quizDetails.questions.forEach(question => {
//       const questionId = question.id || `question_${question.index}`;
//       const userAnswer = answers[questionId];
      
//       if (!userAnswer) return; // No answer provided
      
//       const correctAnswer = question.correctAnswer;
      
//       if (!correctAnswer) return; // No correct answer defined
      
//       // Get points for this question (default to 1 if not specified)
//       const questionPoints = question.points || 1;
//       totalPoints += questionPoints;
      
//       let isCorrect = false;
      
//       if (question.questionType === 'CHECKBOX') {
//         // For checkbox, check if arrays match exactly (same elements)
//         if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
//           isCorrect = userAnswer.length === correctAnswer.length && 
//                      correctAnswer.every(item => userAnswer.includes(item)) &&
//                      userAnswer.every(item => correctAnswer.includes(item));
//         }
//       } else if (question.questionType === 'IDENTIFICATION') {
//         // For identification, do case-insensitive comparison and trim whitespace
//         const formattedUserAnswer = (userAnswer || '').toLowerCase().trim();
//         const formattedCorrectAnswer = (correctAnswer || '').toLowerCase().trim();
//         isCorrect = formattedUserAnswer === formattedCorrectAnswer;
//       } else {
//         // For multiple choice
//         isCorrect = userAnswer === correctAnswer;
//       }
      
//       if (isCorrect) {
//         totalCorrect++;
//         earnedPoints += questionPoints;
//       }
//     });
    
//     return {
//       totalCorrect,
//       totalQuestions,
//       earnedPoints,
//       totalPoints,
//       percentageScore: Math.round((earnedPoints / totalPoints) * 100)
//     };
//   };

//   const handleViewLeaderboard = () => {
//     if (classroomId) {
//       navigate(`/student/classrooms/${classroomId}`, { state: { activeTab: 'leaderboard' } });
//     } else {
//       toast.error('Unable to access leaderboard: Classroom information not found');
//       // Stay on the current page instead of navigating away
//     }
//   };

//   const handleSubmitQuiz = async () => {
//     try {
//       setLoading(true);
      
//       // Calculate scores
//       const scoreResult = calculateScore();
      
//       // Submit the quiz with earned points as score
//       const result = await quizService.completeQuizAttempt(
//         attemptId, 
//         scoreResult.earnedPoints,
//         JSON.stringify(answers)
//       );
      
//       console.log('Quiz submission successful:', result);
      
//       // Set result for modal with additional information
//       setQuizResult({
//         ...result,
//         score: scoreResult.percentageScore,
//         pointsEarned: scoreResult.earnedPoints,
//         totalPoints: scoreResult.totalPoints,
//         passed: scoreResult.earnedPoints >= quizDetails.passing_score
//       });
//       setShowResultModal(true);
      
//       // Call the onComplete callback if it exists
//       if (onComplete) {
//         console.log('Calling onComplete callback with score:', scoreResult.percentageScore);
//         onComplete(scoreResult.percentageScore);
//       }
      
//       toast.success('Quiz submitted successfully!');
      
//     } catch (error) {
//       console.error('Error submitting quiz:', error);
//       let errorMessage = 'Failed to submit quiz. Please try again.';
//       if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       } else if (error.message) {
//         errorMessage = error.message;
//       }
//       toast.error(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Modify handleExitQuiz to use consistent score calculation
//   const handleExitQuiz = async () => {
//     const confirmExit = () => {
//       toast((t) => (
//         <div className="flex flex-col items-center">
//           <p className="mb-2">Are you sure you want to exit? Your progress will be recorded.</p>
//           <div className="flex space-x-2">
//             <button
//               className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
//               onClick={async () => {
//                 toast.dismiss(t.id);
//                 try {
//                   // Calculate points earned consistently
//                   let pointsEarned = 0;
//                   let totalPoints = 0;
                  
//                   quizDetails.questions.forEach(question => {
//                     const questionId = question.id || `question_${question.index}`;
//                     const points = question.points || 1;
//                     totalPoints += points;
                    
//                     const userAnswer = answers[questionId];
//                     const correctAnswer = question.correctAnswer;
                    
//                     if (userAnswer && correctAnswer) {
//                       let isCorrect = false;
                      
//                       if (question.questionType === 'CHECKBOX') {
//                         if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
//                           isCorrect = userAnswer.length === correctAnswer.length && 
//                                      correctAnswer.every(item => userAnswer.includes(item)) &&
//                                      userAnswer.every(item => correctAnswer.includes(item));
//                         }
//                       } else if (question.questionType === 'IDENTIFICATION') {
//                         const formattedUserAnswer = (userAnswer || '').toLowerCase().trim();
//                         const formattedCorrectAnswer = (correctAnswer || '').toLowerCase().trim();
//                         isCorrect = formattedUserAnswer === formattedCorrectAnswer;
//                       } else {
//                         isCorrect = userAnswer === correctAnswer;
//                       }
                      
//                       if (isCorrect) {
//                         pointsEarned += points;
//                       }
//                     }
//                   });

//                   // Submit with pointsEarned
//                   await quizService.completeQuizAttempt(
//                     attemptId,
//                     pointsEarned, // Always use pointsEarned for database
//                     JSON.stringify(answers)
//                   );
                  
//                   toast.success('Quiz progress saved!');
//                   if(classroomId) {
//                     navigate(`/student/classrooms/${classroomId}`);
//                   } else {
//                     navigate('/student/classrooms');
//                   }
//                 } catch (error) {
//                   console.error('Error saving quiz progress:', error);
//                   toast.error('Failed to save quiz progress');
//                 }
//               }}
//             >
//               Yes, Exit
//             </button>
//             <button
//               className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
//               onClick={() => toast.dismiss(t.id)}
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       ), {
//         duration: 5000,
//         position: 'top-center',
//       });
//     };

//     confirmExit();
//   };

//   const handleModalClose = () => {
//     setShowResultModal(false);
//     // Navigate back to classroom page
//     if(classroomId) {
//       navigate(`/student/classrooms/${classroomId}`);
//     } else {
//       navigate('/student/classrooms'); // Fallback
//     }
//   };


//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen bg-blue-100">
//         <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex flex-col justify-center items-center h-screen bg-red-100 text-red-700 p-8">
//         <h2 className="text-2xl font-bold mb-4">Error</h2>
//         <p className="text-center mb-4">{error}</p>
//         <button 
//           onClick={() => navigate(-1)}
//           className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
//         >
//           Go Back
//         </button>
//       </div>
//     );
//   }

//   if (!quizDetails || !currentQuestion) {
//     return (
//       <div className="flex flex-col justify-center items-center h-screen bg-gray-100 text-gray-700 p-8">
//          <h2 className="text-2xl font-bold mb-4">Quiz Not Found</h2>
//          <p className="text-center mb-4">Could not load quiz details or questions.</p>
//          <button 
//           onClick={() => navigate(-1)}
//           className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//         >
//           Go Back
//         </button>
//       </div>
//     );
//   }
  
//   const progressPercentage = (quizDetails.questions.length > 0) 
//     ? ((currentQuestionIndex + 1) / quizDetails.questions.length) * 100 
//     : 0;

//   return (
//     <div className="flex flex-col h-screen bg-gradient-to-br from-blue-300 to-indigo-400 p-6">
//       {/* Top Bar */}
//       <div className="flex justify-between items-center mb-6">
//         <div className="flex items-center space-x-4">
//           <button onClick={goToPreviousQuestion} disabled={currentQuestionIndex === 0} className="text-white hover:text-blue-100 disabled:opacity-50">
//             <FaArrowLeft size={24} />
//           </button>
//           <button onClick={goToNextQuestion} disabled={currentQuestionIndex === quizDetails.questions.length - 1} className="text-white hover:text-blue-100 disabled:opacity-50">
//             <FaArrowRight size={24} />
//           </button>
//         </div>
//         <h1 className="text-2xl font-bold text-white text-center flex-grow truncate px-4">
//           {quizDetails.quizName || 'Quiz'}
//         </h1>
//         <div className="flex items-center space-x-4">
//           <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-blue-100">
//             <FaVolumeUp size={24} /> {/* TODO: Add mute icon toggle */}
//           </button>
//           <button onClick={handleExitQuiz} className="text-white hover:text-red-300">
//             <FaTimes size={24} />
//           </button>
//         </div>
//       </div>

//       {/* Main Content Area */}
//       <div className="flex-grow flex flex-col items-center justify-center px-4">
//         <div className="w-full max-w-2xl bg-white/30 backdrop-blur-md p-8 rounded-xl shadow-2xl">
//           <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6 text-center">
//             {currentQuestion.questionText || currentQuestion.question}
//           </h2>
//           {renderQuestion()}
//         </div>
//       </div>

//       {/* Bottom Bar */}
//       <div className="mt-auto pt-6">
//         <div className="flex justify-between items-center">
//           <div className="text-white font-semibold">
//             {currentQuestionIndex + 1} / {quizDetails.questions.length}
//           </div>
//           <div className="w-1/2">
//             <div className="w-full bg-white/50 rounded-full h-2.5">
//               <div
//                 className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
//                 style={{ width: `${progressPercentage}%` }}
//               ></div>
//             </div>
//           </div>
//           {currentQuestionIndex === quizDetails.questions.length - 1 ? (
//             <button
//               onClick={handleSubmitQuiz}
//               className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform hover:scale-105"
//             >
//               Submit
//             </button>
//           ) : (
//             <button
//               onClick={goToNextQuestion}
//               className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform hover:scale-105"
//             >
//               Next
//             </button>
//           )}
//         </div>
//          {timeLeft !== null && (
//           <div className={`flex justify-center items-center mt-4 ${timeLeft < 60 ? 'animate-pulse' : ''}`}>
//             <div className={`px-4 py-2 rounded-full ${timeLeft < 60 ? 'bg-red-600' : timeLeft < 300 ? 'bg-orange-500' : 'bg-blue-600'} text-white font-bold`}>
//               Time Left: {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Quiz Result Modal */}
//       <QuizResultModal 
//         show={showResultModal}
//         onHide={handleModalClose}
//         result={quizResult}
//         onViewLeaderboard={handleViewLeaderboard}
//       />

//       {/* Add ReviewModal */}
//       <ReviewModal 
//         show={showReviewModal}
//         onHide={() => setShowReviewModal(false)}
//         questions={quizDetails?.questions || []}
//         answers={answers}
//         onSubmit={handleSubmitQuiz}
//       />
//     </div>
//   );
// };


// export default QuizAttemptPage; 



import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import quizService from '../../services/quizService';
import { useAuth } from '../../context/AuthContext';
import { FaArrowLeft, FaArrowRight, FaVolumeUp, FaTimes, FaTrophy } from 'react-icons/fa';
import api from '../../services/api';
import {leaderboardService} from '../../services/leaderboardService';
// Placeholder for actual UI components, will be built out
const MultipleChoiceQuestion = ({ question, onAnswer, selectedAnswer }) => {
  return (
    <div className="space-y-3">
      {question.options.map((option, index) => {
        const isSelected = selectedAnswer === option;
        let buttonClass = `w-full text-left p-4 rounded-lg transition-colors
          ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white hover:bg-gray-50'} 
          text-black border border-gray-200`;
        
        return (
          <button
            key={index}
            onClick={() => onAnswer(question.id, option)}
            className={buttonClass}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
};

// Add new ReviewModal component
const ReviewModal = ({ show, onHide, questions, answers, onSubmit }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="text-xl font-semibold">Review Your Answers</h3>
          <button 
            onClick={onHide}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          <div className="space-y-6">
            {questions.map((question, index) => {
              const questionId = question.id || `question_${index}`;
              const userAnswer = answers[questionId];
              const isAnswered = userAnswer !== undefined && 
                               (Array.isArray(userAnswer) ? userAnswer.length > 0 : userAnswer !== '');

              return (
                <div key={questionId} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="font-semibold text-gray-700 min-w-[2rem]">{index + 1}.</span>
                    <div className="flex-grow">
                      <p className="text-gray-800 mb-2">{question.questionText || question.question}</p>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-600">Your Answer:</p>
                        {isAnswered ? (
                          <div className="mt-1">
                            {Array.isArray(userAnswer) ? (
                              <ul className="list-disc list-inside">
                                {userAnswer.map((ans, i) => (
                                  <li key={i} className="text-gray-700">{ans}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-700">{userAnswer}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-red-500 italic">Not answered</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="border-t p-4 flex justify-end space-x-3">
          <button 
            onClick={onHide}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded text-gray-800"
          >
            Back to Quiz
          </button>
          <button 
            onClick={onSubmit}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded text-white"
          >
            Submit Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

// Modify IdentificationQuestion to reset on question change
const IdentificationQuestion = ({ question, onAnswer, currentAnswer, questionId }) => {
  const [inputValue, setInputValue] = useState('');

  // Reset input when question changes
  useEffect(() => {
    setInputValue(currentAnswer || '');
  }, [questionId, currentAnswer]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
    onAnswer(question.id, e.target.value, false); // Pass false to indicate not auto-advancing
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onAnswer(question.id, inputValue, true); // Pass true to indicate auto-advancing
    }
  };

  return (
    <div>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        placeholder="Type your answer here"
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
      />
    </div>
  );
};

const CheckboxQuestion = ({ question, onAnswer, selectedAnswers = [] }) => {
  const handleCheckboxChange = (option) => {
    const newAnswers = selectedAnswers.includes(option)
      ? selectedAnswers.filter(ans => ans !== option)
      : [...selectedAnswers, option];
    onAnswer(question.id, newAnswers);
  };

  return (
    <div className="space-y-3">
      {question.options.map((option, index) => {
        const isSelected = selectedAnswers.includes(option);
        return (
          <label
            key={index}
            className={`flex items-center p-4 rounded-lg cursor-pointer transition-colors border 
              ${isSelected 
                ? 'bg-blue-100 border-blue-500 font-semibold' 
                : 'bg-gray-50 border-gray-300 opacity-85 hover:opacity-100 hover:bg-gray-100'}`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleCheckboxChange(option)}
              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
            />
            <span className={`${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{option}</span>
          </label>
        );
      })}
    </div>
  );
};

// Results modal component
const QuizResultModal = ({ show, onHide, result, onViewLeaderboard }) => {
  if (!result || !show) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto overflow-hidden">
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="text-xl font-semibold">Quiz Results</h3>
          <button 
            onClick={onHide}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          <div className="text-center">
            <div className="mb-4">
              <div className="text-5xl font-bold text-blue-600 mb-2">{result.score || 0}%</div>
              <div className="text-lg text-gray-700">
                {result.passed ? 
                  <span className="text-green-600 font-semibold">Passed</span> : 
                  <span className="text-red-600 font-semibold">Try Again</span>
                }
              </div>
              <div className="mt-2 text-gray-600">
                Points: <span className="font-semibold">{result.pointsEarned || 0}</span> / <span>{result.totalPoints || 0}</span>
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-3 text-left">
                <div>
                  <p className="text-sm text-gray-500">Quiz Name</p>
                  <p className="font-medium">{result.quizName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Attempt</p>
                  <p className="font-medium">{result.attemptNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time Spent</p>
                  <p className="font-medium">{result.formattedTimeSpent || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rank</p>
                  <p className="font-medium">{result.rank || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t p-4 flex justify-end space-x-3">
          <button 
            onClick={onHide}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded text-gray-800"
          >
            Return to Classroom
          </button>
          <button 
            onClick={onViewLeaderboard}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white flex items-center"
          >
            <FaTrophy className="mr-2" /> View Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};

// Add new ConfirmationModal component
const ConfirmationModal = ({ show, onHide, questions, answers, onSubmit }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="text-xl font-semibold">Confirm Submission</h3>
          <button 
            onClick={onHide}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          <p className="text-gray-700 mb-4">Please review your answers before submitting:</p>
          <div className="space-y-4">
            {questions.map((question, index) => {
              const questionId = question.id || `question_${index}`;
              const userAnswer = answers[questionId];
              const isAnswered = userAnswer !== undefined && 
                               (Array.isArray(userAnswer) ? userAnswer.length > 0 : userAnswer !== '');

              return (
                <div key={questionId} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="font-semibold text-gray-700 min-w-[2rem]">{index + 1}.</span>
                    <div className="flex-grow">
                      <p className="text-gray-800 mb-2">{question.questionText || question.question}</p>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-600">Your Answer:</p>
                        {isAnswered ? (
                          <div className="mt-1">
                            {Array.isArray(userAnswer) ? (
                              <ul className="list-disc list-inside">
                                {userAnswer.map((ans, i) => (
                                  <li key={i} className="text-gray-700">{ans}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-700">{userAnswer}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-red-500 italic">Not answered</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="border-t p-4 flex justify-end space-x-3">
          <button 
            onClick={onHide}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded text-gray-800"
          >
            Back to Quiz
          </button>
          <button 
            onClick={onSubmit}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded text-white"
          >
            Confirm Submission
          </button>
        </div>
      </div>
    </div>
  );
};

const QuizAttemptPage = () => {
  const { quizId, attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser: user } = useAuth();
  const [quizDetails, setQuizDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResultModal, setShowResultModal] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const { onComplete, activityId } = location.state || {};
  const [timeLeft, setTimeLeft] = useState(null);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [classroomId, setClassroomId] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [timerId, setTimerId] = useState(null);

  // Fetch quiz and attempt details
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        setError(null);
        const quizData = await quizService.getQuiz(quizId);
        const attemptData = await quizService.getQuizAttempt(attemptId);

        if (!quizData || !attemptData) {
          throw new Error('Quiz or attempt data not found.');
        }

        // Get the activity data to find the classroom ID
        if (quizData.activityId) {
          try {
            const activityResponse = await api.get(`/activities/${quizData.activityId}`);
            const activityData = activityResponse.data;
            setClassroomId(activityData.classroomId);
          } catch (activityError) {
            console.error('Error fetching activity data:', activityError);
            toast.error('Failed to load classroom information');
          }
        }
        
        // Parse quizContent if it's a string
        let parsedQuestions = quizData.quizContent;
        if (typeof quizData.quizContent === 'string') {
          try {
            parsedQuestions = JSON.parse(quizData.quizContent);
          } catch (e) {
            console.error("Failed to parse quizContent:", e);
            throw new Error("Invalid quiz content format.");
          }
        }
        
        if (!Array.isArray(parsedQuestions)) {
             console.error("Parsed quiz content is not an array:", parsedQuestions);
             throw new Error("Quiz content is not structured as an array of questions.");
        }

        // Ensure each question has an ID
        parsedQuestions = parsedQuestions.map((q, index) => {
          if (!q.id) {
            return { ...q, id: `question_${index}` };
          }
          return q;
        });

        setQuizDetails({ ...quizData, questions: parsedQuestions });
        
        // Initialize answers from attempt if any, or empty
        setAnswers(attemptData.answers ? JSON.parse(attemptData.answers) : {});

        if (quizData.timeLimitMinutes && quizData.timeLimitMinutes > 0) {
          const timeLimitSeconds = quizData.timeLimitMinutes * 60;
          
          // Parse the startedAt timestamp correctly
          const startTime = new Date(attemptData.startedAt).getTime();
          const now = new Date().getTime();
          
          // Calculate time elapsed since starting the quiz
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          
          // Calculate remaining time
          const remaining = Math.max(timeLimitSeconds - elapsedSeconds, 0);
          console.log(`Time limit: ${timeLimitSeconds}s, Elapsed: ${elapsedSeconds}s, Remaining: ${remaining}s`);
          
          setTimeLeft(remaining);
        }
        
      } catch (err) {
        console.error('Error fetching quiz data:', err);
        setError(err.message || 'Failed to load quiz. Please try again.');
        toast.error(err.message || 'Failed to load quiz.');
      } finally {
        setLoading(false);
      }
    };

    if (quizId && attemptId && user) {
      fetchQuizData();
    } else if (!user) {
        navigate('/login');
        toast.error('Please log in to take the quiz.');
    }
  }, [quizId, attemptId, user, navigate]);

  // Modify timer logic to store timer ID
  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) {
      if (timeLeft === 0) handleSubmitQuiz(); // Auto-submit if time runs out
      return;
    }
    
    const id = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = prevTime - 1;
        if (newTime <= 0) {
          console.log('Timer reached zero, auto-submitting');
          clearInterval(id);
          return 0;
        }
        return newTime;
      });
    }, 1000);
    
    setTimerId(id);
    
    return () => {
      clearInterval(id);
    };
  }, [timeLeft]);

  // Add function to stop timer
  const stopTimer = useCallback(() => {
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
  }, [timerId]);

  // Remove auto-advance from handleAnswerSelect
  const handleAnswerSelect = useCallback((questionId, answer) => {
    // Make sure we have a valid ID
    const validQuestionId = questionId || `question_${currentQuestionIndex}`;
    
    console.log(`Saving answer for question ID: ${validQuestionId}`, answer);
    
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [validQuestionId]: answer,
    }));
  }, [currentQuestionIndex]);

  const currentQuestion = quizDetails?.questions?.[currentQuestionIndex];

  const renderQuestion = () => {
    if (!currentQuestion) return <p>No question to display.</p>;

    switch (currentQuestion.questionType) {
      case 'MULTIPLE_CHOICE':
        return (
          <MultipleChoiceQuestion
            question={currentQuestion}
            onAnswer={handleAnswerSelect}
            selectedAnswer={answers[currentQuestion.id]}
          />
        );
      case 'IDENTIFICATION':
        return (
          <IdentificationQuestion
            question={currentQuestion}
            onAnswer={handleAnswerSelect}
            currentAnswer={answers[currentQuestion.id]}
            questionId={currentQuestion.id}
          />
        );
      case 'CHECKBOX':
        return (
          <CheckboxQuestion
            question={currentQuestion}
            onAnswer={handleAnswerSelect}
            selectedAnswers={answers[currentQuestion.id]}
          />
        );
      default:
        return <p>Unsupported question type: {currentQuestion.questionType}</p>;
    }
  };
  
  const goToNextQuestion = () => {
    if (currentQuestionIndex < quizDetails.questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };

  const calculateScore = () => {
    if (!quizDetails?.questions || quizDetails.questions.length === 0) return 0;
    
    let totalCorrect = 0;
    let totalQuestions = quizDetails.questions.length;
    let totalPoints = 0;
    let earnedPoints = 0;
    
    quizDetails.questions.forEach(question => {
      // Make sure we're using the correct question ID
      const questionId = question.id || `question_${question.index}`;
      
      const userAnswer = answers[questionId];
      
      if (!userAnswer) return; // No answer provided
      
      const correctAnswer = question.correctAnswer;
      
      if (!correctAnswer) return; // No correct answer defined
      
      // Calculate question points - default to 1 if not specified
      const questionPoints = question.points || 1;
      totalPoints += questionPoints;
      
      let isCorrect = false;
      
      if (question.questionType === 'CHECKBOX') {
        // For checkbox, check if arrays match exactly (same elements)
        if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
          isCorrect = userAnswer.length === correctAnswer.length && 
                     correctAnswer.every(item => userAnswer.includes(item)) &&
                     userAnswer.every(item => correctAnswer.includes(item));
        }
      } else if (question.questionType === 'IDENTIFICATION') {
        // For identification, do case-insensitive comparison and trim whitespace
        const formattedUserAnswer = (userAnswer || '').toLowerCase().trim();
        const formattedCorrectAnswer = (correctAnswer || '').toLowerCase().trim();
        isCorrect = formattedUserAnswer === formattedCorrectAnswer;
      } else {
        // For multiple choice
        isCorrect = userAnswer === correctAnswer;
      }
      
      if (isCorrect) {
        totalCorrect++;
        earnedPoints += questionPoints;
      }
    });
    
    return earnedPoints; // Return actual points earned, not percentage
  };

  const handleViewLeaderboard = () => {
    if (classroomId) {
      navigate(`/student/classrooms/${classroomId}`, { state: { activeTab: 'leaderboard' } });
    } else {
      toast.error('Unable to access leaderboard: Classroom information not found');
      // Stay on the current page instead of navigating away
    }
  };

  // Modify handleSubmitQuiz to show confirmation first
  const handleSubmitQuiz = async () => {
    setShowConfirmationModal(true);
  };

  // Add new function for actual submission
  const handleConfirmSubmit = async () => {
    try {
      setLoading(true);
      stopTimer(); // Stop the timer when submitting
      
      // Calculate scores
      const pointsEarned = calculateScore();
      const totalPoints = quizDetails.questions.reduce((sum, q) => sum + (q.points || 1), 0);
      const percentageScore = Math.round((pointsEarned / totalPoints) * 100);

      // Submit the quiz with points earned as score
      const result = await quizService.completeQuizAttempt(
        attemptId, 
        pointsEarned,
        JSON.stringify(answers)
      );
      
      console.log('Quiz submission successful:', result);
      
      // Fetch the leaderboard for this specific quiz to get the rank
      const quizLeaderboard = await leaderboardService.getLeaderboardByQuiz(quizDetails.id);
      const studentRank = quizLeaderboard?.findIndex(
        entry => entry.studentId === user.id
      ) + 1;
      
      // Set result for modal with additional information
      setQuizResult({
        ...result,
        score: percentageScore,
        pointsEarned,
        totalPoints,
        passed: pointsEarned >= quizDetails.passingScore,
        rank: studentRank || 1 // Default to 1 if no rank found
      });
      setShowResultModal(true);
      setShowConfirmationModal(false);
      
      // Call the onComplete callback if it exists
      if (onComplete) {
        console.log('Calling onComplete callback with score:', percentageScore);
        onComplete(percentageScore);
      }
      
      toast.success('Quiz submitted successfully!');
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      let errorMessage = 'Failed to submit quiz. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Modify handleExitQuiz to use consistent score calculation
  const handleExitQuiz = async () => {
    const confirmExit = () => {
      toast((t) => (
        <div className="flex flex-col items-center">
          <p className="mb-2">Are you sure you want to exit? Your progress will be recorded.</p>
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  // Calculate points earned consistently
                  let pointsEarned = 0;
                  let totalPoints = 0;
                  
                  quizDetails.questions.forEach(question => {
                    const questionId = question.id || `question_${question.index}`;
                    const points = question.points || 1;
                    totalPoints += points;
                    
                    const userAnswer = answers[questionId];
                    const correctAnswer = question.correctAnswer;
                    
                    if (userAnswer && correctAnswer) {
                      let isCorrect = false;
                      
                      if (question.questionType === 'CHECKBOX') {
                        if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
                          isCorrect = userAnswer.length === correctAnswer.length && 
                                     correctAnswer.every(item => userAnswer.includes(item)) &&
                                     userAnswer.every(item => correctAnswer.includes(item));
                        }
                      } else if (question.questionType === 'IDENTIFICATION') {
                        const formattedUserAnswer = (userAnswer || '').toLowerCase().trim();
                        const formattedCorrectAnswer = (correctAnswer || '').toLowerCase().trim();
                        isCorrect = formattedUserAnswer === formattedCorrectAnswer;
                      } else {
                        isCorrect = userAnswer === correctAnswer;
                      }
                      
                      if (isCorrect) {
                        pointsEarned += points;
                      }
                    }
                  });

                  // Submit with pointsEarned
                  await quizService.completeQuizAttempt(
                    attemptId,
                    pointsEarned, // Always use pointsEarned for database
                    JSON.stringify(answers)
                  );
                  
                  toast.success('Quiz progress saved!');
                  if(classroomId) {
                    navigate(`/student/classrooms/${classroomId}`);
                  } else {
                    navigate('/student/classrooms');
                  }
                } catch (error) {
                  console.error('Error saving quiz progress:', error);
                  toast.error('Failed to save quiz progress');
                }
              }}
            >
              Yes, Exit
            </button>
            <button
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
          </div>
        </div>
      ), {
        duration: 5000,
        position: 'top-center',
      });
    };

    confirmExit();
  };

  const handleModalClose = () => {
    setShowResultModal(false);
    // Navigate back to classroom page
    if(classroomId) {
      navigate(`/student/classrooms/${classroomId}`);
    } else {
      navigate('/student/classrooms'); // Fallback
    }
  };

  // Add keyboard event handler for Enter key
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        // If on last question, trigger submit
        if (currentQuestionIndex === quizDetails?.questions?.length - 1) {
          handleSubmitQuiz();
        } else {
          // Otherwise go to next question
          goToNextQuestion();
        }
      }
    };

    // Add event listener
    window.addEventListener('keypress', handleKeyPress);

    // Cleanup
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [currentQuestionIndex, quizDetails?.questions?.length]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-blue-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-red-100 text-red-700 p-8">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <p className="text-center mb-4">{error}</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!quizDetails || !currentQuestion) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100 text-gray-700 p-8">
         <h2 className="text-2xl font-bold mb-4">Quiz Not Found</h2>
         <p className="text-center mb-4">Could not load quiz details or questions.</p>
         <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  const progressPercentage = (quizDetails.questions.length > 0) 
    ? ((currentQuestionIndex + 1) / quizDetails.questions.length) * 100 
    : 0;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-300 to-indigo-400 p-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button onClick={goToPreviousQuestion} disabled={currentQuestionIndex === 0} className="text-white hover:text-blue-100 disabled:opacity-50">
            <FaArrowLeft size={24} />
          </button>
          <button onClick={goToNextQuestion} disabled={currentQuestionIndex === quizDetails.questions.length - 1} className="text-white hover:text-blue-100 disabled:opacity-50">
            <FaArrowRight size={24} />
          </button>
        </div>
        <h1 className="text-2xl font-bold text-white text-center flex-grow truncate px-4">
          {quizDetails.quizName || 'Quiz'}
        </h1>
        <div className="flex items-center space-x-4">
          {/* <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-blue-100">
            <FaVolumeUp size={24} />
          </button> */}
          <button onClick={handleExitQuiz} className="text-white hover:text-red-300">
            <FaTimes size={24} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl bg-white/30 backdrop-blur-md p-8 rounded-xl shadow-2xl">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6 text-center">
            {currentQuestion.questionText || currentQuestion.question}
          </h2>
          {renderQuestion()}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-auto pt-6">
        <div className="flex justify-between items-center">
          <div className="text-white font-semibold">
            {currentQuestionIndex + 1} / {quizDetails.questions.length}
          </div>
          <div className="w-1/2">
            <div className="w-full bg-white/50 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          {currentQuestionIndex === quizDetails.questions.length - 1 ? (
            <button
              onClick={handleSubmitQuiz}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform hover:scale-105"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={goToNextQuestion}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform hover:scale-105"
            >
              Next
            </button>
          )}
        </div>
         {timeLeft !== null && (
          <div className={`flex justify-center items-center mt-4 ${timeLeft < 60 ? 'animate-pulse' : ''}`}>
            <div className={`px-4 py-2 rounded-full ${timeLeft < 60 ? 'bg-red-600' : timeLeft < 300 ? 'bg-orange-500' : 'bg-blue-600'} text-white font-bold`}>
              Time Left: {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
            </div>
          </div>
        )}
      </div>

      {/* Quiz Result Modal */}
      <QuizResultModal 
        show={showResultModal}
        onHide={handleModalClose}
        result={quizResult}
        onViewLeaderboard={handleViewLeaderboard}
      />

      {/* Add ReviewModal */}
      <ReviewModal 
        show={showReviewModal}
        onHide={() => setShowReviewModal(false)}
        questions={quizDetails?.questions || []}
        answers={answers}
        onSubmit={handleSubmitQuiz}
      />

      {/* Add ConfirmationModal */}
      <ConfirmationModal 
        show={showConfirmationModal}
        onHide={() => setShowConfirmationModal(false)}
        questions={quizDetails?.questions || []}
        answers={answers}
        onSubmit={handleConfirmSubmit}
      />
    </div>
  );
};

export default QuizAttemptPage; 