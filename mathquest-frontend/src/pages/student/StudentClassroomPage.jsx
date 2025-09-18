import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import classroomService from "../../services/classroomService";
import lessonService from "../../services/lessonService";
import { leaderboardService } from "../../services/leaderboardService";
import quizService from "../../services/quizService";
import LessonSidebar from "../../components/lessons/LessonSidebar";
import ContentBlockDisplay from "../../components/lessons/ContentBlockDisplay";
import ClassroomGamesTab from "./ClassroomGamesTab";
import QuizManager from "../../components/teacher/QuizManager";
import Leaderboard from "../../components/leaderboard/Leaderboard";
import { Header } from '../../ui/heading';
import activityService from "../../services/activityService";
import { AlertCircle, CheckCircle, BookOpen } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import QuizDisplay from "../../components/quiz/QuizDisplay";
import { Button } from "../../ui/button";

const StudentClassroomPage = () => {
  const { classroomId, lessonId: initialLessonId } = useParams();
  const location = useLocation();
  const { currentUser: user } = useAuth();
  const isStudent = true; // Since this is StudentClassroomPage, we're always in student mode
  const [classroomDetails, setClassroomDetails] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false); // Separate loading state for lesson changes
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [activities, setActivities] = useState([]);
  const [quizStats, setQuizStats] = useState({ passedQuizzes: 0, notTakenQuizzes: 0 });
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [completionStatus, setCompletionStatus] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [unlockedLessons, setUnlockedLessons] = useState(new Set());
  const [quizAttempts, setQuizAttempts] = useState({});

  const fetchLessons = async () => {
    if (!classroomId) return;
    try {
      const lessonsList = await lessonService.getLessonsByClassroomId(classroomId);
      setLessons(lessonsList);
    } catch (err) {
      setError("Failed to load lessons.");
      setLessons([]);
    }
  };

  // Function to find the last unlocked lesson
  const findLastUnlockedLesson = async () => {
    if (!lessons.length || !user?.id) return null;

    try {
      // Check completion status for each lesson to determine which ones are unlocked
      const unlockedLessonIds = [];
      
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        let isUnlocked = false;

        if (i === 0) {
          // First lesson is always unlocked
          isUnlocked = true;
        } else {
          // Check if previous lesson is completed
          const previousLesson = lessons[i - 1];
          try {
            const status = await lessonService.getLessonCompletionStatus(previousLesson.id, user.id);
            const hasQuiz = previousLesson.activities?.some(activity => activity.type === 'QUIZ');
            
            if (!hasQuiz) {
              isUnlocked = status.contentRead;
            } else {
              isUnlocked = status.contentRead && status.quizCompleted;
            }
          } catch (err) {
            console.error(`Error checking completion status for lesson ${previousLesson.id}:`, err);
            isUnlocked = false;
          }
        }

        if (isUnlocked) {
          unlockedLessonIds.push(lesson.id);
        }
      }

      // Return the last unlocked lesson, or the first lesson if none are unlocked
      return unlockedLessonIds.length > 0 
        ? unlockedLessonIds[unlockedLessonIds.length - 1] 
        : lessons[0]?.id || null;
    } catch (err) {
      console.error('Error finding last unlocked lesson:', err);
      return lessons[0]?.id || null;
    }
  };

  useEffect(() => {
    // Check if there's an active tab in location state (from navigation)
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    } else if (location.state && !location.state.activeTab) {
      // Explicitly set to null if location state exists but has no activeTab
      setActiveTab(null);
    }
  }, [location.state]);

  // Handle URL hash changes to automatically switch tabs
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const tabName = hash.replace('#', '');
        // Map hash values to tab names
        const tabMapping = {
          'leaderboard-tab': 'leaderboard',
          'lessons-tab': 'lessons',
          'activities-tab': 'activities'
        };
        
        if (tabMapping[tabName]) {
          setActiveTab(tabMapping[tabName]);
        }
      } else {
        // No hash present, set activeTab to null
        setActiveTab(null);
      }
    };

    // Check hash on component mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!classroomId) return;
      try {
        setLoading(true);
        
        // Fetch classroom details for header information
        const details = await classroomService.getClassroomDetails(classroomId);
        setClassroomDetails(details);
        
        // Fetch lessons
        await fetchLessons();

        // Fetch activities for the classroom
        const activitiesList = await activityService.getActivitiesByClassroom(classroomId);
        if (activitiesList) {
          setActivities(activitiesList);
        }

        // Fetch quiz statistics
        try {
          const performance = await leaderboardService.getStudentPerformance(classroomId);
          setQuizStats({
            passedQuizzes: performance.passedQuizzes || 0,
            notTakenQuizzes: performance.notTakenQuizzes || 0
          });
        } catch (quizError) {
          console.error("Error fetching quiz statistics:", quizError);
          // Don't set error state here as it's not critical
        }
       
        // Set initial lesson ID from URL parameter or last unlocked lesson
        let lessonToLoadId = initialLessonId;
        if (!lessonToLoadId && lessons.length > 0) {
          lessonToLoadId = await findLastUnlockedLesson();
        }
        setCurrentLessonId(lessonToLoadId);
      } catch (err) {
        console.error("Error fetching classroom data:", err);
        setError("Failed to load classroom data.");
        setClassroomDetails(null);
        setLessons([]);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classroomId, initialLessonId]);

  useEffect(() => {
    const fetchLessonDetails = async () => {
      if (!currentLessonId) {
        setSelectedLesson(null);
        return;
      }
      try {
        setLessonLoading(true);
        const lessonData = await lessonService.getLessonById(currentLessonId);
        setSelectedLesson(lessonData);
      } catch (err) {
        console.error(`Error fetching lesson ${currentLessonId}:`, err);
        setError(`Failed to load lesson: ${err.message}`);
        setSelectedLesson(null);
      } finally {
        setLessonLoading(false);
      }
    };

    if (classroomDetails) {
      fetchLessonDetails();
    }
  }, [currentLessonId, classroomDetails]);

  useEffect(() => {
    if (selectedLesson?.id && user?.id) {
      // Fetch completion status
      lessonService.getLessonCompletionStatus(selectedLesson.id, user.id)
        .then(status => {
          setCompletionStatus(status);
          
          // Check for quiz availability
          const hasQuiz = selectedLesson.activities?.some(activity => activity.type === 'QUIZ');

          // If content is already read, show quiz if available
          if (status.contentRead) {
            if (hasQuiz && !status.quizCompleted) {
              setShowQuiz(true);
            } else if (hasQuiz && status.quizCompleted) {
              unlockNextLesson();
            } else if (!hasQuiz) {
              unlockNextLesson();
            }
            setHasScrolledToBottom(true);
          } else {
            // Check if content is small enough to be read without scrolling
            setTimeout(() => {
              const contentContainer = document.querySelector('.content-blocks');
              if (contentContainer) {
                const isContentSmall = contentContainer.scrollHeight <= contentContainer.clientHeight;
                if (isContentSmall) {
                  markContentAsRead();
                }
              }
            }, 100); // Small delay to ensure content is rendered
          }
        })
        .catch(err => {
          console.error(`Error fetching completion status:`, err);
        });
    }
  }, [selectedLesson?.id, user?.id]);

  // Add a new useEffect to check quiz completion status periodically
  useEffect(() => {
    if (!selectedLesson?.id || !user?.id) return;

    const checkQuizCompletion = async () => {
      try {
        const status = await lessonService.getLessonCompletionStatus(selectedLesson.id, user.id);
        
        if (status.quizCompleted && !completionStatus?.quizCompleted) {
          setCompletionStatus(status);
          unlockNextLesson();
        }
      } catch (err) {
        console.error(`Error checking quiz completion:`, err);
      }
    };

    // Check every 10 seconds instead of 2 seconds to reduce API calls
    const intervalId = setInterval(checkQuizCompletion, 10000);

    return () => clearInterval(intervalId);
  }, [selectedLesson?.id, user?.id, completionStatus?.quizCompleted]);

  // Add a new useEffect to handle quiz completion from URL state
  useEffect(() => {
    if (location.state?.quizCompleted) {
      // Ensure we have the score and lesson ID
      if (location.state.score !== undefined && selectedLesson?.id) {
        handleQuizComplete(location.state.score);
      } else {
        console.error(`Quiz completion state missing required data:`, {
          score: location.state.score,
          lessonId: selectedLesson?.id
        });
      }
      
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state, selectedLesson]);

  const markContentAsRead = () => {
    if (selectedLesson && !completionStatus?.contentRead) {
      lessonService.markLessonContentAsRead(selectedLesson.id, user.id)
        .then(response => {
          setCompletionStatus(prev => ({ ...prev, contentRead: true }));
          setHasScrolledToBottom(true);
          
          // Check for quiz availability
          const hasQuiz = selectedLesson.activities?.some(activity => activity.type === 'QUIZ');

          if (hasQuiz) {
            setShowQuiz(true);
          } else {
            unlockNextLesson();
          }
        })
        .catch(err => {
          console.error(`Error marking content as read:`, err);
        });
    }
  };

  // Add a new useEffect to check content size on mount and when content changes
  useEffect(() => {
    if (selectedLesson?.contentBlocks) {
      setTimeout(() => {
        const contentContainer = document.querySelector('.content-blocks');
        if (contentContainer) {
          const isContentSmall = contentContainer.scrollHeight <= contentContainer.clientHeight;
          
          if (isContentSmall && !completionStatus?.contentRead) {
            markContentAsRead();
          }
        }
      }, 100);
    }
  }, [selectedLesson?.contentBlocks, completionStatus?.contentRead]);

  // Add a new useEffect to initialize unlocked lessons from completion status
  useEffect(() => {
    const initializeUnlockedLessons = async () => {
      if (!lessons.length || !user?.id) return;

      try {
        const unlockedSet = new Set();
        
        // First lesson is always unlocked
        if (lessons.length > 0) {
          unlockedSet.add(lessons[0].id);
        }

        // Check completion status for each lesson
        for (const lesson of lessons) {
          try {
            const status = await lessonService.getLessonCompletionStatus(lesson.id, user.id);
            
            // If this lesson is completed, add it and the next one to unlocked lessons
            if (status.quizCompleted) {
              unlockedSet.add(lesson.id); // Add the completed lesson
              const lessonIndex = lessons.findIndex(l => l.id === lesson.id);
              if (lessonIndex < lessons.length - 1) {
                unlockedSet.add(lessons[lessonIndex + 1].id); // Add the next lesson
              }
            }
          } catch (err) {
            console.error(`Error checking completion status for lesson ${lesson.id}:`, err);
          }
        }

        setUnlockedLessons(unlockedSet);
      } catch (err) {
        console.error(`Error initializing unlocked lessons:`, err);
      }
    };

    initializeUnlockedLessons();
  }, [lessons, user?.id]);

  // Add a new useEffect to set the current lesson to the last unlocked lesson when no lesson is selected
  useEffect(() => {
    const setDefaultLesson = async () => {
      if (lessons.length > 0 && !currentLessonId && user?.id) {
        const lastUnlockedLessonId = await findLastUnlockedLesson();
        if (lastUnlockedLessonId) {
          setCurrentLessonId(lastUnlockedLessonId);
        }
      }
    };

    setDefaultLesson();
  }, [lessons, currentLessonId, user?.id]);

  const unlockNextLesson = () => {
    const currentLessonIndex = lessons.findIndex(l => l.id === selectedLesson.id);
    
    if (currentLessonIndex < lessons.length - 1) {
      const nextLesson = lessons[currentLessonIndex + 1];
      
      // Add both the current lesson and the next lesson to unlocked lessons
      setUnlockedLessons(prev => {
        const newUnlocked = new Set([...prev, selectedLesson.id, nextLesson.id]);
        return newUnlocked;
      });
    } else {
      // Still add the current lesson to unlocked lessons if it's the last one
      setUnlockedLessons(prev => {
        const newUnlocked = new Set([...prev, selectedLesson.id]);
        return newUnlocked;
      });
    }
  };

  const handleSelectLesson = (lessonId) => {
    setCurrentLessonId(lessonId);
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 1;
    
    if (isAtBottom && !hasScrolledToBottom) {
      markContentAsRead();
    }
  };

  const handleQuizComplete = (score) => {
    // First, mark the lesson quiz as completed
    lessonService.markLessonQuizAsCompleted(selectedLesson.id, user.id, score)
      .then(response => {
        // Update completion status
        setCompletionStatus(prev => {
          const newStatus = { 
            ...prev, 
            quizCompleted: true, 
            quizScore: score,
            quizCompletedAt: new Date().toISOString()
          };
          return newStatus;
        });
        
        // After quiz completion, unlock next lesson
        unlockNextLesson();

        // Refresh the lesson list to show updated completion status
        fetchLessons();
      })
      .catch(err => {
        console.error(`Error marking lesson quiz as completed:`, err);
      });
  };

  // Add a new useEffect to check quiz completion status
  useEffect(() => {
    if (!selectedLesson?.id || !user?.id) return;

    const checkQuizCompletion = async () => {
      try {
        const status = await lessonService.getLessonCompletionStatus(selectedLesson.id, user.id);
        
        if (status.quizCompleted && !completionStatus?.quizCompleted) {
          setCompletionStatus(status);
          unlockNextLesson();
          // Refresh the lesson list to show updated completion status
          fetchLessons();
        }
      } catch (err) {
        console.error(`Error checking quiz completion:`, err);
      }
    };

    // Check every 2 seconds
    const intervalId = setInterval(checkQuizCompletion, 2000);

    return () => clearInterval(intervalId);
  }, [selectedLesson?.id, user?.id, completionStatus?.quizCompleted]);

  // Add a new useEffect to fetch quiz attempts
  useEffect(() => {
    const fetchQuizAttempts = async () => {
      if (!selectedLesson?.activities || !user?.id) return;

      try {
        const quizActivities = selectedLesson.activities.filter(activity => activity.type === 'QUIZ');
        const attemptsMap = {};

        for (const activity of quizActivities) {
          try {
            const quiz = await quizService.getQuizByActivityId(activity.id);

            if (quiz) {
              // Fetch attempts for this quiz using getQuizAttemptsByStudent
              const attempts = await quizService.getQuizAttemptsByStudent(user.id);
              const quizAttempts = attempts
                .filter(attempt => attempt.quizId === quiz.id)
                .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)); // Sort by completion date, most recent first

              attemptsMap[activity.id] = {
                quiz: {
                  ...quiz,
                  quizName: quiz.quizName,
                  timeLimitMinutes: quiz.timeLimitMinutes,
                  totalItems: quiz.totalItems,
                  passingScore: quiz.passingScore,
                  overallScore: quiz.overallScore,
                  maxAttempts: quiz.maxAttempts,
                  repeatable: quiz.repeatable,
                  availableFrom: quiz.availableFrom,
                  availableTo: quiz.availableTo
                },
                attempts: quizAttempts || [],
                lastAttempt: quizAttempts?.length > 0 ? quizAttempts[0] : null // Get the first attempt after sorting (most recent)
              };
            }
          } catch (err) {
            console.error(`Error fetching quiz data for activity ${activity.id}:`, err);
          }
        }

        setQuizAttempts(attemptsMap);
      } catch (err) {
        console.error(`Error fetching quiz attempts:`, err);
      }
    };

    fetchQuizAttempts();
  }, [selectedLesson?.activities, user?.id]);

  // Add a function to check if quiz can be attempted
  const canAttemptQuiz = (activityId) => {
    const quizData = quizAttempts[activityId];
    if (!quizData) return false;

    const { quiz, attempts } = quizData;
    const now = new Date();
    const availableFrom = new Date(quiz.availableFrom);
    const availableTo = new Date(quiz.availableTo);

    // Check if quiz is within available time window
    if (now < availableFrom || now > availableTo) return false;

    // Check if max attempts reached
    if (quiz.maxAttempts && attempts.length >= quiz.maxAttempts) return false;

    return true;
  };

  // Add a function to get quiz button text
  const getQuizButtonText = (activityId) => {
    const quizData = quizAttempts[activityId];
    if (!quizData) return "Start Quiz";

    const { quiz, attempts } = quizData;
    const now = new Date();
    const availableFrom = new Date(quiz.availableFrom);
    const availableTo = new Date(quiz.availableTo);

    if (now < availableFrom) return "Not Available Yet";
    if (now > availableTo) return "Quiz Expired";
    if (quiz.maxAttempts && attempts.length >= quiz.maxAttempts) return "Max Attempts Reached";
    if (attempts.length > 0) return "Try Again";
    return "Start Quiz";
  };

  // Update the quiz section in the render
  const renderQuizSection = () => {
    if (!selectedLesson?.activities?.filter(activity => activity.type === 'QUIZ').length) return null;

    return (
      <div className="mt-8">
        {!completionStatus?.contentRead && isStudent && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-700">
              Please read through the entire lesson content to access the quiz.
            </p>
          </div>
        )}
        
        {completionStatus?.contentRead && (
          <div className="quiz-section">
            <Header type="h3" weight="semibold" className="mb-4">
              Lesson Quiz
            </Header>
            {selectedLesson.activities
              .filter(activity => activity.type === 'QUIZ')
              .map(activity => {
                const quizData = quizAttempts[activity.id];
                const canAttempt = canAttemptQuiz(activity.id);
                const buttonText = getQuizButtonText(activity.id);
                const lastAttempt = quizData?.lastAttempt;

                return (
                  <div key={activity.id} className="mb-6 p-4 bg-white rounded-lg shadow">
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold">{quizData?.quiz?.quizName || 'Quiz'}</h4>
                      <p className="text-gray-600">{quizData?.quiz?.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="font-medium">Time Limit:</span> {quizData?.quiz?.timeLimitMinutes || 0} minutes
                      </div>
                      <div>
                        <span className="font-medium">Total Items:</span> {quizData?.quiz?.totalItems || 0}
                      </div>
                      <div>
                        <span className="font-medium">Passing Score:</span> {quizData?.quiz?.passingScore || 0}/{quizData?.quiz?.overallScore || 0}
                      </div>
                      <div>
                        <span className="font-medium">Max Attempts:</span> {quizData?.quiz?.maxAttempts || '1'}
                      </div>
                      <div>
                        <span className="font-medium">Available From:</span> {quizData?.quiz?.availableFrom ? new Date(quizData.quiz.availableFrom).toLocaleString() : 'Not set'}
                      </div>
                      <div>
                        <span className="font-medium">Available To:</span> {quizData?.quiz?.availableTo ? new Date(quizData.quiz.availableTo).toLocaleString() : 'Not set'}
                      </div>
                      <div>
                        <span className="font-medium">Attempts:</span> {quizData?.attempts?.length || 0}/{quizData?.quiz?.maxAttempts || '1'}
                      </div>
                    </div>

                    {lastAttempt && (
                      <div className="mb-4 p-3 bg-gray-50 rounded">
                        <p className="font-medium">Last Attempt:</p>
                        <p>Score: {lastAttempt.score}/{quizData?.quiz?.overallScore || 0}</p>
                        <p>Date: {new Date(lastAttempt.completedAt).toLocaleString()}</p>
                        {/* <p>Attempt: {quizData?.attempts?.length || 0}/{quizData?.quiz?.maxAttempts || '∞'}</p> */}
                      </div>
                    )}

                    <button
                      onClick={() => handleStartQuiz(activity.id)}
                      className={`w-full px-3 py-2  transition-colors text-base rounded-full ${
                        canAttempt 
                          ? 'bg-blue-400 text-white hover:bg-blue-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      }`}
                      disabled={!canAttempt}
                    >
                      {buttonText}
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    );
  };

  // Add handler for quiz start
  const handleStartQuiz = async (activityId) => {
    // Find the quiz activity in the lesson
    const quizActivity = selectedLesson.activities?.find(activity => 
      activity.id === activityId && activity.type === 'QUIZ'
    );
    
    if (!quizActivity) {
      console.error(`Quiz activity ${activityId} not found in lesson`);
      return;
    }
    
    try {
      // Get the quiz ID from the activity
      const quiz = await quizService.getQuizByActivityId(activityId);

      if (!quiz) {
        throw new Error('Quiz not found');
      }

      // Create a new quiz attempt
      const attempt = await quizService.createQuizAttempt(quiz.id, user.id);

      // Navigate to the new attempt
      window.location.href = `/student/quizzes/${quiz.id}/attempt/${attempt.id}`;
    } catch (error) {
      console.error(`Error starting quiz:`, error);
      
      // Show user-friendly error message
      if (error.response?.status === 500) {
        const errorMessage = error.response?.data?.message || error.message;
        if (errorMessage.includes("cannot be attempted more than once")) {
          alert("You have already completed this quiz. This quiz cannot be taken again.");
        } else if (errorMessage.includes("Maximum attempts reached")) {
          alert("You have reached the maximum number of attempts for this quiz.");
        } else if (errorMessage.includes("not yet available")) {
          alert("This quiz is not yet available.");
        } else if (errorMessage.includes("no longer available")) {
          alert("This quiz is no longer available.");
        } else {
          alert("Failed to start quiz. Please try again later.");
        }
      } else {
        alert("Failed to start quiz. Please try again later.");
      }
    }
  };

  // Add useEffect to scroll to tab content when tab changes
  useEffect(() => {
    if (activeTab) {
      // Add a small delay to ensure DOM is fully rendered
      setTimeout(() => {
        // Scroll to the tab content section
        const tabContentElement = document.querySelector('.tab-content-section');
        if (tabContentElement) {
          tabContentElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    }
  }, [activeTab]);

  if (loading && !error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }

  if (!classroomDetails) {
    return <div>Classroom not found or failed to load.</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 lg:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="classroom-header flex flex-col md:flex-row md:space-x-8 h-full md:h-auto">
          {/* Left - Image */}
          <div className="w-full md:w-1/3 h-full">
            <div className="h-full bg-gray-200 rounded-tl-3xl rounded-bl-3xl overflow-hidden mb-5 md:mb-0">
              {classroomDetails.image ? (
                <img
                  src={`data:image/jpeg;base64,${classroomDetails.image}`}
                  alt={classroomDetails.name}
                  className="w-full h-[280px] object-cover"
                />
              ) : (
                <div className="w-full h-[280px] flex items-center justify-center bg-gradient-to-r from-blue-100 to-blue-200">
                  <span className="text-2xl text-blue-500 font-medium">
                    {classroomDetails.shortCode}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right - Details */}
          <div className="w-full md:w-2/3 flex flex-col md:pl-4 md:pr-6 py-5 h-full">
            <div className="flex flex-col md:flex-row justify-between">
              <div>
                <div className="text-sm font-bold text-blue-600 mb-1">
                  {classroomDetails.shortCode}
                </div>
                <div className="flex items-center gap-2">
                  <Header type="h1" fontSize="3xl" weight="bold" className="dark:text-gray-50 text-gray-800">
                    {classroomDetails.name}
                  </Header>
                </div>
              </div>

              {/* Teacher */}
              <div className="mt-2 md:mt-0">
                <div className="text-sm font-medium dark:text-gray-50 text-gray-800">
                  Teacher:{' '}
                  {classroomDetails.teacher?.firstName && classroomDetails.teacher?.lastName
                    ? `${classroomDetails.teacher.firstName} ${classroomDetails.teacher.lastName}`
                    : classroomDetails.teacher?.name || 'N/A'}
                </div>
                
              </div>
            </div>

            {/* Description */}
            <div className="mt-3">
              <p className="text-gray-700 dark:text-gray-100">{classroomDetails.description}</p>
            </div>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-4 divide-x divide-gray-300 text-center">
              <div className="stat-counter px-4">
                <div className="text-2xl font-bold dark:text-gray-100">{lessons.length}</div>
                <div className="text-sm text-gray-500 dark:text-gray-100">Lessons</div>
              </div>
              <div className="stat-counter px-4">
                <div className="text-2xl font-bold dark:text-gray-100">{activities.length}</div>
                <div className="text-sm text-gray-500 dark:text-gray-100">Activities</div>
              </div>
              <div className="stat-counter px-4">
                <div className="text-2xl font-bold text-green-500">
                  {quizStats.passedQuizzes}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-100">Passed</div>
              </div>
              <div className="stat-counter px-4">
                <div className="text-2xl font-bold text-orange-500">
                  {quizStats.notTakenQuizzes}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-100">Incomplete</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="my-10">
        <div className="h-[1px] w-full bg-gradient-to-r from-[#18C8FF] via-[#4B8CFF] to-[#6D6DFF] "></div>
          
          <div className="flex flex-col items-center justify-center py-4">
            <div className="tabs-nav flex items-center">
              <button
                onClick={() => handleTabChange("lessons")}
                className="px-4 py-2 mr-2 text-gray-500 hover:text-gray-800 "
                id="lessons-tab"
              >
                <span
                  className={`${
                    activeTab === "lessons"
                      ? "font-semibold border-b-2 border-blue-600 text-blue-600 "
                      : "text-gray-500 hover:text-gray-800 dark:!text-gray-100  dark:hover:!text-gray-100/50"
                  }`}
                >
                  Lessons
                </span>
              </button>

              <div className="border-l border-gray-300 h-6 mx-2" />
            
              <button
                onClick={() => handleTabChange("activities")}
                className="px-4 py-2 text-gray-500 hover:text-gray-800 "
                id="activities-tab"
              >
                <span
                  className={`${
                    activeTab === "activities"
                      ? "font-semibold border-b-2 border-blue-600 text-blue-600 "
                      : "text-gray-500 hover:text-gray-800 dark:!text-gray-100  dark:hover:!text-gray-100/50"
                  }`}
                >
                  Activities
                </span>
              </button>

              <div className="border-l border-gray-300 h-6 mx-2" />
              <button
                onClick={() => handleTabChange("leaderboard")}
                className="px-4 py-2 text-gray-500 hover:text-gray-800 "
                id="leaderboard-tab"
              >
                <span
                  className={`${
                    activeTab === "leaderboard"
                      ? "font-semibold border-b-2 border-blue-600 text-blue-600 "
                      : "text-gray-500 hover:text-gray-800 dark:!text-gray-100  dark:hover:!text-gray-100/50"
                  }`}
                >
                  Leaderboard
                </span>
              </button>
            </div>
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-[#18C8FF] via-[#4B8CFF] to-[#6D6DFF] "></div>
        </div>

        {/* Tab Contents */}
        <div className="mt-6 tab-content-section">
          {activeTab === "lessons" && (
            <div className="flex flex-col md:flex-row gap-6">
              
              <div className="w-full md:w-1/3 bg-[#60B5FF] rounded-tl-3xl rounded-bl-3xl overflow-hidden p-5">
                <LessonSidebar
                  lessons={lessons}
                  currentLessonId={currentLessonId}
                  onSelectLesson={handleSelectLesson}
                  isStudent={true}
                  unlockedLessons={unlockedLessons}
                />
              </div>

     
              <div className="w-full md:w-2/3 bg-[#60B5FF]/20 dark:bg-gray-50 rounded-lg shadow h-[calc(85vh)] flex flex-col relative">
                
                {lessonLoading && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                      <p className="text-gray-600 text-sm">Loading lesson...</p>
                    </div>
                  </div>
                )}
                
                {loading && currentLessonId && !selectedLesson ? (
                  <main className="lesson-detail-placeholder p-6 rounded-md min-h-[300px] flex items-center justify-center shadow h-full">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                      <p className="text-gray-500 text-lg">Loading lesson details...</p>
                    </div>
                  </main>
                ) : selectedLesson ? (
                  <div className="flex flex-col h-full">
                    {/* Fixed Title Section */}
                    <div className="p-5 border-b dark:border-blue-400 border-gray-100">
                      <Header
                        type="h2"
                        weight="bold"
                        className="!text-4xl text-primary "
                      >{selectedLesson.title}</Header>
                    </div>

                    {/* Scrollable Content Section */}
                    <div 
                      className="flex-1 overflow-y-auto p-5"
                      onScroll={handleScroll}
                    >
                      {selectedLesson.contentBlocks?.length > 0 ? (
                        <div className="content-blocks space-y-8">
                          {selectedLesson.contentBlocks.map((block) => (
                            <div key={block.id} className="content-block">
                              <ContentBlockDisplay block={block} />
                            </div>
                          ))}

                          {/* Read Status */}
                          {completionStatus?.contentRead && (
                            <div className="mt-8">
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">Read</span>
                              </div>
                            </div>
                          )}

                          {/* Quiz Section */}
                          {renderQuizSection()}

                          {/* Quiz Completion Status */}
                          {completionStatus?.quizCompleted && (
                            <div className="mt-8">
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span>Quiz Completed </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No content has been added to this lesson yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : lessons.length > 0 && !currentLessonId ? (
                  <main className="lesson-detail-placeholder p-6 bg-gray-50 rounded-md min-h-[300px] flex items-center justify-center shadow h-full">
                    <p className="text-gray-500 text-lg">Please select a lesson to view its details.</p>
                  </main>
                ) : (
                  <main className="lesson-detail-placeholder p-6 bg-gray-50 rounded-md min-h-[300px] flex items-center justify-center shadow h-full">
                    <div className="text-center">
                      <p className="text-gray-500 text-lg mb-4">This classroom currently has no lessons.</p>
                    </div>
                  </main>
                )}
              </div>
            </div>
          )}

          {activeTab === "activities" && (
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="mb-8">
                <QuizManager classroomId={classroomId} isStudent={true}/>
              </div>
              <ClassroomGamesTab classroomId={classroomId} />
            </div>
          )}

          {activeTab === "leaderboard" && (
            <div className="bg-white p-6 rounded-lg shadow">
              <Leaderboard classroomId={classroomId} />
            </div>
          )}

          {!activeTab && (
            <div className="bg-white p-12 rounded-lg shadow text-center">
              <div className="max-w-md mx-auto">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Welcome to {classroomDetails?.name}</h3>
                <p className="text-gray-500 mb-6">
                  Select a tab above to start exploring the classroom content.
                </p>
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => handleTabChange("lessons")}
                    className="flex items-center justify-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-700">View Lessons</span>
                  </button>
                  <button
                    onClick={() => handleTabChange("activities")}
                    className="flex items-center justify-center gap-2 p-4 bg-violet-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <BookOpen className="w-5 h-5 text-violet-600" />
                    <span className="font-medium text-violet-700">View Activities</span>
                  </button>
                  <button
                    onClick={() => handleTabChange("leaderboard")}
                    className="flex items-center justify-center gap-2 p-4 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
                  >
                    <BookOpen className="w-5 h-5 text-pink-600" />
                    <span className="font-medium text-pink-700">View Leaderboard</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentClassroomPage; 

