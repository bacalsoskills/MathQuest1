import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import quizService from '../../services/quizService';
import { useAuth } from '../../context/AuthContext';
import { FaArrowLeft, FaArrowRight, FaTimes, FaTrophy, FaCheckCircle, FaRegCircle } from 'react-icons/fa';
import api from '../../services/api';
import {leaderboardService} from '../../services/leaderboardService';
import Modal from '../../ui/modal';
import { Button } from '../../ui/button';

const MultipleChoiceQuestion = ({ question, onAnswer, selectedAnswer }) => {
  return (
    <div className="space-y-3">
      {question.options.map((option, index) => {
        const isSelected = selectedAnswer === option;
        let buttonClass = `w-full text-left p-4 rounded-lg transition-colors
          ${isSelected ? 'ring-2 ring-blue-500 bg-blue-100' : 'bg-gray-100 hover:bg-gray-200'} 
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

const ReviewModal = ({ show, onHide, questions, answers, onSubmit }) => {
  if (!show) return null;

  return (
    <Modal
      isOpen={show}
      onClose={onHide}
      title="Review Your Answers"
      maxWidth="max-w-4xl"
      footer={
        <div className="flex justify-end gap-2 w-full">
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
      }
    >
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
    </Modal>
  );
};

const IdentificationQuestion = ({ question, onAnswer, currentAnswer, questionId }) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setInputValue(currentAnswer || '');
  }, [questionId, currentAnswer]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
    onAnswer(question.id, e.target.value, false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      // Prevent bubbling to the global key handler to avoid unintended next/submit
      e.stopPropagation();
      onAnswer(question.id, inputValue, true);
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

const QuizResultModal = ({ show, onHide, result, onViewLeaderboard }) => {
  if (!result || !show) return null;
  
  return (
    <Modal
      isOpen={show}
      onClose={onHide}
      title="Quiz Results"
      maxWidth="max-w-md"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button 
            onClick={onHide}
            variant="cancel"
            rounded="full"
           
          >
            Return to Classroom
          </Button>
          <Button
            onClick={onViewLeaderboard}
            variant="default"
            rounded="full"
          
          >
            <FaTrophy className="mr-2" /> View Leaderboard
          </Button>
        </div>
      }
    >
      <div className="text-center">
        <div className="mb-4">
          <div className="text-5xl font-bold text-blue-600 mb-2">{result.score || 0}%</div>
          <div className="text-lg text-gray-700">
            {result.passed ? 
              <span className="text-green-600 font-semibold">Passed</span> : 
              <span className="text-red-600 font-semibold">Try Again</span>
            }
          </div>
          <div className="mt-2 dark:text-gray-50 text-gray-600">
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
    </Modal>
  );
};

const ConfirmationModal = ({ show, onHide, questions, answers, onSubmit }) => {
  if (!show) return null;

  return (
    <Modal
      isOpen={show}
      onClose={onHide}
      title="Confirm Submission"
      maxWidth="max-w-4xl"
      footer={
        <div className="flex justify-end gap-2 w-full">
           <Button 
            onClick={onHide}
            variant="cancel"
            rounded="full"
            size="sm"
          >
            Back to Quiz
          </Button>
          <Button 
            onClick={onSubmit}
            variant="default"
            rounded="full"
            size="sm"
          >
            Confirm Submission
          </Button>
        </div>
      }
    >
      <p className="dark:text-gray-50 text-gray-700 mb-4">Please review your answers before submitting:</p>
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
    </Modal>
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
  const { onComplete } = location.state || {};
  const [timeLeft, setTimeLeft] = useState(null);
  const [error, setError] = useState(null);
  const [classroomId, setClassroomId] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [timerId, setTimerId] = useState(null);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [nextLocation, setNextLocation] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const lsKey = `quizAttempt-${attemptId}`;

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!loading && !showResultModal) { // Only save after initial data is loaded and not when showing results
      const stateToSave = {
        savedAnswers: answers,
        savedIndex: currentQuestionIndex,
        savedTimeLeft: timeLeft,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(lsKey, JSON.stringify(stateToSave));
      setHasUnsavedChanges(false);
    }
  }, [answers, currentQuestionIndex, timeLeft, lsKey, loading, showResultModal]);

  // Track unsaved changes
  useEffect(() => {
    if (!loading) {
      setHasUnsavedChanges(true);
    }
  }, [answers, currentQuestionIndex]);

  // Handle beforeunload event (page refresh/close)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (showResultModal) return; // Don't warn if results are shown
      
      // Show warning if quiz is active (not completed) and user is trying to close/refresh
      if (!showResultModal && !showConfirmationModal) {
        e.preventDefault();
        e.returnValue = 'Your quiz progress will be saved automatically. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [showResultModal, showConfirmationModal]);

  // Handle navigation attempts (sidebar/navbar clicks)
  useEffect(() => {
    const handleClick = (e) => {
      if (showResultModal) return; // Don't intercept if results are shown

      const link = e.target.closest('a');
      if (link && link.href && link.target !== '_blank') {
        const destinationUrl = new URL(link.href);
        const destination = destinationUrl.pathname;
        
        // Don't intercept if it's the same page or a hash link
        if (destination && location.pathname !== destination && !destination.startsWith('#')) {
          e.preventDefault();
          e.stopPropagation();
          setNextLocation(destination);
          setShowExitConfirmModal(true);
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [location.pathname, showResultModal]);

  const handleLeavePage = () => {
    if (nextLocation) {
      navigate(nextLocation, { state: { activeTab: 'lessons' } });
    }
    setShowExitConfirmModal(false);
    setNextLocation(null);
  };

  const handleStayOnPage = () => {
    setNextLocation(null);
    setShowExitConfirmModal(false);
  };

  const handleLeaveQuizClick = (e) => {
    e.preventDefault();
    if (showResultModal) {
      // If results are shown, allow direct navigation to lessons tab
      navigate(classroomId ? `/student/classrooms/${classroomId}` : '/student/classrooms', { state: { activeTab: 'lessons' } });
    } else {
      // Show confirmation modal
      setNextLocation(classroomId ? `/student/classrooms/${classroomId}` : '/student/classrooms');
      setShowExitConfirmModal(true);
    }
  };

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
        
        // Load saved state from localStorage
        const savedState = localStorage.getItem(lsKey);
        let savedAnswers = {};
        let savedIndex = 0;
        let savedTimeLeft = null;
        
        if (savedState) {
          try {
            const parsed = JSON.parse(savedState);
            savedAnswers = parsed.savedAnswers || {};
            savedIndex = parsed.savedIndex || 0;
            savedTimeLeft = parsed.savedTimeLeft;

            
            // Show notification if we restored saved state
            if (Object.keys(savedAnswers).length > 0) {
              toast.success('Your previous progress has been restored!');
            }
          } catch (error) {
            console.error('Error parsing saved state:', error);
            localStorage.removeItem(lsKey);
          }
        }
        
        // Merge saved answers with server answers (saved answers take precedence)
        const serverAnswers = attemptData.answers ? JSON.parse(attemptData.answers) : {};
        const mergedAnswers = { ...serverAnswers, ...savedAnswers };
        

        
        // Set the merged answers and saved index
        setAnswers(mergedAnswers);
        setCurrentQuestionIndex(savedIndex);

        // Handle timer initialization
        if (quizData.timeLimitMinutes && quizData.timeLimitMinutes > 0) {
          const timeLimitSeconds = quizData.timeLimitMinutes * 60;
          
          if (savedTimeLeft && savedTimeLeft > 0) {
            // Use saved timer state

            setTimeLeft(savedTimeLeft);
          } else {
            // Calculate new timer based on start time
            const startTime = new Date(attemptData.startedAt).getTime();
            const now = new Date().getTime();
            const elapsedSeconds = Math.floor((now - startTime) / 1000);
            const remaining = Math.max(timeLimitSeconds - elapsedSeconds, 0);
            

            setTimeLeft(remaining);
          }
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
  }, [quizId, attemptId, user, navigate, lsKey]);

  // Timer logic
  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) {
      return;
    }
    
    const id = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = prevTime - 1;
        if (newTime <= 0) {

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
  }, [timeLeft]); // Removed handleSubmitQuiz dependency

  // Handle auto-submission when timer reaches zero
  useEffect(() => {
    if (timeLeft === 0 && !showResultModal && !showConfirmationModal) {

      setShowConfirmationModal(true);
    }
  }, [timeLeft, showResultModal, showConfirmationModal]);

  const stopTimer = useCallback(() => {
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
  }, [timerId]);

  const handleAnswerSelect = useCallback((questionId, answer) => {
    const validQuestionId = questionId || `question_${currentQuestionIndex}`;
    

    
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

  const calculateScore = useCallback(() => {
    if (!quizDetails?.questions || quizDetails.questions.length === 0) return 0;
    
    let totalCorrect = 0;
    let totalQuestions = quizDetails.questions.length;
    let totalPoints = 0;
    let earnedPoints = 0;
    
    quizDetails.questions.forEach(question => {
      const questionId = question.id || `question_${question.index}`;
      
      const userAnswer = answers[questionId];
      
      if (!userAnswer) return;
      
      const correctAnswer = question.correctAnswer;
      
      if (!correctAnswer) return;
      
      const questionPoints = question.points || 1;
      totalPoints += questionPoints;
      
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
        totalCorrect++;
        earnedPoints += questionPoints;
      }
    });
    
    return earnedPoints;
  }, [quizDetails?.questions, answers]);

  const handleViewLeaderboard = () => {
    if (classroomId) {
      navigate(`/student/classrooms/${classroomId}`, { state: { activeTab: 'leaderboard' } });
    } else {
      toast.error('Unable to access leaderboard: Classroom information not found');
    }
  };

  const handleSubmitQuiz = useCallback(async () => {
    setShowConfirmationModal(true);
  }, []);

  const handleConfirmSubmit = useCallback(async () => {
    try {
      setLoading(true);
      stopTimer();
      
      const pointsEarned = calculateScore();
      const totalPoints = quizDetails.questions.reduce((sum, q) => sum + (q.points || 1), 0);
      const percentageScore = totalPoints > 0 ? Math.round((pointsEarned / totalPoints) * 100) : 0;

      const result = await quizService.completeQuizAttempt(
        attemptId, 
        pointsEarned,
        JSON.stringify(answers)
      );
      
      const quizLeaderboard = await leaderboardService.getLeaderboardByQuiz(quizDetails.id);
      const studentRank = quizLeaderboard?.findIndex(
        entry => entry.studentId === user.id
      ) + 1;
      
      setQuizResult({
        ...result,
        score: percentageScore,
        pointsEarned,
        totalPoints,
        passed: pointsEarned >= quizDetails.passingScore,
        rank: studentRank || 1
      });
      setShowResultModal(true);
      setShowConfirmationModal(false);
      setHasUnsavedChanges(false);
      localStorage.removeItem(lsKey); // Clear saved state on successful submission
      
      if (onComplete) {
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
  }, [stopTimer, calculateScore, quizDetails, attemptId, answers, user, onComplete, lsKey]);

  const handleModalClose = () => {
    setShowResultModal(false);
    if(classroomId) {
      navigate(`/student/classrooms/${classroomId}`, { state: { activeTab: 'lessons' } });
    } else {
      navigate('/student/classrooms');
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Prevent unintended submissions when typing in fields or when a modal is open
      const target = e.target || document.activeElement;
      const tag = (target?.tagName || '').toLowerCase();
      const isTypingElement = tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable;
      const isAnyModalOpen = showResultModal || showReviewModal || showConfirmationModal || showExitConfirmModal;

      if (isTypingElement || isAnyModalOpen) return;

      if (e.key === 'Enter') {
        if (currentQuestionIndex === quizDetails?.questions?.length - 1) {
          handleSubmitQuiz();
        } else {
          goToNextQuestion();
        }
      }
    };

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [currentQuestionIndex, quizDetails?.questions?.length, handleSubmitQuiz, goToNextQuestion]);

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
    <div className="px-4 sm:px-6 ">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end mb-4">
            <button 
              aria-label="Leave Quiz" 
              onClick={handleLeaveQuizClick}
              className="text-gray-500 hover:text-red-500 p-2 rounded-full bg-white shadow transition-colors"
            >
                <FaTimes size={20} />
            </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{quizDetails.quizName || 'Quiz'}</h1>
              
              <div className="mb-8">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold text-gray-600 mb-2">
                    Question {currentQuestionIndex + 1}/{quizDetails.questions.length}
                  </h2>
                   <span className="text-sm font-bold text-white bg-blue-500 px-3 py-1 rounded-full">
                    {(currentQuestion.points || 1)} {(currentQuestion.points || 1) === 1 ? 'Point' : 'Points'}
                  </span>
                </div>
                <p className="text-xl text-gray-800 mb-6 min-h-[60px]">
                  {currentQuestion.questionText || currentQuestion.question}
                </p>
                {renderQuestion()}
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:text-gray-50 text-gray-700 font-semibold rounded-lg shadow-sm hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaArrowLeft/>
                Previous
              </button>
              
              {currentQuestionIndex === quizDetails.questions.length - 1 ? (
                <button
                  onClick={handleSubmitQuiz}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-md transition-transform hover:scale-105"
                >
                  Submit Quiz
                </button>
              ) : (
                <button
                  onClick={goToNextQuestion}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-transform hover:scale-105"
                >
                  Next
                  <FaArrowRight/>
                </button>
              )}
            </div>
             {timeLeft !== null && (
                <div className="flex justify-center items-center mt-6">
                    <div className={`px-4 py-2 rounded-full text-white font-semibold shadow-lg ${timeLeft < 60 ? 'bg-red-500 animate-pulse' : timeLeft < 300 ? 'bg-yellow-500' : 'bg-blue-500'}`}>
                    Time Left: {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
                    </div>
                </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-lg sticky top-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Questions</h3>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
                {quizDetails.questions.map((q, index) => {
                  const isCurrent = currentQuestionIndex === index;
                  const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '' && (!Array.isArray(answers[q.id]) || answers[q.id].length > 0);

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200 border-2 ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50 font-semibold text-blue-800'
                          : 'border-transparent text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="truncate">Question {index + 1}</span>
                      {isAnswered ? (
                        <FaCheckCircle className="text-green-500 flex-shrink-0" />
                      ) : (
                        <FaRegCircle className="text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <QuizResultModal 
        show={showResultModal}
        onHide={handleModalClose}
        result={quizResult}
        onViewLeaderboard={handleViewLeaderboard}
      />

      <ReviewModal 
        show={showReviewModal}
        onHide={() => setShowReviewModal(false)}
        questions={quizDetails?.questions || []}
        answers={answers}
        onSubmit={handleSubmitQuiz}
      />

      <ConfirmationModal 
        show={showConfirmationModal}
        onHide={() => setShowConfirmationModal(false)}
        questions={quizDetails?.questions || []}
        answers={answers}
        onSubmit={handleConfirmSubmit}
      />

      <Modal
        isOpen={showExitConfirmModal}
        onClose={handleStayOnPage}
        title="Leave Quiz?"
        >
        <p className="dark:text-gray-50 text-gray-700 mb-4">
          Your quiz progress is automatically saved, so you can continue later. Are you sure you want to leave the quiz now?
        </p>
        <div className="mt-6 flex justify-end gap-4">
        <Button variant="cancel" rounded="full" onClick={handleLeavePage}>
                Leave Quiz
            </Button>
            <Button variant="default" rounded="full" onClick={handleStayOnPage}>
                Stay on Quiz
            </Button>
          
        </div>
      </Modal>
    </div>
  );
};

export default QuizAttemptPage; 