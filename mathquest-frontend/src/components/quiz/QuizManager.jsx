import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import quizService from '../../services/quizService';
import { useAuth } from '../../context/AuthContext';

const QuizManager = ({ quizId, classroomId }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [existingAttempt, setExistingAttempt] = useState(null);
  const [checkingAttempts, setCheckingAttempts] = useState(true);

  // Check if the user has an existing attempt for this quiz
  useEffect(() => {
    const checkExistingAttempt = async () => {
      if (!currentUser || !quizId) return;
      
      try {
        setCheckingAttempts(true);
        const attempts = await quizService.getQuizAttemptsByStudent(currentUser.id);
        const quizAttempts = attempts.filter(
          attempt => attempt.quizId === parseInt(quizId) && !attempt.completed
        );
        
        if (quizAttempts.length > 0) {
          // Get the most recent attempt
          setExistingAttempt(quizAttempts[0]);
        }
      } catch (error) {
        console.error('Error checking existing attempts:', error);
      } finally {
        setCheckingAttempts(false);
      }
    };
    
    checkExistingAttempt();
  }, [quizId, currentUser]);

  const handleStartQuiz = async () => {
    if (!currentUser) {
      toast.error('Please log in to take the quiz');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // If there's an existing incomplete attempt, continue it
      if (existingAttempt) {
        navigate(`/student/quizzes/${quizId}/attempt/${existingAttempt.id}`);
        return;
      }
      
      // Otherwise, create a new attempt
      const attempt = await quizService.startQuizAttempt(quizId, currentUser.id);
      navigate(`/student/quizzes/${quizId}/attempt/${attempt.id}`);
    } catch (error) {
      // Handle specific error cases
      if (error.response?.data?.message === 'This quiz cannot be attempted more than once') {
        toast.error('You have already completed this quiz and it cannot be retaken');
      } else if (error.response?.data?.message === 'Quiz is not yet available') {
        toast.error('This quiz is not yet available');
      } else if (error.response?.data?.message === 'Quiz is no longer available') {
        toast.error('This quiz is no longer available');
      } else {
        toast.error('Failed to start quiz. Please try again later.');
      }
      console.error('Error starting quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAttempts) {
    return (
      <button disabled className="px-4 py-2 rounded-lg font-semibold text-white bg-gray-400 cursor-not-allowed">
        Checking...
      </button>
    );
  }

  return (
    <button
      onClick={handleStartQuiz}
      disabled={loading}
      className={`px-4 py-2 rounded-lg font-semibold text-white transition-colors
        ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
    >
      {loading ? 'Starting...' : existingAttempt ? 'Continue Quiz' : 'Start Quiz'}
    </button>
  );
};

export default QuizManager; 