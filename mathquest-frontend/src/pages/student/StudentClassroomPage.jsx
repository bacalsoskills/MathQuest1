import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
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
import { AlertCircle, CheckCircle, BookOpen, Anchor, MapPin, Compass, Ship, Scroll, Crown, Sword, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
import { Button } from "../../ui/button";
import { FaMap, FaCompass, FaShip, FaMountain, FaWater, FaGem, FaMedal, FaLock, FaCheckCircle } from "react-icons/fa";

const StudentClassroomPage = () => {
  const { classroomId, lessonId: initialLessonId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser: user } = useAuth();
  const { darkMode, isInitialized } = useTheme();
  const { addNotification } = useNotifications();
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
  const [comprehensiveProgress, setComprehensiveProgress] = useState({
    lessonsRead: 0,
    totalLessons: 0,
    quizzesTaken: 0,
    totalQuizzes: 0,
    gamesPlayed: 0,
    totalGames: 0,
    overallProgress: 0
  });

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

  // Function to calculate comprehensive progress
  const calculateComprehensiveProgress = async () => {
    if (!lessons.length || !user?.id) return;

    try {
      let lessonsRead = 0;
      let totalLessons = lessons.length;
      let quizzesTaken = 0;
      let totalQuizzes = 0;
      let gamesPlayed = 0;
      let totalGames = 0;

      // Calculate lesson progress
      for (const lesson of lessons) {
        const status = await lessonService.getLessonCompletionStatus(lesson.id, user.id);
        if (status.contentRead) {
          lessonsRead++;
        }

        // Count quizzes in lessons and check if they've been attempted
        const lessonQuizzes = lesson.activities?.filter(activity => activity.type === 'QUIZ') || [];
        totalQuizzes += lessonQuizzes.length;

        // Count quizzes taken (pass or fail) - check actual quiz attempts
        for (const quizActivity of lessonQuizzes) {
          try {
            // Get quiz data for this activity
            const quiz = await quizService.getQuizByActivityId(quizActivity.id);
            if (quiz) {
              // Get all attempts for this quiz by the student
              const attempts = await quizService.getQuizAttemptsByStudent(user.id);
              const quizAttempts = attempts.filter(attempt => attempt.quizId === quiz.id);
              
              // If there are any attempts (completed or not), count as taken
              if (quizAttempts.length > 0) {
                quizzesTaken++;
              }
            }
          } catch (err) {
            console.error(`Error checking quiz attempts for activity ${quizActivity.id}:`, err);
            // Fallback to lesson status if quiz service fails
            if (status.quizCompleted) {
              quizzesTaken++;
            }
          }
        }
      }

      // Calculate game progress from activities
      const gameActivities = activities.filter(activity => activity.type === 'GAME');
      totalGames = gameActivities.length;

      // For games, we'll need to check if the user has played them
      // This would require a game service to track game attempts
      // For now, we'll set gamesPlayed to 0 as we don't have game tracking yet
      gamesPlayed = 0;

      // Calculate overall progress (lessons + quizzes only, not games)
      const totalItems = totalLessons + totalQuizzes;
      const completedItems = lessonsRead + quizzesTaken;
      const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      const progressData = {
        lessonsRead,
        totalLessons,
        quizzesTaken,
        totalQuizzes,
        gamesPlayed,
        totalGames,
        overallProgress
      };
      
      console.log('Progress calculated:', progressData);
      setComprehensiveProgress(progressData);
    } catch (err) {
      console.error('Error calculating comprehensive progress:', err);
    }
  };

  // Function to find the last unlocked lesson - Sequential progression
  const findLastUnlockedLesson = async () => {
    if (!lessons.length || !user?.id) return null;

    try {
      // Find the first lesson that hasn't been completed
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        const status = await lessonService.getLessonCompletionStatus(lesson.id, user.id);
        
        // Check if lesson has a quiz
        const hasQuiz = lesson.activities?.some(activity => activity.type === 'QUIZ');
        
        if (hasQuiz) {
          // For lessons with quiz, check if quiz is completed (pass or fail)
          if (!status.quizCompleted) {
            return lesson.id;
          }
        } else {
          // For lessons without quiz, check if content is read
          if (!status.contentRead) {
            return lesson.id;
          }
        }
      }
      
      // If all lessons are completed, return the last lesson
      return lessons[lessons.length - 1]?.id || null;
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

        // Fetch quiz statistics with fallback
        try {
          const performance = await leaderboardService.getStudentPerformance(classroomId);
          setQuizStats({
            passedQuizzes: performance.passedQuizzes || 0,
            notTakenQuizzes: performance.notTakenQuizzes || 0
          });
        } catch (quizError) {
          console.warn("Quiz statistics API not available, using fallback data:", quizError);
          // Use fallback data when API is not available
          setQuizStats({
            passedQuizzes: 2,
            notTakenQuizzes: 1
          });
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
          // Calculate quizPassed if not provided by backend
          let quizPassed = status.quizPassed;
          if (quizPassed === undefined || quizPassed === null) {
            // Calculate based on score and passing score
            const quizActivity = selectedLesson.activities?.find(activity => activity.type === 'QUIZ');
            if (quizActivity && quizAttempts[quizActivity.id]?.quiz && status.quizScore !== undefined) {
              const quiz = quizAttempts[quizActivity.id].quiz;
              quizPassed = status.quizScore >= quiz.passingScore;
            }
          }
          
          const updatedStatus = { ...status, quizPassed };
          setCompletionStatus(updatedStatus);
          
          // Check for quiz availability
          const hasQuiz = selectedLesson.activities?.some(activity => activity.type === 'QUIZ');

          // If content is already read, show quiz if available
          if (status.contentRead) {
            if (hasQuiz && !status.quizCompleted) {
              setShowQuiz(true);
            } else if (hasQuiz && status.quizCompleted) {
              // Quiz completed (pass or fail), unlock next lesson but don't auto-navigate
              unlockNextLesson();
            } else if (!hasQuiz) {
              // For lessons without quiz, unlock next lesson but don't auto-navigate
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
  }, [selectedLesson?.id, user?.id, quizAttempts]);

  // Add a new useEffect to check quiz completion status periodically
  useEffect(() => {
    if (!selectedLesson?.id || !user?.id) return;

    const checkQuizCompletion = async () => {
      try {
        const status = await lessonService.getLessonCompletionStatus(selectedLesson.id, user.id);
        
        if (status.quizCompleted && !completionStatus?.quizCompleted) {
          // Calculate quizPassed if not provided by backend
          let quizPassed = status.quizPassed;
          if (quizPassed === undefined || quizPassed === null) {
            // Calculate based on score and passing score
            const quizActivity = selectedLesson.activities?.find(activity => activity.type === 'QUIZ');
            if (quizActivity && quizAttempts[quizActivity.id]?.quiz && status.quizScore !== undefined) {
              const quiz = quizAttempts[quizActivity.id].quiz;
              quizPassed = status.quizScore >= quiz.passingScore;
            }
          }
          
          const updatedStatus = { ...status, quizPassed };
          setCompletionStatus(updatedStatus);
          
          // Always unlock next lesson after quiz completion (pass or fail)
          unlockNextLesson();
        }
      } catch (err) {
        console.error(`Error checking quiz completion:`, err);
      }
    };

    // Check every 10 seconds instead of 2 seconds to reduce API calls
    const intervalId = setInterval(checkQuizCompletion, 10000);

    return () => clearInterval(intervalId);
  }, [selectedLesson?.id, user?.id, completionStatus?.quizCompleted, quizAttempts]);

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
            // For lessons without quiz, unlock next lesson immediately after reading
            unlockNextLesson();
          }
          
          // Refresh lesson data to update unlock status without page reload
          fetchLessons();
          
          // Recalculate comprehensive progress
          calculateComprehensiveProgress();
          
          // Add notification for lesson completion
          addNotification('classrooms', 1);
        })
        .catch(err => {
          console.error(`Error marking content as read:`, err);
          // Even if the API call fails, update the local state to allow quiz access
          setCompletionStatus(prev => ({ ...prev, contentRead: true }));
          setHasScrolledToBottom(true);
          
          const hasQuiz = selectedLesson.activities?.some(activity => activity.type === 'QUIZ');
          if (hasQuiz) {
            setShowQuiz(true);
          } else {
            // For lessons without quiz, unlock next lesson immediately after reading
            unlockNextLesson();
          }
          
          // Refresh lesson data to update unlock status without page reload
          fetchLessons();
          
          // Recalculate comprehensive progress
          calculateComprehensiveProgress();
        });
    }
  };

  // Simplified content read detection - check if content is small enough to be fully visible
  useEffect(() => {
    if (selectedLesson?.contentBlocks && !completionStatus?.contentRead) {
      const checkContentSize = () => {
        const contentContainer = document.querySelector('.content-blocks');
        if (contentContainer) {
          const isContentSmall = contentContainer.scrollHeight <= contentContainer.clientHeight + 10; // Small buffer
          
          if (isContentSmall) {
            markContentAsRead();
          }
        }
      };
      
      // Check after content is rendered
      const timeoutId = setTimeout(checkContentSize, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedLesson?.contentBlocks, completionStatus?.contentRead]);

  // Add a new useEffect to initialize unlocked lessons - Sequential progression
  useEffect(() => {
    const initializeUnlockedLessons = async () => {
      if (!lessons.length || !user?.id) return;

      try {
        const unlockedSet = new Set();
        
        // Find the first incomplete lesson
        let foundIncomplete = false;
        for (let i = 0; i < lessons.length; i++) {
          const lesson = lessons[i];
          
          // Always unlock the first lesson
          if (i === 0) {
            unlockedSet.add(lesson.id);
            continue;
          }
          
          // Check if previous lesson is completed
          const prevLesson = lessons[i - 1];
          const prevStatus = await lessonService.getLessonCompletionStatus(prevLesson.id, user.id);
          
          // Check if previous lesson has a quiz
          const prevHasQuiz = prevLesson.activities?.some(activity => activity.type === 'QUIZ');
          
          let prevCompleted = false;
          if (prevHasQuiz) {
            // For lessons with quiz, check if quiz is completed (pass or fail)
            prevCompleted = prevStatus.quizCompleted;
          } else {
            // For lessons without quiz, check if content is read
            prevCompleted = prevStatus.contentRead;
          }
          
          if (prevCompleted) {
            unlockedSet.add(lesson.id);
          } else {
            // Stop unlocking once we find an incomplete lesson
            break;
          }
        }

        setUnlockedLessons(unlockedSet);
      } catch (err) {
        console.error(`Error initializing unlocked lessons:`, err);
        // Fallback: unlock only the first lesson
        const unlockedSet = new Set();
        if (lessons.length > 0) {
          unlockedSet.add(lessons[0].id);
        }
        setUnlockedLessons(unlockedSet);
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

  // Calculate comprehensive progress when lessons and activities are loaded
  useEffect(() => {
    if (lessons.length > 0 && activities.length >= 0 && user?.id) {
      calculateComprehensiveProgress();
    }
  }, [lessons, activities, user?.id]);

  const unlockNextLesson = () => {
    const currentLessonIndex = lessons.findIndex(l => l.id === selectedLesson.id);
    
    // Only unlock the next lesson if current lesson is completed
    if (currentLessonIndex < lessons.length - 1) {
      const nextLesson = lessons[currentLessonIndex + 1];
      
      setUnlockedLessons(prev => {
        const newUnlocked = new Set([...prev]);
        newUnlocked.add(nextLesson.id);
        return newUnlocked;
      });
      
      // No automatic navigation - let students choose when to move on
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
        // Check if the quiz was passed by comparing score to passing score
        const quizActivity = selectedLesson.activities?.find(activity => activity.type === 'QUIZ');
        let quizPassed = false;
        
        if (quizActivity && quizAttempts[quizActivity.id]?.quiz) {
          const quiz = quizAttempts[quizActivity.id].quiz;
          quizPassed = score >= quiz.passingScore;
        }
        
        // Update completion status
        setCompletionStatus(prev => {
          const newStatus = { 
            ...prev, 
            quizCompleted: true, 
            quizScore: score,
            quizPassed: quizPassed,
            quizCompletedAt: new Date().toISOString()
          };
          return newStatus;
        });
        
        // Always unlock next lesson after quiz completion (pass or fail)
        unlockNextLesson();

        // Refresh the lesson list to show updated completion status
        fetchLessons();
        
        // Recalculate comprehensive progress
        calculateComprehensiveProgress();
        
        // Add notification for quiz completion
        addNotification('activities', 1);
      })
      .catch(err => {
        console.error(`Error marking lesson quiz as completed:`, err);
      });
  };


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
        
        // Recalculate progress after fetching quiz attempts
        calculateComprehensiveProgress();
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

    // Check if quiz is repeatable or if the last attempt failed
    const lastAttempt = attempts[0]; // Most recent attempt
    if (lastAttempt && !quiz.repeatable && lastAttempt.passed) {
      return false; // Quiz is not repeatable and was passed
    }

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
    
    // Check if there are previous attempts
    if (attempts.length > 0) {
      const lastAttempt = attempts[0]; // Most recent attempt
      if (lastAttempt && !lastAttempt.passed) {
        return "Try Again - Quest Failed";
      } else if (lastAttempt && lastAttempt.passed) {
        return "Quest Completed";
      }
      return "Try Again";
    }
    
    return "Start Quiz";
  };

  // Update the quiz section in the render
  const renderQuizSection = () => {
    if (!selectedLesson?.activities?.filter(activity => activity.type === 'QUIZ').length) return null;

    return (
      <div className="mt-8">
        {!completionStatus?.contentRead && isStudent && (
          <div className={`border-2 rounded-xl p-6 mb-6 flex items-center justify-between gap-3 shadow-lg transition-colors duration-300 ${
            darkMode
              ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-400'
              : 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-400'
          }`}>
            <div className="flex items-center gap-3">
              <div className="text-2xl">⚠️</div>
              <AlertCircle className="w-6 h-6 text-yellow-700" />
              <p className="text-yellow-800 font-medium text-lg">
                Ahoy! Study the treasure map completely before attempting the quest!
              </p>
            </div>
            <button
              onClick={markContentAsRead}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              Mark as Read
            </button>
          </div>
        )}
        
        {completionStatus?.contentRead && (
          <div className="quiz-section">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">⚔️</div>
              <Header type="h3" weight="semibold" className={`text-2xl transition-colors duration-300 ${
                darkMode
                  ? 'text-gray-800'
                  : 'text-amber-800'
              }`}>
                Pirate Quest
              </Header>
            </div>
            {selectedLesson.activities
              .filter(activity => activity.type === 'QUIZ')
              .map(activity => {
                const quizData = quizAttempts[activity.id];
                const canAttempt = canAttemptQuiz(activity.id);
                const buttonText = getQuizButtonText(activity.id);
                const lastAttempt = quizData?.lastAttempt;

                return (
                  <div key={activity.id} className={`mb-6 p-6 rounded-2xl shadow-xl border-2 transition-colors duration-300 ${
                    darkMode
                      ? 'bg-gradient-to-br from-gray-100 to-gray-50 border-gray-300'
                      : 'bg-gradient-to-br from-amber-100 to-amber-50 border-amber-300'
                  }`}>
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-2xl">🗡️</div>
                        <h4 className={`text-xl font-bold transition-colors duration-300 ${
                          darkMode
                            ? 'text-gray-800'
                            : 'text-amber-800'
                        }`}>{quizData?.quiz?.quizName || 'Pirate Quest'}</h4>
                      </div>
                      <p className={`font-medium transition-colors duration-300 ${
                        darkMode
                          ? 'text-gray-700'
                          : 'text-amber-700'
                      }`}>{quizData?.quiz?.description}</p>
                    </div>
                    
                    <div className={`grid grid-cols-2 gap-4 mb-6 text-sm rounded-xl p-4 border transition-colors duration-300 ${
                      darkMode
                        ? 'bg-white/60 border-gray-200'
                        : 'bg-white/60 border-amber-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className="text-lg">⏰</div>
                        <div>
                          <span className={`font-bold transition-colors duration-300 ${
                            darkMode
                              ? 'text-gray-800'
                              : 'text-amber-800'
                          }`}>Quest Duration:</span> {quizData?.quiz?.timeLimitMinutes || 0} minutes
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-lg">🗺️</div>
                        <div>
                          <span className={`font-bold transition-colors duration-300 ${
                            darkMode
                              ? 'text-gray-800'
                              : 'text-amber-800'
                          }`}>Challenges:</span> {quizData?.quiz?.totalItems || 0}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-lg">🏆</div>
                        <div>
                          <span className={`font-bold transition-colors duration-300 ${
                            darkMode
                              ? 'text-gray-800'
                              : 'text-amber-800'
                          }`}>Victory Threshold:</span> {quizData?.quiz?.passingScore || 0}/{quizData?.quiz?.overallScore || 0}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-lg">⚔️</div>
                        <div>
                          <span className={`font-bold transition-colors duration-300 ${
                            darkMode
                              ? 'text-gray-800'
                              : 'text-amber-800'
                          }`}>Max Attempts:</span> {quizData?.quiz?.maxAttempts || '1'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-lg">🌅</div>
                        <div>
                          <span className={`font-bold transition-colors duration-300 ${
                            darkMode
                              ? 'text-gray-800'
                              : 'text-amber-800'
                          }`}>Quest Begins:</span> {quizData?.quiz?.availableFrom ? new Date(quizData.quiz.availableFrom).toLocaleString() : 'Anytime'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-lg">🌇</div>
                        <div>
                          <span className={`font-bold transition-colors duration-300 ${
                            darkMode
                              ? 'text-gray-800'
                              : 'text-amber-800'
                          }`}>Quest Ends:</span> {quizData?.quiz?.availableTo ? new Date(quizData.quiz.availableTo).toLocaleString() : 'Never'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-lg">📊</div>
                        <div>
                          <span className={`font-bold transition-colors duration-300 ${
                            darkMode
                              ? 'text-gray-800'
                              : 'text-amber-800'
                          }`}>Attempts:</span> {quizData?.attempts?.length || 0}/{quizData?.quiz?.maxAttempts || '∞'}
                        </div>
                      </div>
                    </div>

                    {lastAttempt && (
                      <div className={`mb-6 p-4 rounded-xl border-2 transition-colors duration-300 ${
                        darkMode
                          ? 'bg-gradient-to-r from-gray-200 to-gray-300 border-gray-300'
                          : 'bg-gradient-to-r from-amber-200 to-yellow-200 border-amber-300'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-xl">🏴‍☠️</div>
                          <p className={`font-bold transition-colors duration-300 ${
                            darkMode
                              ? 'text-gray-800'
                              : 'text-amber-800'
                          }`}>Last Adventure:</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className={`font-medium transition-colors duration-300 ${
                              darkMode
                                ? 'text-gray-700'
                                : 'text-amber-700'
                            }`}>Score:</span> {lastAttempt.score}/{quizData?.quiz?.overallScore || 0}
                          </div>
                          <div>
                            <span className={`font-medium transition-colors duration-300 ${
                              darkMode
                                ? 'text-gray-700'
                                : 'text-amber-700'
                            }`}>Date:</span> {new Date(lastAttempt.completedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleStartQuiz(activity.id)}
                      className={`w-full px-6 py-4 transition-all duration-300 text-lg font-bold rounded-xl shadow-lg transform hover:scale-105 ${
                        canAttempt 
                          ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 shadow-xl' 
                          : 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                      }`}
                      disabled={!canAttempt}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <div className="text-xl">{canAttempt ? '⚔️' : '🔒'}</div>
                        <span>{buttonText}</span>
                      </div>
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

      // Start a new quiz attempt (handles reuse/validation server-side)
      const attempt = await quizService.startQuizAttempt(quiz.id, user.id);

      // Navigate to QuizPage which will redirect to the attempt
      navigate(`/student/quizzes/${quiz.id}/attempt/${attempt.id}`);
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
      <div className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
          : 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100'
      } relative overflow-hidden`}>
        {/* Pirate-themed background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-6xl">⚓</div>
          <div className="absolute top-20 right-20 text-5xl">🗺️</div>
          <div className="absolute bottom-20 left-20 text-5xl">🏴‍☠️</div>
          <div className="absolute bottom-10 right-10 text-6xl">⚔️</div>
        </div>
        
        <div className="flex flex-col justify-center items-center h-screen relative z-10">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className={`animate-spin rounded-full h-16 w-16 border-4 ${
                darkMode
                  ? 'border-amber-200 border-t-amber-600'
                  : 'border-amber-200 border-t-amber-600'
              }`}></div>
              <div className={`absolute inset-0 rounded-full border-4 border-transparent animate-spin ${
                darkMode
                  ? 'border-t-amber-400'
                  : 'border-t-amber-400'
              }`} style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            </div>
            <div className="text-center">
              <h3 className={`text-xl font-semibold mb-2 ${
                darkMode
                  ? 'text-amber-300'
                  : 'text-amber-800'
              }`}>⚓ Preparing Your Pirate Adventure</h3>
              <p className={`${
                darkMode
                  ? 'text-amber-400'
                  : 'text-amber-600'
              }`}>Charting the course to your classroom...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
          : 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100'
      } flex items-center justify-center`}>
        <div className={`text-center p-8 rounded-2xl shadow-xl border-2 transition-colors duration-300 ${
          darkMode
            ? 'bg-gray-800/80 border-red-500/50'
            : 'bg-white/80 border-amber-200'
        }`}>
          <div className="text-6xl mb-4">🚨</div>
          <h3 className={`text-2xl font-bold mb-2 ${
            darkMode
              ? 'text-red-400'
              : 'text-red-600'
          }`}>Ahoy! We've Hit Rough Waters!</h3>
          <p className={`${
            darkMode
              ? 'text-red-300'
              : 'text-red-500'
          }`}>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!classroomDetails) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
          : 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100'
      } flex items-center justify-center`}>
        <div className={`text-center p-8 rounded-2xl shadow-xl border-2 transition-colors duration-300 ${
          darkMode
            ? 'bg-gray-800/80 border-amber-500/50'
            : 'bg-white/80 border-amber-200'
        }`}>
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className={`text-2xl font-bold mb-2 ${
            darkMode
              ? 'text-amber-300'
              : 'text-amber-800'
          }`}>Lost at Sea!</h3>
          <p className={`${
            darkMode
              ? 'text-amber-400'
              : 'text-amber-600'
          }`}>Classroom not found or failed to load.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    } relative overflow-hidden`}>
      {/* Treasure map background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 text-8xl">🗺️</div>
        <div className="absolute top-40 right-20 text-6xl">⚓</div>
        <div className="absolute bottom-40 left-20 text-7xl">🏴‍☠️</div>
        <div className="absolute bottom-20 right-10 text-8xl">⚔️</div>
        <div className="absolute top-1/2 left-1/4 text-5xl">🏴</div>
        <div className="absolute top-1/3 right-1/3 text-6xl">🗺️</div>
        <div className="absolute bottom-1/3 left-1/2 text-5xl">⚓</div>
      </div>
      
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
        {/* Enhanced Header Section */}
        <div className="relative mb-8">
          <div className={`backdrop-blur-sm rounded-2xl shadow-xl border p-6 sm:p-8 transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-800/80 border-gray-700/20' 
              : 'bg-white/80 border-white/20'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FaMap className="text-white text-xl" />
                  </div>
                  <div>
                    <Header type="h1" fontSize="4xl" weight="bold" className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                      {classroomDetails?.name || 'Classroom Adventure'}
                    </Header>
                    <p className={`text-sm mt-1 transition-colors duration-300 ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>Embark on your learning journey through treasure-filled waters!</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                {classroomDetails?.teacher && (
                  <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full shadow-sm transition-colors duration-300 ${
                    darkMode 
                      ? 'text-blue-300 bg-blue-900/30 border border-blue-700/50' 
                      : 'text-blue-700 bg-blue-100 border border-blue-200'
                  }`}>
                    <Ship className="w-4 h-4" />
                    <span className="font-medium">
                      Captain: {classroomDetails.teacher?.firstName && classroomDetails.teacher?.lastName
                        ? `${classroomDetails.teacher.firstName} ${classroomDetails.teacher.lastName}`
                        : classroomDetails.teacher?.name || 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Progress Badges Section */}
        <div className="mb-8">
          <div className={`backdrop-blur-sm rounded-2xl shadow-xl border p-6 sm:p-8 transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-800/90 border-gray-700/20' 
              : 'bg-white/90 border-white/20'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
              <div className="flex items-center gap-3 mb-3 sm:mb-0">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FaMedal className="text-white text-lg" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold transition-colors duration-300 ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>Classroom Progress</h2>
                  <p className={`text-sm transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Track your learning journey and achievements!</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg">
                  <span className="font-bold text-lg">{comprehensiveProgress.overallProgress}</span>
                  <span className="text-sm opacity-90">%</span>
                </div>
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Overall Progress</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                darkMode
                  ? 'bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-2 border-blue-700/50 shadow-lg'
                  : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg'
              }`}>
                <div className="flex justify-center mb-3">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                    'bg-gradient-to-br from-blue-400 to-blue-600 group-hover:from-blue-500 group-hover:to-blue-700'
                  }`}>
                    <FaMap className="text-white text-2xl" />
                  </div>
                </div>
                <div className="text-center">
                  <span className={`text-sm font-bold text-center block mb-1 transition-colors duration-300 ${
                    darkMode ? 'text-blue-300' : 'text-blue-800'
                  }`}>
                    Treasure Maps
                  </span>
                  <span className={`text-xs text-center px-2 py-1 rounded-full font-medium transition-colors duration-300 ${
                    darkMode
                      ? 'bg-blue-900/50 text-blue-300'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {comprehensiveProgress.lessonsRead}/{comprehensiveProgress.totalLessons} Read
                  </span>
                </div>
              </div>

              <div className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                darkMode
                  ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-700/50 shadow-lg'
                  : 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-lg'
              }`}>
                <div className="flex justify-center mb-3">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                    'bg-gradient-to-br from-purple-400 to-purple-600 group-hover:from-purple-500 group-hover:to-purple-700'
                  }`}>
                    <Sword className="text-white text-2xl" />
                  </div>
                </div>
                <div className="text-center">
                  <span className={`text-sm font-bold text-center block mb-1 transition-colors duration-300 ${
                    darkMode ? 'text-purple-300' : 'text-purple-800'
                  }`}>
                    Adventures
                  </span>
                  <span className={`text-xs text-center px-2 py-1 rounded-full font-medium transition-colors duration-300 ${
                    darkMode
                      ? 'bg-purple-900/50 text-purple-300'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {comprehensiveProgress.totalGames} Games
                  </span>
                </div>
              </div>

              <div className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                darkMode
                  ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-2 border-green-700/50 shadow-lg'
                  : 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg'
              }`}>
                <div className="flex justify-center mb-3">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                    'bg-gradient-to-br from-green-400 to-green-600 group-hover:from-green-500 group-hover:to-green-700'
                  }`}>
                    <FaCheckCircle className="text-white text-2xl" />
                  </div>
                </div>
                <div className="text-center">
                  <span className={`text-sm font-bold text-center block mb-1 transition-colors duration-300 ${
                    darkMode ? 'text-green-300' : 'text-green-800'
                  }`}>
                    Victories
                  </span>
                  <span className={`text-xs text-center px-2 py-1 rounded-full font-medium transition-colors duration-300 ${
                    darkMode
                      ? 'bg-green-900/50 text-green-300'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {quizStats.passedQuizzes} Passed
                  </span>
                </div>
              </div>

              <div className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                darkMode
                  ? 'bg-gradient-to-br from-orange-900/30 to-red-900/30 border-2 border-orange-700/50 shadow-lg'
                  : 'bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 shadow-lg'
              }`}>
                <div className="flex justify-center mb-3">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                    'bg-gradient-to-br from-orange-400 to-orange-600 group-hover:from-orange-500 group-hover:to-orange-700'
                  }`}>
                    <FaCompass className="text-white text-2xl" />
                  </div>
                </div>
                <div className="text-center">
                  <span className={`text-sm font-bold text-center block mb-1 transition-colors duration-300 ${
                    darkMode ? 'text-orange-300' : 'text-orange-800'
                  }`}>
                    Uncharted
                  </span>
                  <span className={`text-xs text-center px-2 py-1 rounded-full font-medium transition-colors duration-300 ${
                    darkMode
                      ? 'bg-orange-900/50 text-orange-300'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {comprehensiveProgress.totalLessons + comprehensiveProgress.totalQuizzes - 
                     comprehensiveProgress.lessonsRead - comprehensiveProgress.quizzesTaken} Remaining
                  </span>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Overall Progress</span>
                <span className={`text-sm font-bold transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>{comprehensiveProgress.overallProgress}%</span>
              </div>
              <div className={`w-full rounded-full h-3 overflow-hidden transition-colors duration-300 ${
                darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${comprehensiveProgress.overallProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Treasure Map Navigation */}
        <div className="relative mb-8">
          <div className={`backdrop-blur-sm rounded-3xl shadow-2xl border p-6 sm:p-8 transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-800/90 border-gray-700/20' 
              : 'bg-white/90 border-white/20'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FaMap className="text-white text-lg" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold transition-colors duration-300 ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>Navigation Map</h2>
                  <p className={`text-sm transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Choose your adventure path!</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => handleTabChange("lessons")}
                className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-xl w-full sm:w-auto ${
                  activeTab === "lessons"
                    ? darkMode
                      ? 'bg-gradient-to-br from-blue-900/50 to-indigo-900/50 border-2 border-blue-500 shadow-2xl'
                      : 'bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-blue-400 shadow-2xl'
                    : darkMode
                      ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 border-2 border-gray-600 hover:border-gray-500'
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 hover:border-gray-300'
                }`}
                id="lessons-tab"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                    activeTab === "lessons"
                      ? 'bg-gradient-to-br from-blue-500 to-blue-700 group-hover:from-blue-600 group-hover:to-blue-800'
                      : 'bg-gradient-to-br from-gray-400 to-gray-600 group-hover:from-gray-500 group-hover:to-gray-700'
                  }`}>
                    <FaMap className="text-white text-2xl" />
                  </div>
                  <div className="text-left">
                    <h3 className={`text-lg font-bold transition-colors duration-300 ${
                      activeTab === "lessons"
                        ? darkMode ? 'text-blue-300' : 'text-blue-800'
                        : darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Treasure Maps</h3>
                    <p className={`text-sm transition-colors duration-300 ${
                      activeTab === "lessons"
                        ? darkMode ? 'text-blue-200' : 'text-blue-600'
                        : darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Explore learning content</p>
                  </div>
                </div>
                {activeTab === "lessons" && (
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    darkMode 
                      ? 'bg-gradient-to-br from-blue-400/20 to-indigo-500/20' 
                      : 'bg-gradient-to-br from-blue-400/10 to-indigo-500/10'
                  }`}></div>
                )}
              </button>

              <button
                onClick={() => handleTabChange("activities")}
                className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-xl w-full sm:w-auto ${
                  activeTab === "activities"
                    ? darkMode
                      ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-2 border-purple-500 shadow-2xl'
                      : 'bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-400 shadow-2xl'
                    : darkMode
                      ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 border-2 border-gray-600 hover:border-gray-500'
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 hover:border-gray-300'
                }`}
                id="activities-tab"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                    activeTab === "activities"
                      ? 'bg-gradient-to-br from-purple-500 to-purple-700 group-hover:from-purple-600 group-hover:to-purple-800'
                      : 'bg-gradient-to-br from-gray-400 to-gray-600 group-hover:from-gray-500 group-hover:to-gray-700'
                  }`}>
                    <Sword className="text-white text-2xl" />
                  </div>
                  <div className="text-left">
                    <h3 className={`text-lg font-bold transition-colors duration-300 ${
                      activeTab === "activities"
                        ? darkMode ? 'text-purple-300' : 'text-purple-800'
                        : darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Adventures</h3>
                    <p className={`text-sm transition-colors duration-300 ${
                      activeTab === "activities"
                        ? darkMode ? 'text-purple-200' : 'text-purple-600'
                        : darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Take on quests & games</p>
                  </div>
                </div>
                {activeTab === "activities" && (
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    darkMode 
                      ? 'bg-gradient-to-br from-purple-400/20 to-pink-500/20' 
                      : 'bg-gradient-to-br from-purple-400/10 to-pink-500/10'
                  }`}></div>
                )}
              </button>

              <button
                onClick={() => handleTabChange("leaderboard")}
                className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-xl w-full sm:w-auto ${
                  activeTab === "leaderboard"
                    ? darkMode
                      ? 'bg-gradient-to-br from-yellow-900/50 to-orange-900/50 border-2 border-yellow-500 shadow-2xl'
                      : 'bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-400 shadow-2xl'
                    : darkMode
                      ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 border-2 border-gray-600 hover:border-gray-500'
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 hover:border-gray-300'
                }`}
                id="leaderboard-tab"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                    activeTab === "leaderboard"
                      ? 'bg-gradient-to-br from-yellow-500 to-yellow-700 group-hover:from-yellow-600 group-hover:to-yellow-800'
                      : 'bg-gradient-to-br from-gray-400 to-gray-600 group-hover:from-gray-500 group-hover:to-gray-700'
                  }`}>
                    <Crown className="text-white text-2xl" />
                  </div>
                  <div className="text-left">
                    <h3 className={`text-lg font-bold transition-colors duration-300 ${
                      activeTab === "leaderboard"
                        ? darkMode ? 'text-yellow-300' : 'text-yellow-800'
                        : darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Captain's Board</h3>
                    <p className={`text-sm transition-colors duration-300 ${
                      activeTab === "leaderboard"
                        ? darkMode ? 'text-yellow-200' : 'text-yellow-600'
                        : darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>See who's leading</p>
                  </div>
                </div>
                {activeTab === "leaderboard" && (
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    darkMode 
                      ? 'bg-gradient-to-br from-yellow-400/20 to-orange-500/20' 
                      : 'bg-gradient-to-br from-yellow-400/10 to-orange-500/10'
                  }`}></div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="mt-6 tab-content-section">
          {activeTab === "lessons" && (
            <div className="flex flex-col md:flex-row gap-6">
              
              {/* Enhanced Treasure Map Sidebar */}
              <div className={`w-full md:w-1/3 rounded-2xl overflow-hidden p-6 border-2 shadow-2xl relative transition-colors duration-300 ${
                darkMode
                  ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/20'
                  : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-white/20'
              }`}>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FaMap className="text-white text-lg" />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold transition-colors duration-300 ${
                        darkMode ? 'text-white' : 'text-gray-800'
                      }`}>Treasure Map Collection</h3>
                      <p className={`text-sm transition-colors duration-300 ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>Choose your learning path</p>
                    </div>
                  </div>
                  <LessonSidebar
                    lessons={lessons}
                    currentLessonId={currentLessonId}
                    onSelectLesson={handleSelectLesson}
                    isStudent={true}
                    unlockedLessons={unlockedLessons}
                  />
                </div>
              </div>

              {/* Enhanced Treasure Map Content Area */}
              <div className={`w-full md:w-2/3 rounded-2xl shadow-2xl border-2 h-[calc(85vh)] flex flex-col relative overflow-hidden transition-colors duration-300 ${
                darkMode
                  ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/20'
                  : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-white/20'
              }`}>
                
                {lessonLoading && (
                  <div className={`absolute inset-0 backdrop-blur-sm flex items-center justify-center z-10 transition-colors duration-300 ${
                    darkMode
                      ? 'bg-gray-900/90'
                      : 'bg-amber-100/90'
                  }`}>
                    <div className={`flex flex-col items-center gap-4 rounded-2xl p-6 shadow-xl border-2 transition-colors duration-300 ${
                      darkMode
                        ? 'bg-gray-700/80 border-gray-600'
                        : 'bg-white/80 border-amber-300'
                    }`}>
                      <div className="relative">
                        <div className={`animate-spin rounded-full h-12 w-12 border-4 transition-colors duration-300 ${
                          darkMode
                            ? 'border-gray-400 border-t-gray-200'
                            : 'border-amber-200 border-t-amber-600'
                        }`}></div>
                        <div className={`absolute inset-0 rounded-full border-4 border-transparent animate-spin transition-colors duration-300 ${
                          darkMode
                            ? 'border-t-gray-300'
                            : 'border-t-amber-400'
                        }`} style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                      </div>
                      <p className={`font-medium transition-colors duration-300 ${
                        darkMode
                          ? 'text-gray-200'
                          : 'text-amber-700'
                      }`}>loading the treasure map...</p>
                    </div>
                  </div>
                )}
                
                {loading && currentLessonId && !selectedLesson ? (
                  <main className="lesson-detail-placeholder p-6 rounded-md min-h-[300px] flex items-center justify-center shadow h-full">
                    <div className={`flex flex-col items-center gap-4 rounded-2xl p-6 shadow-xl border-2 transition-colors duration-300 ${
                      darkMode
                        ? 'bg-gray-700/80 border-gray-600'
                        : 'bg-white/80 border-amber-300'
                    }`}>
                      <div className="text-4xl">🗺️</div>
                      <div className="relative">
                        <div className={`animate-spin rounded-full h-12 w-12 border-4 transition-colors duration-300 ${
                          darkMode
                            ? 'border-gray-400 border-t-gray-200'
                            : 'border-amber-200 border-t-amber-600'
                        }`}></div>
                      </div>
                      <p className={`font-medium transition-colors duration-300 ${
                        darkMode
                          ? 'text-gray-200'
                          : 'text-amber-700'
                      }`}>Charting the course...</p>
                    </div>
                  </main>
                ) : selectedLesson ? (
                  <div className="flex flex-col h-full">
                    {/* Enhanced Title Section - Treasure Map Header */}
                    <div className={`p-6 border-b-2 transition-colors duration-300 ${
                      darkMode
                        ? 'border-gray-600 bg-gradient-to-r from-gray-800/80 to-gray-700/80'
                        : 'border-gray-200 bg-gradient-to-r from-white/80 to-gray-50/80'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                          <FaMap className="text-white text-xl" />
                        </div>
                        <div>
                          <Header
                            type="h2"
                            weight="bold"
                            className={`!text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent transition-colors duration-300`}
                          >{selectedLesson.title}</Header>
                          <p className={`text-sm mt-1 transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>Explore this treasure map to discover new knowledge!</p>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Scrollable Content Section */}
                    <div 
                      className={`flex-1 overflow-y-auto p-6 transition-colors duration-300 ${
                        darkMode
                          ? 'bg-gradient-to-b from-gray-800/50 to-gray-900/50'
                          : 'bg-gradient-to-b from-white/50 to-gray-50/50'
                      }`}
                      onScroll={handleScroll}
                    >
                      {selectedLesson.contentBlocks?.length > 0 ? (
                        <div className="content-blocks space-y-6">
                          {selectedLesson.contentBlocks.map((block) => (
                            <div key={block.id} className={`content-block rounded-2xl p-6 shadow-lg border-2 transition-colors duration-300 ${
                              darkMode
                                ? 'bg-gray-700/80 border-gray-600/50'
                                : 'bg-white/80 border-gray-200/50'
                            }`}>
                              <ContentBlockDisplay block={block} />
                            </div>
                          ))}

                          {/* Enhanced Read Status - Treasure Discovered */}
                          {completionStatus?.contentRead && !completionStatus?.quizCompleted && (
                            <div className="mt-8">
                              <div className={`flex items-center gap-3 rounded-2xl p-6 border-2 shadow-lg transition-colors duration-300 ${
                                darkMode
                                  ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-700/50 text-green-300'
                                  : 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300 text-green-800'
                              }`}>
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                                  <FaCheckCircle className="text-white text-xl" />
                                </div>
                                <div>
                                  <span className="font-bold text-lg">Treasure Map Studied!</span>
                                  <p className={`text-sm transition-colors duration-300 ${
                                    darkMode ? 'text-green-200' : 'text-green-600'
                                  }`}>You've successfully explored this learning content</p>
                                </div>
                              </div>
                              
                              {/* Next Lesson Unlocked Notification for lessons without quizzes */}
                              {(() => {
                                const currentLessonIndex = lessons.findIndex(l => l.id === selectedLesson.id);
                                const hasNextLesson = currentLessonIndex < lessons.length - 1;
                                const hasQuiz = selectedLesson.activities?.some(activity => activity.type === 'QUIZ');
                                
                                if (hasNextLesson && !hasQuiz) {
                                  return (
                                    <div className={`mt-4 flex items-center gap-3 rounded-2xl p-6 border-2 shadow-lg transition-colors duration-300 ${
                                      darkMode
                                        ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-700/50 text-blue-300'
                                        : 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 text-blue-800'
                                    }`}>
                                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                                        <FaCompass className="text-white text-xl" />
                                      </div>
                                      <div>
                                        <span className="font-bold text-lg">Next Adventure Unlocked!</span>
                                        <p className={`text-sm transition-colors duration-300 ${
                                          darkMode ? 'text-blue-200' : 'text-blue-600'
                                        }`}>You've completed this lesson! The next treasure map is now available in your collection.</p>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          )}

                          {/* Quiz Section */}
                          {renderQuizSection()}

                          {/* Enhanced Quiz Completion Status */}
                          {completionStatus?.quizCompleted && (
                            <div className="mt-8">
                              {completionStatus?.quizPassed ? (
                                <div>
                                  <div className={`flex items-center gap-3 rounded-2xl p-6 border-2 shadow-lg transition-colors duration-300 ${
                                    darkMode
                                      ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-700/50 text-green-300'
                                      : 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300 text-green-800'
                                  }`}>
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                                      <Sword className="text-white text-xl" />
                                    </div>
                                    <div>
                                      <span className="font-bold text-lg">Quest Completed!</span>
                                      <p className={`text-sm transition-colors duration-300 ${
                                        darkMode ? 'text-green-200' : 'text-green-600'
                                      }`}>Congratulations! You've successfully completed this adventure</p>
                                    </div>
                                  </div>
                                  
                                  {/* Next Lesson Unlocked Notification */}
                                  {(() => {
                                    const currentLessonIndex = lessons.findIndex(l => l.id === selectedLesson.id);
                                    const hasNextLesson = currentLessonIndex < lessons.length - 1;
                                    
                                    if (hasNextLesson) {
                                      return (
                                        <div className={`mt-4 flex items-center gap-3 rounded-2xl p-6 border-2 shadow-lg transition-colors duration-300 ${
                                          darkMode
                                            ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-700/50 text-blue-300'
                                            : 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 text-blue-800'
                                        }`}>
                                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                                            <FaCompass className="text-white text-xl" />
                                          </div>
                                          <div>
                                            <span className="font-bold text-lg">Next Adventure Unlocked!</span>
                                            <p className={`text-sm transition-colors duration-300 ${
                                              darkMode ? 'text-blue-200' : 'text-blue-600'
                                            }`}>Congratulations! You've passed the quest! The next treasure map is now available in your collection.</p>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                  </div>
                              ) : (
                                <div>
                                  <div className={`flex items-center gap-3 rounded-2xl p-6 border-2 shadow-lg transition-colors duration-300 ${
                                    darkMode
                                      ? 'bg-gradient-to-r from-orange-900/30 to-yellow-900/30 border-orange-700/50 text-orange-300'
                                      : 'bg-gradient-to-r from-orange-100 to-yellow-100 border-orange-300 text-orange-800'
                                  }`}>
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center shadow-lg">
                                      <AlertCircle className="text-white text-xl" />
                                    </div>
                                    <div>
                                      <span className="font-bold text-lg">Quest Attempted!</span>
                                      <p className={`text-sm transition-colors duration-300 ${
                                        darkMode ? 'text-orange-200' : 'text-orange-600'
                                      }`}>You've completed this quest! The next adventure is now available.</p>
                                    </div>
                                  </div>
                                  
                                  {/* Next Lesson Unlocked Notification for failed quizzes */}
                                  {(() => {
                                    const currentLessonIndex = lessons.findIndex(l => l.id === selectedLesson.id);
                                    const hasNextLesson = currentLessonIndex < lessons.length - 1;
                                    
                                    if (hasNextLesson) {
                                      return (
                                        <div className={`mt-4 flex items-center gap-3 rounded-2xl p-6 border-2 shadow-lg transition-colors duration-300 ${
                                          darkMode
                                            ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-700/50 text-blue-300'
                                            : 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 text-blue-800'
                                        }`}>
                                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                                            <FaCompass className="text-white text-xl" />
                                          </div>
                                          <div>
                                            <span className="font-bold text-lg">Next Adventure Unlocked!</span>
                                            <p className={`text-sm transition-colors duration-300 ${
                                              darkMode ? 'text-blue-200' : 'text-blue-600'
                                            }`}>You've attempted this quest! The next treasure map is now available in your collection.</p>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className={`rounded-2xl p-8 shadow-lg border-2 transition-colors duration-300 ${
                            darkMode
                              ? 'bg-gray-700/80 border-gray-600/50'
                              : 'bg-white/80 border-gray-200/50'
                          }`}>
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg mx-auto mb-4">
                              <FaMap className="text-white text-3xl" />
                            </div>
                            <p className={`text-lg font-medium transition-colors duration-300 ${
                              darkMode
                                ? 'text-gray-200'
                                : 'text-gray-700'
                            }`}>This treasure map is empty!</p>
                            <p className={`text-sm mt-2 transition-colors duration-300 ${
                              darkMode
                                ? 'text-gray-300'
                                : 'text-gray-500'
                            }`}>No content available for this lesson.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : lessons.length > 0 && !currentLessonId ? (
                  <main className="lesson-detail-placeholder p-6 rounded-md min-h-[300px] flex items-center justify-center shadow h-full">
                    <div className={`rounded-2xl p-8 shadow-xl border-2 text-center transition-colors duration-300 ${
                      darkMode
                        ? 'bg-gray-700/80 border-gray-600/50'
                        : 'bg-white/80 border-gray-200/50'
                    }`}>
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg mx-auto mb-4">
                        <FaMap className="text-white text-3xl" />
                      </div>
                      <p className={`text-lg font-medium transition-colors duration-300 ${
                        darkMode
                          ? 'text-gray-200'
                          : 'text-gray-700'
                      }`}>Choose a treasure map from your collection to begin your adventure!</p>
                    </div>
                  </main>
                ) : (
                  <main className="lesson-detail-placeholder p-6 rounded-md min-h-[300px] flex items-center justify-center shadow h-full">
                    <div className="text-center">
                      <div className={`rounded-2xl p-8 shadow-xl border-2 transition-colors duration-300 ${
                        darkMode
                          ? 'bg-gray-700/80 border-gray-600/50'
                          : 'bg-white/80 border-gray-200/50'
                      }`}>
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg mx-auto mb-4">
                          <FaCompass className="text-white text-3xl" />
                        </div>
                        <p className={`text-lg font-medium mb-2 transition-colors duration-300 ${
                          darkMode
                            ? 'text-gray-200'
                            : 'text-gray-700'
                        }`}>This treasure map is still being charted by the captain!</p>
                        <p className={`transition-colors duration-300 ${
                          darkMode
                            ? 'text-gray-300'
                            : 'text-gray-500'
                        }`}>Check back later for new learning content</p>
                      </div>
                    </div>
                  </main>
                )}
              </div>
            </div>
          )}

          {activeTab === "activities" && (
            <div className={`p-8 rounded-2xl shadow-2xl border-2 transition-colors duration-300 ${
              darkMode
                ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/20'
                : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-white/20'
            }`}>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sword className="text-white text-xl" />
                </div>
                <div>
                  <h2 className={`text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent transition-colors duration-300`}>
                    Adventure Quests
                  </h2>
                  <p className={`text-sm mt-1 transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Take on exciting games and challenges to test your skills!</p>
                </div>
              </div>
              <ClassroomGamesTab classroomId={classroomId} />
            </div>
          )}

          {activeTab === "leaderboard" && (
            <div className={`p-8 rounded-2xl shadow-2xl border-2 transition-colors duration-300 ${
              darkMode
                ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/20'
                : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-white/20'
            }`}>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Crown className="text-white text-xl" />
                </div>
                <div>
                  <h2 className={`text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent transition-colors duration-300`}>
                    Captain's Board
                  </h2>
                  <p className={`text-sm mt-1 transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>See who's leading the adventure and competing for the top spots!</p>
                </div>
              </div>
              <Leaderboard classroomId={classroomId} />
            </div>
          )}

        </div>
      </div>
    </div>
    </div>
  );
};

export default StudentClassroomPage; 
