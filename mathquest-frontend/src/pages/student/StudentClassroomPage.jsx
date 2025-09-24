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
import { AlertCircle, CheckCircle, BookOpen, Anchor, MapPin, Compass, Ship, Scroll, Crown, Sword, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import QuizDisplay from "../../components/quiz/QuizDisplay";
import { Button } from "../../ui/button";

const StudentClassroomPage = () => {
  const { classroomId, lessonId: initialLessonId } = useParams();
  const location = useLocation();
  const { currentUser: user } = useAuth();
  const { darkMode, isInitialized } = useTheme();
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
          <div className={`border-2 rounded-xl p-6 mb-6 flex items-center gap-3 shadow-lg transition-colors duration-300 ${
            darkMode
              ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-400'
              : 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-400'
          }`}>
            <div className="text-2xl">⚠️</div>
            <AlertCircle className="w-6 h-6 text-yellow-700" />
            <p className="text-yellow-800 font-medium text-lg">
              Ahoy! Study the treasure map completely before attempting the quest!
            </p>
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
        : 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100'
    } relative overflow-hidden`}>
      {/* Pirate-themed background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 text-8xl">⚓</div>
        <div className="absolute top-40 right-20 text-6xl">🗺️</div>
        <div className="absolute bottom-40 left-20 text-7xl">🏴‍☠️</div>
        <div className="absolute bottom-20 right-10 text-8xl">⚔️</div>
        <div className="absolute top-1/2 left-1/4 text-5xl">🏴</div>
        <div className="absolute top-1/3 right-1/3 text-6xl">⚓</div>
        <div className="absolute bottom-1/3 left-1/2 text-5xl">🗺️</div>
      </div>
      
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
        {/* Pirate Ship Deck Header */}
        <div className={`classroom-header transition-colors duration-300 ${
          darkMode
            ? 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border-gray-600'
            : 'bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 border-amber-600'
        } rounded-3xl shadow-2xl border-4 mb-8 overflow-hidden relative`}>
          {/* Ship deck wood texture overlay */}
          <div className={`absolute inset-0 transition-colors duration-300 ${
            darkMode
              ? 'bg-gradient-to-b from-gray-900/20 to-transparent'
              : 'bg-gradient-to-b from-amber-900/20 to-transparent'
          }`}></div>
          <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23d97706\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M0 30h60v30H0z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}}></div>
          
          <div className="flex flex-col md:flex-row md:space-x-8 h-full md:h-auto relative z-10">
            {/* Left - Ship Figurehead */}
            <div className="w-full md:w-1/3 h-full">
              <div className={`h-full transition-colors duration-300 ${
                darkMode
                  ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-600'
                  : 'bg-gradient-to-br from-amber-900 to-amber-800 border-amber-600'
              } rounded-tl-3xl rounded-bl-3xl overflow-hidden mb-5 md:mb-0 border-r-4 relative`}>
                {/* Ship wheel decoration */}
                <div className="absolute top-4 right-4 text-3xl opacity-60">⚓</div>
                {classroomDetails.image ? (
                  <div className="relative">
                    <img
                      src={`data:image/jpeg;base64,${classroomDetails.image}`}
                      alt={classroomDetails.name}
                      className="w-full h-[280px] object-cover"
                    />
                    <div className={`absolute inset-0 transition-colors duration-300 ${
                      darkMode
                        ? 'bg-gradient-to-t from-gray-900/50 to-transparent'
                        : 'bg-gradient-to-t from-amber-900/50 to-transparent'
                    }`}></div>
                  </div>
                ) : (
                  <div className={`w-full h-[280px] flex flex-col items-center justify-center transition-colors duration-300 ${
                    darkMode
                      ? 'bg-gradient-to-br from-gray-800 to-gray-900'
                      : 'bg-gradient-to-br from-amber-800 to-amber-900'
                  } relative`}>
                    <div className="text-6xl mb-2">🏴‍☠️</div>
                    <span className={`text-2xl font-bold transition-colors duration-300 ${
                      darkMode
                        ? 'text-gray-100'
                        : 'text-amber-100'
                    }`}>
                      {classroomDetails.shortCode}
                    </span>
                  </div>
                )}
                {/* Decorative rope */}
                <div className={`absolute bottom-0 left-0 right-0 h-2 transition-colors duration-300 ${
                  darkMode
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700'
                    : 'bg-gradient-to-r from-amber-600 to-amber-700'
                }`}></div>
              </div>
            </div>

            {/* Right - Ship Captain's Log */}
            <div className="w-full md:w-2/3 flex flex-col md:pl-6 md:pr-6 py-6 h-full">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-2xl">🏴‍☠️</div>
                    <div className={`text-sm font-bold px-3 py-1 rounded-full transition-colors duration-300 ${
                      darkMode
                        ? 'text-gray-200 bg-gray-900/50'
                        : 'text-amber-200 bg-amber-900/50'
                    }`}>
                      {classroomDetails.shortCode}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Crown className={`w-8 h-8 transition-colors duration-300 ${
                      darkMode
                        ? 'text-gray-300'
                        : 'text-amber-300'
                    }`} />
                    <Header type="h1" fontSize="3xl" weight="bold" className={`drop-shadow-lg transition-colors duration-300 ${
                      darkMode
                        ? 'text-gray-100'
                        : 'text-amber-100'
                    }`}>
                      {classroomDetails.name}
                    </Header>
                  </div>
                </div>

                {/* Captain */}
                <div className="mt-2 md:mt-0">
                  <div className={`flex items-center gap-2 transition-colors duration-300 ${
                    darkMode
                      ? 'text-gray-100'
                      : 'text-amber-100'
                  }`}>
                    <Ship className="w-5 h-5" />
                    <div className="text-sm font-medium">
                      Captain:{' '}
                      {classroomDetails.teacher?.firstName && classroomDetails.teacher?.lastName
                        ? `${classroomDetails.teacher.firstName} ${classroomDetails.teacher.lastName}`
                        : classroomDetails.teacher?.name || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ship's Mission */}
              <div className="mt-4">
                <div className="flex items-start gap-2">
                  <Scroll className={`w-5 h-5 mt-1 flex-shrink-0 transition-colors duration-300 ${
                    darkMode
                      ? 'text-gray-300'
                      : 'text-amber-300'
                  }`} />
                  <p className={`leading-relaxed transition-colors duration-300 ${
                    darkMode
                      ? 'text-gray-100'
                      : 'text-amber-100'
                  }`}>{classroomDetails.description}</p>
                </div>
              </div>

              {/* Treasure Stats */}
              <div className={`mt-8 grid grid-cols-4 text-center rounded-2xl p-4 border transition-colors duration-300 ${
                darkMode
                  ? 'divide-x divide-gray-600 bg-gray-900/30 border-gray-600/50'
                  : 'divide-x divide-amber-600 bg-amber-900/30 border-amber-600/50'
              }`}>
                <div className="stat-counter px-4">
                  <div className="text-3xl mb-1">📜</div>
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    darkMode
                      ? 'text-gray-100'
                      : 'text-amber-100'
                  }`}>{lessons.length}</div>
                  <div className={`text-sm transition-colors duration-300 ${
                    darkMode
                      ? 'text-gray-200'
                      : 'text-amber-200'
                  }`}>Treasure Maps</div>
                </div>
                <div className="stat-counter px-4">
                  <div className="text-3xl mb-1">⚔️</div>
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    darkMode
                      ? 'text-gray-100'
                      : 'text-amber-100'
                  }`}>{activities.length}</div>
                  <div className={`text-sm transition-colors duration-300 ${
                    darkMode
                      ? 'text-gray-200'
                      : 'text-amber-200'
                  }`}>Quests</div>
                </div>
                <div className="stat-counter px-4">
                  <div className="text-3xl mb-1">🏆</div>
                  <div className="text-2xl font-bold text-emerald-300">
                    {quizStats.passedQuizzes}
                  </div>
                  <div className={`text-sm transition-colors duration-300 ${
                    darkMode
                      ? 'text-gray-200'
                      : 'text-amber-200'
                  }`}>Victories</div>
                </div>
                <div className="stat-counter px-4">
                  <div className="text-3xl mb-1">🗺️</div>
                  <div className="text-2xl font-bold text-orange-300">
                    {quizStats.notTakenQuizzes}
                  </div>
                  <div className={`text-sm transition-colors duration-300 ${
                    darkMode
                      ? 'text-gray-200'
                      : 'text-amber-200'
                  }`}>Uncharted</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pirate Map Navigation */}
        <div className="my-10">
          {/* Decorative map border */}
          <div className={`h-[2px] w-full shadow-lg transition-colors duration-300 ${
            darkMode
              ? 'bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600'
              : 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600'
          }`}></div>
          
          <div className="flex flex-col items-center justify-center py-6">
            <div className={`rounded-2xl p-2 shadow-xl border-2 transition-colors duration-300 ${
              darkMode
                ? 'bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600'
                : 'bg-gradient-to-r from-amber-800 to-amber-700 border-amber-600'
            }`}>
              <div className={`tabs-nav flex items-center rounded-xl p-1 transition-colors duration-300 ${
                darkMode
                  ? 'bg-gray-100'
                  : 'bg-amber-100'
              }`}>
                <button
                  onClick={() => handleTabChange("lessons")}
                  className={`px-6 py-3 mr-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                    activeTab === "lessons"
                      ? darkMode
                        ? "bg-gray-600 text-white shadow-lg transform scale-105"
                        : "bg-amber-600 text-white shadow-lg transform scale-105"
                      : darkMode
                        ? "text-gray-700 hover:bg-gray-200 hover:text-gray-800"
                        : "text-amber-700 hover:bg-amber-200 hover:text-amber-800"
                  }`}
                  id="lessons-tab"
                >
                  <MapPin className="w-5 h-5" />
                  <span className="font-semibold">Treasure Maps</span>
                </button>

                <div className={`border-l-2 h-8 mx-2 transition-colors duration-300 ${
                  darkMode
                    ? 'border-gray-400'
                    : 'border-amber-400'
                }`} />
              
                <button
                  onClick={() => handleTabChange("activities")}
                  className={`px-6 py-3 mr-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                    activeTab === "activities"
                      ? darkMode
                        ? "bg-gray-600 text-white shadow-lg transform scale-105"
                        : "bg-amber-600 text-white shadow-lg transform scale-105"
                      : darkMode
                        ? "text-gray-700 hover:bg-gray-200 hover:text-gray-800"
                        : "text-amber-700 hover:bg-amber-200 hover:text-amber-800"
                  }`}
                  id="activities-tab"
                >
                  <Sword className="w-5 h-5" />
                  <span className="font-semibold">Adventures</span>
                </button>

                <div className={`border-l-2 h-8 mx-2 transition-colors duration-300 ${
                  darkMode
                    ? 'border-gray-400'
                    : 'border-amber-400'
                }`} />
                <button
                  onClick={() => handleTabChange("leaderboard")}
                  className={`px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                    activeTab === "leaderboard"
                      ? darkMode
                        ? "bg-gray-600 text-white shadow-lg transform scale-105"
                        : "bg-amber-600 text-white shadow-lg transform scale-105"
                      : darkMode
                        ? "text-gray-700 hover:bg-gray-200 hover:text-gray-800"
                        : "text-amber-700 hover:bg-amber-200 hover:text-amber-800"
                  }`}
                  id="leaderboard-tab"
                >
                  <Crown className="w-5 h-5" />
                  <span className="font-semibold">Captain's Board</span>
                </button>
              </div>
            </div>
          </div>

          <div className={`h-[2px] w-full shadow-lg transition-colors duration-300 ${
            darkMode
              ? 'bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600'
              : 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600'
          }`}></div>
        </div>

        {/* Tab Contents */}
        <div className="mt-6 tab-content-section">
          {activeTab === "lessons" && (
            <div className="flex flex-col md:flex-row gap-6">
              
              {/* Pirate Scroll Sidebar */}
              <div className={`w-full md:w-1/3 rounded-tl-3xl rounded-bl-3xl overflow-hidden p-5 border-4 shadow-2xl relative transition-colors duration-300 ${
                darkMode
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600'
                  : 'bg-gradient-to-br from-amber-800 to-amber-900 border-amber-600'
              }`}>
                {/* Scroll texture overlay */}
                <div className={`absolute inset-0 transition-colors duration-300 ${
                  darkMode
                    ? 'bg-gradient-to-b from-gray-900/30 to-transparent'
                    : 'bg-gradient-to-b from-amber-900/30 to-transparent'
                }`}></div>
                <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"40\" height=\"40\" viewBox=\"0 0 40 40\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%23d97706\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M0 20h40v20H0z\"/%3E%3C/g%3E%3C/svg%3E')"}}></div>
                
                {/* Decorative scroll elements */}
                <div className="absolute top-4 right-4 text-2xl opacity-60">📜</div>
                <div className="absolute bottom-4 left-4 text-2xl opacity-60">⚓</div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Scroll className={`w-6 h-6 transition-colors duration-300 ${
                      darkMode
                        ? 'text-gray-300'
                        : 'text-amber-300'
                    }`} />
                    <h3 className={`text-xl font-bold transition-colors duration-300 ${
                      darkMode
                        ? 'text-gray-100'
                        : 'text-amber-100'
                    }`}>Treasure Map Collection</h3>
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

              {/* Pirate Treasure Chest Content Area */}
              <div className={`w-full md:w-2/3 rounded-lg shadow-2xl border-4 h-[calc(85vh)] flex flex-col relative overflow-hidden transition-colors duration-300 ${
                darkMode
                  ? 'bg-gradient-to-br from-gray-100 to-gray-50 border-gray-400'
                  : 'bg-gradient-to-br from-amber-100 to-amber-50 border-amber-400'
              }`}>
                
                {lessonLoading && (
                  <div className={`absolute inset-0 backdrop-blur-sm flex items-center justify-center z-10 transition-colors duration-300 ${
                    darkMode
                      ? 'bg-gray-100/90'
                      : 'bg-amber-100/90'
                  }`}>
                    <div className={`flex flex-col items-center gap-4 rounded-2xl p-6 shadow-xl border-2 transition-colors duration-300 ${
                      darkMode
                        ? 'bg-white/80 border-gray-300'
                        : 'bg-white/80 border-amber-300'
                    }`}>
                      <div className="relative">
                        <div className={`animate-spin rounded-full h-12 w-12 border-4 transition-colors duration-300 ${
                          darkMode
                            ? 'border-gray-200 border-t-gray-600'
                            : 'border-amber-200 border-t-amber-600'
                        }`}></div>
                        <div className={`absolute inset-0 rounded-full border-4 border-transparent animate-spin transition-colors duration-300 ${
                          darkMode
                            ? 'border-t-gray-400'
                            : 'border-t-amber-400'
                        }`} style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                      </div>
                      <p className={`font-medium transition-colors duration-300 ${
                        darkMode
                          ? 'text-gray-700'
                          : 'text-amber-700'
                      }`}>Unfurling the treasure map...</p>
                    </div>
                  </div>
                )}
                
                {loading && currentLessonId && !selectedLesson ? (
                  <main className="lesson-detail-placeholder p-6 rounded-md min-h-[300px] flex items-center justify-center shadow h-full">
                    <div className={`flex flex-col items-center gap-4 rounded-2xl p-6 shadow-xl border-2 transition-colors duration-300 ${
                      darkMode
                        ? 'bg-white/80 border-gray-300'
                        : 'bg-white/80 border-amber-300'
                    }`}>
                      <div className="text-4xl">🗺️</div>
                      <div className="relative">
                        <div className={`animate-spin rounded-full h-12 w-12 border-4 transition-colors duration-300 ${
                          darkMode
                            ? 'border-gray-200 border-t-gray-600'
                            : 'border-amber-200 border-t-amber-600'
                        }`}></div>
                      </div>
                      <p className={`font-medium transition-colors duration-300 ${
                        darkMode
                          ? 'text-gray-700'
                          : 'text-amber-700'
                      }`}>Charting the course...</p>
                    </div>
                  </main>
                ) : selectedLesson ? (
                  <div className="flex flex-col h-full">
                    {/* Fixed Title Section - Treasure Map Header */}
                    <div className={`p-6 border-b-2 transition-colors duration-300 ${
                      darkMode
                        ? 'border-gray-300 bg-gradient-to-r from-gray-200 to-gray-100'
                        : 'border-amber-300 bg-gradient-to-r from-amber-200 to-amber-100'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">🗺️</div>
                        <Header
                          type="h2"
                          weight="bold"
                          className={`!text-4xl drop-shadow-sm transition-colors duration-300 ${
                            darkMode
                              ? 'text-gray-800'
                              : 'text-amber-800'
                          }`}
                        >{selectedLesson.title}</Header>
                      </div>
                    </div>

                    {/* Scrollable Content Section - Ancient Scroll */}
                    <div 
                      className={`flex-1 overflow-y-auto p-6 transition-colors duration-300 ${
                        darkMode
                          ? 'bg-gradient-to-b from-gray-50 to-gray-100'
                          : 'bg-gradient-to-b from-amber-50 to-amber-100'
                      }`}
                      onScroll={handleScroll}
                    >
                      {selectedLesson.contentBlocks?.length > 0 ? (
                        <div className="content-blocks space-y-8">
                          {selectedLesson.contentBlocks.map((block) => (
                            <div key={block.id} className={`content-block rounded-xl p-6 shadow-lg border transition-colors duration-300 ${
                              darkMode
                                ? 'bg-white/80 border-gray-200'
                                : 'bg-white/80 border-amber-200'
                            }`}>
                              <ContentBlockDisplay block={block} />
                            </div>
                          ))}

                          {/* Read Status - Treasure Discovered */}
                          {completionStatus?.contentRead && (
                            <div className="mt-8">
                              <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 rounded-xl p-4 border-2 border-emerald-200 shadow-lg">
                                <div className="text-2xl">🏆</div>
                                <CheckCircle className="w-6 h-6" />
                                <span className="font-bold text-lg">Treasure Map Studied!</span>
                              </div>
                            </div>
                          )}

                          {/* Quiz Section */}
                          {renderQuizSection()}

                          {/* Quiz Completion Status - Quest Completed */}
                          {completionStatus?.quizCompleted && (
                            <div className="mt-8">
                              <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 rounded-xl p-4 border-2 border-emerald-200 shadow-lg">
                                <div className="text-2xl">⚔️</div>
                                <CheckCircle className="w-6 h-6" />
                                <span className="font-bold text-lg">Quest Completed!</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className={`rounded-2xl p-8 shadow-lg border-2 transition-colors duration-300 ${
                            darkMode
                              ? 'bg-white/80 border-gray-200'
                              : 'bg-white/80 border-amber-200'
                          }`}>
                            <div className="text-6xl mb-4">🗺️</div>
                            <p className={`text-lg font-medium transition-colors duration-300 ${
                              darkMode
                                ? 'text-gray-700'
                                : 'text-amber-700'
                            }`}>This treasure map is still being charted by the captain!</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : lessons.length > 0 && !currentLessonId ? (
                  <main className="lesson-detail-placeholder p-6 rounded-md min-h-[300px] flex items-center justify-center shadow h-full">
                    <div className={`rounded-2xl p-8 shadow-xl border-2 text-center transition-colors duration-300 ${
                      darkMode
                        ? 'bg-white/80 border-gray-300'
                        : 'bg-white/80 border-amber-300'
                    }`}>
                      <div className="text-6xl mb-4">🗺️</div>
                      <p className={`text-lg font-medium transition-colors duration-300 ${
                        darkMode
                          ? 'text-gray-700'
                          : 'text-amber-700'
                      }`}>Choose a treasure map from your collection to begin your adventure!</p>
                    </div>
                  </main>
                ) : (
                  <main className="lesson-detail-placeholder p-6 rounded-md min-h-[300px] flex items-center justify-center shadow h-full">
                    <div className="text-center">
                      <div className={`rounded-2xl p-8 shadow-xl border-2 transition-colors duration-300 ${
                        darkMode
                          ? 'bg-white/80 border-gray-300'
                          : 'bg-white/80 border-amber-300'
                      }`}>
                        <div className="text-6xl mb-4">🏴‍☠️</div>
                        <p className={`text-lg font-medium mb-2 transition-colors duration-300 ${
                          darkMode
                            ? 'text-gray-700'
                            : 'text-amber-700'
                        }`}>The captain hasn't charted any treasure maps yet!</p>
                        <p className={`transition-colors duration-300 ${
                          darkMode
                            ? 'text-gray-600'
                            : 'text-amber-600'
                        }`}>Check back later for new adventures.</p>
                      </div>
                    </div>
                  </main>
                )}
              </div>
            </div>
          )}

          {activeTab === "activities" && (
            <div className={`p-8 rounded-2xl shadow-2xl border-4 transition-colors duration-300 ${
              darkMode
                ? 'bg-gradient-to-br from-gray-100 to-gray-50 border-gray-400'
                : 'bg-gradient-to-br from-amber-100 to-amber-50 border-amber-400'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <Sword className={`w-8 h-8 transition-colors duration-300 ${
                  darkMode
                    ? 'text-gray-700'
                    : 'text-amber-700'
                }`} />
                <h2 className={`text-3xl font-bold transition-colors duration-300 ${
                  darkMode
                    ? 'text-gray-800'
                    : 'text-amber-800'
                }`}>Adventure Quests</h2>
              </div>
              <div className="mb-8">
                <QuizManager classroomId={classroomId} isStudent={true}/>
              </div>
              <ClassroomGamesTab classroomId={classroomId} />
            </div>
          )}

          {activeTab === "leaderboard" && (
            <div className={`p-8 rounded-2xl shadow-2xl border-4 transition-colors duration-300 ${
              darkMode
                ? 'bg-gradient-to-br from-gray-100 to-gray-50 border-gray-400'
                : 'bg-gradient-to-br from-amber-100 to-amber-50 border-amber-400'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <Crown className={`w-8 h-8 transition-colors duration-300 ${
                  darkMode
                    ? 'text-gray-700'
                    : 'text-amber-700'
                }`} />
                <h2 className={`text-3xl font-bold transition-colors duration-300 ${
                  darkMode
                    ? 'text-gray-800'
                    : 'text-amber-800'
                }`}>Captain's Board</h2>
              </div>
              <Leaderboard classroomId={classroomId} />
            </div>
          )}

          {!activeTab && (
            <div className={`p-12 rounded-2xl shadow-2xl border-4 text-center transition-colors duration-300 ${
              darkMode
                ? 'bg-gradient-to-br from-gray-100 to-gray-50 border-gray-400'
                : 'bg-gradient-to-br from-amber-100 to-amber-50 border-amber-400'
            }`}>
              <div className="max-w-lg mx-auto">
                <div className="text-8xl mb-6">🏴‍☠️</div>
                <h3 className={`text-3xl font-bold mb-4 transition-colors duration-300 ${
                  darkMode
                    ? 'text-gray-800'
                    : 'text-amber-800'
                }`}>Welcome Aboard the {classroomDetails?.name}!</h3>
                <p className={`text-lg mb-8 transition-colors duration-300 ${
                  darkMode
                    ? 'text-gray-700'
                    : 'text-amber-700'
                }`}>
                  Ready for your pirate adventure? Choose your quest below to begin exploring the treasure-filled waters!
                </p>
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => handleTabChange("lessons")}
                    className="flex items-center justify-center gap-3 p-6 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <MapPin className="w-6 h-6 text-white" />
                    <span className="font-bold text-white text-lg">Explore Treasure Maps</span>
                  </button>
                  <button
                    onClick={() => handleTabChange("activities")}
                    className="flex items-center justify-center gap-3 p-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <Sword className="w-6 h-6 text-white" />
                    <span className="font-bold text-white text-lg">Begin Adventures</span>
                  </button>
                  <button
                    onClick={() => handleTabChange("leaderboard")}
                    className="flex items-center justify-center gap-3 p-6 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <Crown className="w-6 h-6 text-white" />
                    <span className="font-bold text-white text-lg">Check Captain's Board</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default StudentClassroomPage; 

