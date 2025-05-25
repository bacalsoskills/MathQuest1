import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import quizService from '../../services/quizService';
import { useAuth } from '../../context/AuthContext';
import { FaArrowLeft, FaArrowRight, FaVolumeUp, FaTimes, FaTrophy } from 'react-icons/fa';
import api from '../../services/api';

// Placeholder for actual UI components, will be built out
const MultipleChoiceQuestion = ({ question, onAnswer, selectedAnswer }) => {
  return (
    <div className="space-y-3">
      {question.options.map((option, index) => {
        const isSelected = selectedAnswer === option;
        let buttonClass = `w-full text-left p-4 rounded-lg transition-colors
          ${isSelected ? 'ring-2 ring-blue-300 font-semibold' : 'opacity-85 hover:opacity-100'} `;
        
        if (isSelected) {
          if (index === 0) buttonClass += 'bg-blue-700 text-white';
          else if (index === 1) buttonClass += 'bg-green-700 text-white';
          else if (index === 2) buttonClass += 'bg-pink-700 text-white';
          else if (index === 3) buttonClass += 'bg-yellow-700 text-white';
        } else {
          if (index === 0) buttonClass += 'bg-blue-400 text-white';
          else if (index === 1) buttonClass += 'bg-green-400 text-white';
          else if (index === 2) buttonClass += 'bg-pink-400 text-white';
          else if (index === 3) buttonClass += 'bg-yellow-400 text-white';
        }
        
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
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
      />
      {inputValue && (
        <div className="mt-2 text-blue-600 text-sm">
          Your answer: <span className="font-medium">{inputValue}</span>
        </div>
      )}
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
              {result.pointsEarned !== undefined && (
                <div className="mt-1 text-gray-600">
                  Points: <span className="font-semibold">{result.pointsEarned || 0}</span> / <span>{result.totalPoints || 0}</span>
                </div>
              )}
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


const QuizAttemptPage =() => {
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
  // New state for quiz results and modal
  const [showResultModal, setShowResultModal] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [classroomId, setClassroomId] = useState(null);

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

    if (quizId && attemptId && currentUser) {
      fetchQuizData();
    } else if (!currentUser) {
        navigate('/login');
        toast.error('Please log in to take the quiz.');
    }
  }, [quizId, attemptId, currentUser, navigate]);

  // Timer logic
  useEffect(() => {
    // Only set up timer if timeLeft is positive
    if (!timeLeft || timeLeft <= 0) {
      if (timeLeft === 0) handleSubmitQuiz(); // Auto-submit if time runs out
      return;
    }
    
    // Reduce logging - only log significant changes
    if (timeLeft % 60 === 0) {
      console.log(`Timer: ${Math.floor(timeLeft / 60)} minutes remaining`);
    }
    
    const timerId = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = prevTime - 1;
        if (newTime <= 0) {
          console.log('Timer reached zero, auto-submitting');
          clearInterval(timerId);
          return 0;
        }
        return newTime;
      });
    }, 1000);
    
    // Clean up the interval on component unmount
    return () => clearInterval(timerId);
  }, [timeLeft]);

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
    
    // Use total points if available, otherwise use number of questions
    const scoreBase = totalPoints > 0 ? totalPoints : totalQuestions;
    const earnedScore = totalPoints > 0 ? earnedPoints : totalCorrect;
    
    // Calculate percentage (0-100)
    return Math.round((earnedScore / scoreBase) * 100) || 0;
  };

  const handleViewLeaderboard = () => {
    if (classroomId) {
      navigate(`/student/classrooms/${classroomId}`, { state: { activeTab: 'leaderboard' } });
    } else {
      toast.error('Unable to access leaderboard: Classroom information not found');
      // Stay on the current page instead of navigating away
    }
  };

  const handleSubmitQuiz = async () => {
    let calculatedScore = null;
    let pointsEarned = 0;
    let totalPoints = 0;
    
    try {
      setLoading(true);
      console.log('Submitting quiz with answers:', answers);
      
      // Validate that we have answers
      const answeredQuestions = Object.keys(answers).length;
      const totalQuestions = quizDetails?.questions?.length || 0;
      
      console.log(`Answered ${answeredQuestions} out of ${totalQuestions} questions`);
      
      // Calculate points and score
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
      
      // Calculate percentage score
      calculatedScore = totalPoints > 0 ? Math.round((pointsEarned / totalPoints) * 100) : 0;
      
      console.log(`Calculated score: ${calculatedScore}%, Points: ${pointsEarned}/${totalPoints}`);
      
      // Actually submit the quiz answers to the server
      const result = await quizService.completeQuizAttempt(
        attemptId, 
        calculatedScore, // Send calculated score to server
        JSON.stringify(answers)
      );
      
      console.log('Quiz submission successful:', result);
      
      // Set result for modal with additional information
      setQuizResult({
        ...result,
        pointsEarned,
        totalPoints
      });
      setShowResultModal(true);
      
      toast.success('Quiz submitted successfully!');
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      
      // Extract the error message
      let errorMessage = 'Failed to submit quiz. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
      // If the error was due to the leaderboard, try again without leaderboard
      if (errorMessage.includes('leaderboard') || errorMessage.includes('Table') || error.response?.status === 500) {
        console.log('Retrying submission without leaderboard updates...');
        try {
          // Try again after a brief delay
          setTimeout(async () => {
            const retryResult = await quizService.completeQuizAttempt(
              attemptId, 
              calculatedScore, // Use the score we calculated earlier
              JSON.stringify(answers)
            );
            
            setQuizResult({
              ...retryResult,
              pointsEarned,
              totalPoints
            });
            setShowResultModal(true);
            toast.success('Quiz submitted successfully on retry!');
          }, 1000);
        } catch (retryError) {
          console.error('Error on retry:', retryError);
          toast.error('Failed to submit quiz even after retry. Please try again later.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExitQuiz = () => {
    if (window.confirm("Are you sure you want to exit? Your progress might not be saved.")) {
      if(classroomId) {
        navigate(`/student/classrooms/${classroomId}`);
      } else {
        navigate('/student/classrooms'); // Fallback
      }
    }
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
    </div>
  );
};


export default QuizAttemptPage; 