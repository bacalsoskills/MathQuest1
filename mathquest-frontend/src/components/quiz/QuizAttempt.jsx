import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import quizService from '../../services/quizService';
import { useAuth } from '../../context/AuthContext';
import { FaArrowLeft, FaArrowRight, FaVolumeUp, FaTimes } from 'react-icons/fa';

// Placeholder for actual UI components, will be built out
const MultipleChoiceQuestion = ({ question, onAnswer, selectedAnswer }) => {
  return (
    <div className="space-y-3">
      {question.options.map((option, index) => (
        <button
          key={index}
          onClick={() => onAnswer(question.id, option)}
          className={`w-full text-left p-4 rounded-lg transition-colors text-white font-semibold
            ${selectedAnswer === option ? 'bg-blue-700 ring-2 ring-blue-300' : 'bg-blue-500 hover:bg-blue-600'}
            ${index === 1 ? 'bg-green-500 hover:bg-green-600' : ''}
            ${index === 2 ? 'bg-pink-500 hover:bg-pink-600' : ''}
            ${index === 3 ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
          `}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

const IdentificationQuestion = ({ question, onAnswer, currentAnswer }) => {
  const [inputValue, setInputValue] = useState(currentAnswer || '');

  const handleChange = (e) => {
    setInputValue(e.target.value);
    onAnswer(question.id, e.target.value);
  };

  return (
    <div>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="Type your answer here"
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      {question.options.map((option, index) => (
        <label
          key={index}
          className="flex items-center p-4 rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors border border-gray-300"
        >
          <input
            type="checkbox"
            checked={selectedAnswers.includes(option)}
            onChange={() => handleCheckboxChange(option)}
            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
          />
          <span className="text-gray-800">{option}</span>
        </label>
      ))}
    </div>
  );
};

const QuizAttemptPage = () => {
  const { quizId, attemptId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [quizDetails, setQuizDetails] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // Stores { questionId: answer }
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

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


        setQuizDetails({ ...quizData, questions: parsedQuestions });
        
        // Initialize answers from attempt if any, or empty
        setAnswers(attemptData.answers ? JSON.parse(attemptData.answers) : {});

        if (quizData.timeLimitMinutes && quizData.timeLimitMinutes > 0) {
          const timeLimitSeconds = quizData.timeLimitMinutes * 60;
          // Calculate remaining time based on attempt start time
          const startTime = new Date(attemptData.startTime).getTime();
          const now = new Date().getTime();
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          const remaining = timeLimitSeconds - elapsedSeconds;
          setTimeLeft(remaining > 0 ? remaining : 0);
        }
        
      } catch (err) {
        console.error('Error fetching quiz data:', err);
        setError(err.message || 'Failed to load quiz. Please try again.');
        toast.error(err.message || 'Failed to load quiz.');
      } finally {
        setLoading(false);
      }
    };

    if (quizId && attemptId && currentUser) {
      fetchQuizData();
    } else if (!currentUser) {
        navigate('/login');
        toast.error('Please log in to take the quiz.');
    }
  }, [quizId, attemptId, currentUser, navigate]);

  // Timer logic
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if (timeLeft === 0) handleSubmitQuiz(); // Auto-submit if time runs out
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const handleAnswerSelect = useCallback((questionId, answer) => {
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: answer,
    }));
  }, []);

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

  const handleSubmitQuiz = async () => {
    try {
      setLoading(true);
      // Submit the quiz answers to the server
      const result = await quizService.completeQuizAttempt(
        attemptId, 
        null, // Score will be calculated on server
        JSON.stringify(answers)
      );
      
      console.log("Quiz submission successful:", result);
      toast.success('Quiz submitted successfully!');
      
      // Get the classroom ID from the result or from quizDetails
      const resultClassroomId = result?.classroomId;
      const effectiveClassroomId = resultClassroomId || quizDetails?.classroomId;
      
      console.log("Navigation info:", {
        resultClassroomId,
        quizDetailsClassroomId: quizDetails?.classroomId,
        effectiveClassroomId
      });
      
      // Only offer leaderboard navigation if we have a valid classroom ID
      if (effectiveClassroomId) {
        if (window.confirm("View leaderboard for this quiz?")) {
          console.log("Navigating to leaderboard:", `/classroom/${effectiveClassroomId}/leaderboard`);
          navigate(`/classroom/${effectiveClassroomId}/leaderboard`);
        } else {
          console.log("Navigating to classroom:", `/student/classrooms/${effectiveClassroomId}`);
          navigate(`/student/classrooms/${effectiveClassroomId}`);
        }
      } else {
        console.warn("No valid classroom ID found for navigation");
        // No valid classroom ID, just go to classrooms page
        navigate('/student/classrooms');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExitQuiz = () => {
    if (window.confirm("Are you sure you want to exit? Your progress might not be saved.")) {
       if(quizDetails?.classroomId) {
        navigate(`/student/classrooms/${quizDetails.classroomId}`);
      } else {
        navigate('/student/classrooms'); // Fallback
      }
    }
  };


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
          <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-blue-100">
            <FaVolumeUp size={24} /> {/* TODO: Add mute icon toggle */}
          </button>
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
          <div className="text-center text-white text-sm mt-3">
            Time Left: {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
          </div>
        )}
      </div>
    </div>
  );
};




// const QuizAttemptPage = () => {
//   const { quizId, attemptId } = useParams();
//   const navigate = useNavigate();
//   const { currentUser } = useAuth();

//   const [quizDetails, setQuizDetails] = useState(null);
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [answers, setAnswers] = useState({}); // Stores { questionId: answer }
//   const [timeLeft, setTimeLeft] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isMuted, setIsMuted] = useState(false);

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


//         setQuizDetails({ ...quizData, questions: parsedQuestions });
        
//         // Initialize answers from attempt if any, or empty
//         setAnswers(attemptData.answers ? JSON.parse(attemptData.answers) : {});

//         if (quizData.timeLimitMinutes && quizData.timeLimitMinutes > 0) {
//           const timeLimitSeconds = quizData.timeLimitMinutes * 60;
//           // Calculate remaining time based on attempt start time
//           const startTime = new Date(attemptData.startTime).getTime();
//           const now = new Date().getTime();
//           const elapsedSeconds = Math.floor((now - startTime) / 1000);
//           const remaining = timeLimitSeconds - elapsedSeconds;
//           setTimeLeft(remaining > 0 ? remaining : 0);
//         }
        
//       } catch (err) {
//         console.error('Error fetching quiz data:', err);
//         setError(err.message || 'Failed to load quiz. Please try again.');
//         toast.error(err.message || 'Failed to load quiz.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (quizId && attemptId && currentUser) {
//       fetchQuizData();
//     } else if (!currentUser) {
//         navigate('/login');
//         toast.error('Please log in to take the quiz.');
//     }
//   }, [quizId, attemptId, currentUser, navigate]);

//   // Timer logic
//   useEffect(() => {
//     if (timeLeft === null || timeLeft <= 0) {
//       if (timeLeft === 0) handleSubmitQuiz(); // Auto-submit if time runs out
//       return;
//     }
//     const timerId = setInterval(() => {
//       setTimeLeft(prevTime => prevTime - 1);
//     }, 1000);
//     return () => clearInterval(timerId);
//   }, [timeLeft]);

//   const handleAnswerSelect = useCallback((questionId, answer) => {
//     setAnswers(prevAnswers => ({
//       ...prevAnswers,
//       [questionId]: answer,
//     }));
//   }, []);

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

//   const handleSubmitQuiz = async () => {
//     try {
//       setLoading(true);
//       // Submit the quiz answers to the server
//       await quizService.completeQuizAttempt(
//         attemptId, 
//         null, // Score will be calculated on server
//         JSON.stringify(answers)
//       );
      
//       toast.success('Quiz submitted successfully!');
      
//       // Navigate back to classroom page
//       if(quizDetails?.classroomId) {
//         navigate(`/student/classrooms/${quizDetails.classroomId}`);
//       } else {
//         navigate('/student/classrooms'); // Fallback
//       }
//     } catch (error) {
//       console.error('Error submitting quiz:', error);
//       toast.error('Failed to submit quiz. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleExitQuiz = () => {
//     if (window.confirm("Are you sure you want to exit? Your progress might not be saved.")) {
//        if(quizDetails?.classroomId) {
//         navigate(`/student/classrooms/${quizDetails.classroomId}`);
//       } else {
//         navigate('/student/classrooms'); // Fallback
//       }
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
//           <div className="text-center text-white text-sm mt-3">
//             Time Left: {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

export default QuizAttemptPage; 