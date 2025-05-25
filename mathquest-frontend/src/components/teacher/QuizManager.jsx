import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import quizService from '../../services/quizService';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const QuizManager = ({ classroomId, isStudent = false, refreshTrigger = 0 }) => {
  const { token, currentUser } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!classroomId) return;
    
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        
        console.log(`Fetching quizzes for classroom ${classroomId} with isStudent=${isStudent}`);
        
        // Different endpoint for students to only get available quizzes
        let fetchedQuizzes = [];
        
        try {
          // First try getting classroom quizzes
          fetchedQuizzes = isStudent 
            ? await quizService.getAvailableQuizzes(classroomId)
            : await quizService.getQuizzesByClassroom(classroomId);
          
          console.log(`Retrieved ${fetchedQuizzes.length} quizzes for classroom ${classroomId}`);
        } catch (err) {
          console.error(`Error fetching quizzes for classroom ${classroomId}:`, err);
          
          // Fallback approach - get activities then get quizzes for each activity
          console.log('Using fallback approach to fetch quizzes through activities');
          
          try {
            // Fetch all activities for this classroom
            const activitiesResponse = await api.get(`/activities/classroom/${classroomId}`);
            const activities = activitiesResponse.data;
            
            // Filter quiz activities
            const quizActivities = activities.filter(a => a.type === 'QUIZ');
            console.log(`Found ${quizActivities.length} quiz activities`);
            
            // Get quizzes for each activity
            const quizPromises = quizActivities.map(activity => 
              quizService.getQuizByActivity(activity.id).catch(e => null)
            );
            
            const quizResults = await Promise.all(quizPromises);
            fetchedQuizzes = quizResults.filter(q => q !== null);
            console.log(`Retrieved ${fetchedQuizzes.length} quizzes via activities`);
          } catch (fallbackErr) {
            console.error('Fallback quiz fetch also failed:', fallbackErr);
            throw err; // Throw the original error
          }
        }
        
        if (fetchedQuizzes && Array.isArray(fetchedQuizzes)) {
          setQuizzes(fetchedQuizzes);
        } else {
          console.warn('Response is not an array:', fetchedQuizzes);
          setQuizzes([]);
        }
      } catch (err) {
        console.error('Error fetching quizzes:', err);
        setError('Failed to load quizzes. Please try again.');
        toast.error('Failed to load quizzes');
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [classroomId, token, isStudent, refreshTrigger]);

  const handleStartQuiz = async (quizId) => {
    try {
      if (!currentUser?.id) {
        toast.error('You must be logged in to take a quiz');
        return;
      }
      
      // Start the quiz attempt
      const attempt = await quizService.startQuizAttempt(quizId, currentUser.id);
      
      // Navigate to the quiz attempt page where students can answer questions
      navigate(`/student/quizzes/${quizId}/attempt/${attempt.id}`);
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast.error('Failed to start quiz: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz? All student attempts will be lost.')) {
      return;
    }

    try {
      await quizService.deleteQuiz(quizId);
      
      // Update the local state
      setQuizzes(prevQuizzes => prevQuizzes.filter(q => q.id !== quizId));
      
      toast.success('Quiz deleted successfully');
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    }
  };

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return 'No end date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
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
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error! </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (!quizzes.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No quizzes available for this classroom yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Quizzes</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes.map(quiz => (
          <div key={quiz.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="bg-blue-600 text-white px-4 py-3">
              <h4 className="font-semibold truncate">{quiz.quizName}</h4>
            </div>
            
            <div className="p-4">
              <p className="text-sm text-gray-700 mb-2 line-clamp-2">{quiz.description || 'No description provided'}</p>
              
              <div className="mt-3 space-y-1 text-xs text-gray-600">
                <p>Total Questions: {quiz.totalItems}</p>
                <p>Time Limit: {quiz.timeLimitMinutes} minutes</p>
                <p>Passing Score: {quiz.passingScore}/{quiz.overallScore}</p>
                <p>Available From: {formatDate(quiz.availableFrom)}</p>
                <p>Available To: {formatDate(quiz.availableTo)}</p>
                <p>{quiz.repeatable ? 'Multiple attempts allowed' : 'Single attempt only'}</p>
              </div>
              
              <div className="flex justify-between mt-4">
                {isStudent ? (
                  <button
                    onClick={() => handleStartQuiz(quiz.id)}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Start Quiz
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                    >
                      Delete
                    </button>
                    
                    <div className="flex space-x-2">
                      <Link
                        to={`/teacher/quizzes/${quiz.id}/results`}
                        className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100"
                      >
                        Results
                      </Link>
                      <button
                        onClick={() => navigate(`/student/quizzes/${quiz.id}/preview`)}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                      >
                        Preview
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizManager; 