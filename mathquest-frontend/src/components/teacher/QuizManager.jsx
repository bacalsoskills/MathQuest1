import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import quizService from '../../services/quizService';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AddQuizModal from './AddQuizModal';
import QuizPreviewModal from './QuizPreviewModal';
import { FaCheck, FaStar } from 'react-icons/fa';

const QuizManager = ({ classroomId, isStudent = false, refreshTrigger = 0 }) => {
  const { token, currentUser } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editQuizId, setEditQuizId] = useState(null);
  const [previewQuizId, setPreviewQuizId] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState({}); // Store attempts by quizId

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
            ? await quizService.getQuizzesByClassroom(classroomId)
            : await quizService.getQuizzesByClassroom(classroomId);
          
          if (isStudent) {
            console.log("Raw available quizzes response:", fetchedQuizzes);
            
            // Fetch student's attempts for all quizzes
            if (currentUser?.id) {
              const attempts = await quizService.getQuizAttemptsByStudent(currentUser.id);
              const attemptsByQuiz = {};
              
              attempts.forEach(attempt => {
                if (!attemptsByQuiz[attempt.quizId]) {
                  attemptsByQuiz[attempt.quizId] = [];
                }
                attemptsByQuiz[attempt.quizId].push(attempt);
              });
              
              setQuizAttempts(attemptsByQuiz);
            }
          }

          console.log(`Retrieved ${fetchedQuizzes.length} quizzes for classroom ${classroomId}`);
        } catch (err) {
          console.error(`Error fetching quizzes for classroom ${classroomId}:`, err);
          
          // Fallback approach - get activities then get quizzes for each activity
          console.log('Using fallback approach to fetch quizzes through activities');
          
          try {
            // Fetch all activities for this classroom
            const activitiesResponse = await api.get(`/activities/classroom/${classroomId}`);
            const activities = activitiesResponse.data;
            
            console.log('Activities fetched:', activities);
            
            // Filter quiz activities
            const quizActivities = activities.filter(a => a.type === 'QUIZ');
            console.log('Filtered quiz activities:', quizActivities);
            // Filter quiz activities
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
          console.log('Fetched quizzes:', fetchedQuizzes);
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

        // Find the quiz to check its availability
        const quiz = quizzes.find(q => q.id === quizId);
        if (!quiz) {
          toast.error('Quiz not found');
          return;
        }
  
        const now = new Date();
        const availableFrom = new Date(quiz.availableFrom);
        const availableTo = new Date(quiz.availableTo);
  
        if (now < availableFrom || now > availableTo) {
          toast.error('Quiz is not available at this time');
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

  // const handleDeleteQuiz = async (quizId) => {
  //   if (!window.confirm('Are you sure you want to delete this quiz? All student attempts will be lost.')) {
  //     return;
  //   }

  //   try {
  //     await quizService.deleteQuiz(quizId);
      
  //     // Update the local state
  //     setQuizzes(prevQuizzes => prevQuizzes.filter(q => q.id !== quizId));
      
  //     toast.success('Quiz deleted successfully');
  //   } catch (error) {
  //     console.error('Error deleting quiz:', error);
  //     toast.error('Failed to delete quiz');
  //   }
  // };

  // Format date string
  
  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm(
      'Are you sure you want to delete this quiz? This action will permanently delete:\n\n' +
      '• All student attempts and scores for this quiz\n' +
      '• All quiz data and questions\n' +
      '• All related leaderboard entries\n\n' +
      'This action cannot be undone. Do you want to proceed?'
    )) {
      return;
    }

    try {
      await quizService.deleteQuiz(quizId);
      
      // Update the local state
      setQuizzes(prevQuizzes => prevQuizzes.filter(q => q.id !== quizId));
      
      toast.success('Quiz and all related data deleted successfully');
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz: ' + (error.message || 'Unknown error'));
    }
  };
  
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

  const getQuizStatus = (quiz) => {
    if (!isStudent || !currentUser?.id) return null;
    
    const attempts = quizAttempts[quiz.id] || [];
    const passedAttempts = attempts.filter(a => a.passed);
    const hasPassed = passedAttempts.length > 0;
    const attemptCount = attempts.length;
    const canAttempt = quiz.repeatable ? 
      (!quiz.maxAttempts || attemptCount < quiz.maxAttempts) : 
      attemptCount === 0;
    
    // Get the best score from attempts
    const bestScore = attempts.length > 0 
      ? Math.max(...attempts.map(a => a.score || 0))
      : 0;
    
    return {
      hasPassed,
      attemptCount,
      canAttempt,
      bestScore
    };
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
        {quizzes.map(quiz => {
          const status = getQuizStatus(quiz);
          return (
            <div key={quiz.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
                <h4 className="font-semibold truncate">{quiz.quizName}</h4>
                {isStudent && status && (
                  <div className="flex items-center gap-2">
                    {status.hasPassed ? (
                      <div className="flex items-center gap-1 bg-green-500 px-2 py-1 rounded-full">
                        <FaCheck className="text-white" />
                        <span className="text-sm">Passed!</span>
                      </div>
                    ) : status.attemptCount > 0 ? (
                      <div className="flex items-center gap-1 bg-blue-500 px-2 py-1 rounded-full">
                        <FaStar className="text-yellow-300" />
                        <span className="text-sm">Best: {status.bestScore}%</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
              
              <div className="p-4 text-base">
                <p className="text-base text-gray-700 mb-2 line-clamp-2">{quiz.description || 'No description provided'}</p>
                
                <div className="mt-3 space-y-1 text-base text-gray-600">
                  <p><span className="font-bold">Total Questions:</span> {quiz.totalItems}</p>
                  <p><span className="font-bold">Time Limit:</span> {quiz.timeLimitMinutes} minutes</p>
                  <p><span className="font-bold">Passing Score:</span> {quiz.passingScore}/{quiz.overallScore}</p>
                  <p><span className="font-bold">Available From:</span> {formatDate(quiz.availableFrom)}</p>
                  <p><span className="font-bold">Available To:</span> {formatDate(quiz.availableTo)}</p>
                  <p><span className="font-bold">{quiz.repeatable ? (`Multiple attempts allowed${quiz.maxAttempts ? ` : ${quiz.maxAttempts} attempts only` : ''}`) : 'Single attempt only'}</span></p>
                  {isStudent && status && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      {status.hasPassed ? (
                        <p className="text-green-600 font-medium">Great job! You've passed this quiz!</p>
                      ) : status.attemptCount > 0 ? (
                        <p className="text-blue-600 font-medium">
                          Keep trying! Your best score is {status.bestScore}%. {status.canAttempt ? 'You can try again!' : ''}
                        </p>
                      ) : (
                        <p className="text-blue-600 font-medium">Ready to test your knowledge? Give it a try!</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Attempts: {status.attemptCount}{quiz.maxAttempts ? `/${quiz.maxAttempts}` : ''}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between mt-4 items-center">
                  {isStudent ? (
                    <button
                      onClick={() => handleStartQuiz(quiz.id)}
                      disabled={!status?.canAttempt}
                      className={`w-full px-3 py-2 rounded transition-colors text-base ${
                        status?.canAttempt 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {status?.attemptCount > 0 
                        ? (status.hasPassed ? 'Try Again' : 'Try Again') 
                        : 'Start Quiz'}
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditQuizId(quiz.id)}
                        className="text-gray-600 hover:text-gray-900 text-base focus:outline-none"
                        style={{ background: 'none', border: 'none', padding: 0 }}
                      >
                        Edit
                      </button>
                      <span className="mx-1 text-gray-400">|</span>
                      <button
                        onClick={() => setPreviewQuizId(quiz.id)}
                        className="text-gray-600 hover:text-gray-900 text-base focus:outline-none"
                        style={{ background: 'none', border: 'none', padding: 0 }}
                      >
                        Preview
                      </button>
                      <span className="mx-1 text-gray-400">|</span>
                      <button
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="text-red-600 hover:text-red-900 text-base focus:outline-none"
                        style={{ background: 'none', border: 'none', padding: 0 }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Edit Quiz Modal */}
      {editQuizId && (
        <AddQuizModal
          isOpen={!!editQuizId}
          onClose={() => setEditQuizId(null)}
          quizId={editQuizId}
          classroomId={classroomId}
          isEdit={true}
          onQuizCreated={() => { setEditQuizId(null); setLoading(true); }}
        />
      )}
      {/* Preview Quiz Modal */}
      {previewQuizId && (
        <QuizPreviewModal
          isOpen={!!previewQuizId}
          onClose={() => setPreviewQuizId(null)}
          quizId={previewQuizId}
        />
      )}
    </div>
  );
};

export default QuizManager; 