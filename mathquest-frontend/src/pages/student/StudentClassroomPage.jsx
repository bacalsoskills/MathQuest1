
// import React, { useState, useEffect } from "react";
// import { useParams, useLocation } from "react-router-dom";
// import classroomService from "../../services/classroomService";
// import lessonService from "../../services/lessonService";
// import { leaderboardService } from "../../services/leaderboardService";
// import LessonSidebar from "../../components/lessons/LessonSidebar";
// import ContentBlockDisplay from "../../components/lessons/ContentBlockDisplay";
// import ClassroomGamesTab from "./ClassroomGamesTab";
// import QuizManager from "../../components/teacher/QuizManager";
// import Leaderboard from "../../components/leaderboard/Leaderboard";
// import { Header } from '../../ui/heading';
// import activityService from "../../services/activityService";

// const StudentClassroomPage = () => {
//   const { classroomId, lessonId: initialLessonId } = useParams();
//   const location = useLocation();
//   const [classroomDetails, setClassroomDetails] = useState(null);
//   const [lessons, setLessons] = useState([]);
//   const [selectedLesson, setSelectedLesson] = useState(null);
//   const [currentLessonId, setCurrentLessonId] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [activeTab, setActiveTab] = useState("lessons");
//   const [activities, setActivities] = useState([]);
//   const [quizStats, setQuizStats] = useState({ passedQuizzes: 0, notTakenQuizzes: 0 });

//   useEffect(() => {
//     // Check if there's an active tab in location state (from navigation)
//     if (location.state?.activeTab) {
//       setActiveTab(location.state.activeTab);
//     }
//   }, [location.state]);
  
//   useEffect(() => {
//     const fetchData = async () => {
//       if (!classroomId) return;
//       try {
//         setLoading(true);
        
//         // Fetch classroom details for header information
//         const details = await classroomService.getClassroomDetails(classroomId);
//         setClassroomDetails(details);
        
//         // Fetch lessons separately using the dedicated lessons endpoint
//         const lessonsList = await lessonService.getLessonsByClassroomId(classroomId);
//         setLessons(lessonsList);

//         // Fetch activities for the classroom
//         const activitiesList = await activityService.getActivitiesByClassroom(classroomId);
//         if (activitiesList) {
//           setActivities(activitiesList);
//         }

//         // Fetch quiz statistics
//         try {
//           const performance = await leaderboardService.getStudentPerformance(classroomId);
//           setQuizStats({
//             passedQuizzes: performance.passedQuizzes || 0,
//             notTakenQuizzes: performance.notTakenQuizzes || 0
//           });
//         } catch (quizError) {
//           console.error("Error fetching quiz statistics:", quizError);
//           // Don't set error state here as it's not critical
//         }
       
//         // Set initial lesson ID from URL parameter or first lesson
//         let lessonToLoadId = initialLessonId;
//         if (!lessonToLoadId && lessonsList && lessonsList.length > 0) {
//           lessonToLoadId = lessonsList[0].id;
//         }
//         setCurrentLessonId(lessonToLoadId);
//       } catch (err) {
//         console.error("Error fetching classroom data:", err);
//         setError("Failed to load classroom data.");
//         setClassroomDetails(null);
//         setLessons([]);
//         setActivities([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [classroomId, initialLessonId]);

//   useEffect(() => {
//     const fetchLessonDetails = async () => {
//       if (!currentLessonId) {
//         setSelectedLesson(null);
//         return;
//       }
//       try {
//         setLoading(true);
//         const lessonData = await lessonService.getLessonById(currentLessonId);
//         setSelectedLesson(lessonData);
//       } catch (err) {
//         console.error(`Error fetching lesson ${currentLessonId}:`, err);
//         setError(`Failed to load lesson: ${err.message}`);
//         setSelectedLesson(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (classroomDetails) {
//       fetchLessonDetails();
//     }
//   }, [currentLessonId, classroomDetails]);

//   const handleSelectLesson = (lessonId) => {
//     setCurrentLessonId(lessonId);
//   };

//   const handleTabChange = (tabName) => {
//     setActiveTab(tabName);
//   };

//   if (loading && !error) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return <div style={{ color: "red" }}>Error: {error}</div>;
//   }

//   if (!classroomDetails) {
//     return <div>Classroom not found or failed to load.</div>;
//   }

//   return (
//     <div className="bg-[#E7EFFC] min-h-screen px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
//       <div className="max-w-5xl mx-auto">

//         <div className="classroom-header flex flex-col md:flex-row md:space-x-8 h-full md:h-auto">
//           {/* Left - Image */}
//           <div className="w-full md:w-1/3 h-full">
//             <div className="h-full bg-gray-200 rounded-tl-3xl rounded-bl-3xl overflow-hidden">
//               {classroomDetails.image ? (
//                 <img
//                   src={`data:image/jpeg;base64,${classroomDetails.image}`}
//                   alt={classroomDetails.name}
//                   className="w-full h-[280px] object-cover"
//                 />
//               ) : (
//                 <div className="w-full h-[280px] flex items-center justify-center bg-gradient-to-r from-blue-100 to-blue-200">
//                   <span className="text-lg text-blue-500 font-medium">
//                     {selectedLesson?.title || classroomDetails.name}
//                   </span>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Right - Details */}
//           <div className="w-full md:w-2/3 flex flex-col md:pl-4 md:pr-6 py-5 h-full">
//             {/* Course code and title */}
//             <div className="flex flex-col md:flex-row justify-between">
//               <div>
//                 <div className="text-sm font-bold text-blue-600 mb-1">
//                   {classroomDetails.shortCode}
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Header type="h1" fontSize="2xl" weight="bold" className="text-gray-800">
//                     {classroomDetails.name}
//                   </Header>
//                 </div>
//               </div>

//               {/* Teacher */}
//               <div className="mt-2 md:mt-0">
//                 <div className="text-sm font-semibold text-gray-800">
//                   Teacher:{' '}
//                   {classroomDetails.teacher?.firstName && classroomDetails.teacher?.lastName
//                     ? `${classroomDetails.teacher.firstName} ${classroomDetails.teacher.lastName}`
//                     : classroomDetails.teacher?.name || 'N/A'}
//                 </div>
//                 <div className="font-medium">{classroomDetails.teacherName}</div>
//               </div>
//             </div>

//             {/* Description */}
//             <div className="mt-3">
//               <p className="text-gray-700">{classroomDetails.description}</p>
//             </div>

//             {/* Stats */}
//             <div className="mt-10 grid grid-cols-4 divide-x divide-gray-300 text-center">
//               <div className="stat-counter px-4">
//                 <div className="text-2xl font-bold">{lessons.length}</div>
//                 <div className="text-sm text-gray-500">Lessons</div>
//               </div>
//               <div className="stat-counter px-4">
//                 <div className="text-2xl font-bold">{activities.length}</div>
//                 <div className="text-sm text-gray-500">Activities</div>
//               </div>
//               <div className="stat-counter px-4">
//                 <div className="text-2xl font-bold text-green-500">
//                   {quizStats.passedQuizzes}
//                 </div>
//                 <div className="text-sm text-gray-500">Passed</div>
//               </div>
//               <div className="stat-counter px-4">
//                 <div className="text-2xl font-bold text-orange-500">
//                   {quizStats.notTakenQuizzes}
//                 </div>
//                 <div className="text-sm text-gray-500">Incomplete</div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Tabs Navigation */}
//         <div className="my-10">
//           <hr className="border-gray-300" />
          
//           <div className="flex flex-col items-center justify-center py-4">
//             <div className="tabs-nav flex items-center">
//               <button
//                 onClick={() => handleTabChange("lessons")}
//                 className="px-4 py-2 mr-2 text-gray-500 hover:text-gray-800"
//               >
//                 <span
//                   className={`${
//                     activeTab === "lessons"
//                       ? "font-semibold border-b-2 border-blue-600 text-blue-600"
//                       : "text-gray-500 hover:text-gray-800"
//                   }`}
//                 >
//                   Lessons
//                 </span>
//               </button>

//               <div className="border-l border-gray-300 h-6 mx-2" />
            
//               <button
//                 onClick={() => handleTabChange("activities")}
//                 className="px-4 py-2 text-gray-500 hover:text-gray-800"
//               >
//                 <span
//                   className={`${
//                     activeTab === "activities"
//                       ? "font-semibold border-b-2 border-blue-600 text-blue-600"
//                       : "text-gray-500 hover:text-gray-800"
//                   }`}
//                 >
//                   Activities
//                 </span>
//               </button>


//               <div className="border-l border-gray-300 h-6 mx-2" />
//               <button
//                 onClick={() => handleTabChange("leaderboard")}
//                 className="px-4 py-2 text-gray-500 hover:text-gray-800"
//               >
//                 <span
//                   className={`${
//                     activeTab === "leaderboard"
//                       ? "font-semibold border-b-2 border-blue-600 text-blue-600"
//                       : "text-gray-500 hover:text-gray-800"
//                   }`}
//                 >
//                   Leaderboard
//                 </span>
//               </button>
//             </div>
//           </div>

//           <hr className="border-gray-300" />
//         </div>

//         {/* Tab Contents */}
//         <div className="mt-6">
//           {activeTab === "lessons" && (
//             <div className="flex flex-col md:flex-row gap-6">
//               {/* Left Side - Sidebar */}
//               <div className="w-full md:w-1/3 bg-[#60B5FF] rounded-tl-3xl rounded-bl-3xl overflow-hidden p-5">
//                 <LessonSidebar
//                   lessons={lessons}
//                   currentLessonId={currentLessonId}
//                   onSelectLesson={handleSelectLesson}
//                   isStudent={true}
//                 />
//               </div>

//               {/* Right Side - Lesson Content */}
//               <div className="w-full md:w-2/3 bg-[#60B5FF]/20 rounded-lg shadow h-[calc(100vh-300px)] flex flex-col">
//                 {loading && currentLessonId && !selectedLesson ? (
//                   <main className="lesson-detail-placeholder p-6 rounded-md min-h-[300px] flex items-center justify-center shadow h-full">
//                     <p className="text-gray-500 text-lg">Loading lesson details...</p>
//                   </main>
//                 ) : selectedLesson ? (
//                   <div className="flex flex-col h-full">
//                     {/* Fixed Title Section */}
//                     <div className="p-5 border-b border-gray-100">
//                       <Header
//                         type="h2"
//                         weight="bold"
//                         size="3xl"
//                         className="!text-4xl text-black"
//                       >{selectedLesson.title}</Header>
//                     </div>

//                     {/* Scrollable Content Section */}
//                     <div className="flex-1 overflow-y-auto p-5">
//                       {selectedLesson.contentBlocks?.length > 0 ? (
//                         <div className="content-blocks">
//                           {selectedLesson.contentBlocks.map((block) => (
//                             <div key={block.id} className="content-block mb-8">
//                               <ContentBlockDisplay block={block} />
//                             </div>
//                           ))}
//                         </div>
//                       ) : (
//                         <div className="text-center py-8">
//                           <p className="text-gray-500">No content has been added to this lesson yet.</p>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ) : lessons.length > 0 && !currentLessonId ? (
//                   <main className="lesson-detail-placeholder p-6 bg-gray-50 rounded-md min-h-[300px] flex items-center justify-center shadow h-full">
//                     <p className="text-gray-500 text-lg">Please select a lesson to view its details.</p>
//                   </main>
//                 ) : (
//                   <main className="lesson-detail-placeholder p-6 bg-gray-50 rounded-md min-h-[300px] flex items-center justify-center shadow h-full">
//                     <div className="text-center">
//                       <p className="text-gray-500 text-lg mb-4">This classroom currently has no lessons.</p>
//                     </div>
//                   </main>
//                 )}
//               </div>
//             </div>
//           )}

//           {activeTab === "activities" && (
//             <div className="bg-white p-6 rounded-lg shadow">
//               <div className="mb-8">
//                 <QuizManager classroomId={classroomId} isStudent={true}/>
//               </div>
//               <ClassroomGamesTab classroomId={classroomId} />
//             </div>
//           )}

//           {activeTab === "leaderboard" && (
//             <div className="bg-white p-6 rounded-lg shadow">
//               <Leaderboard classroomId={classroomId} />
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default StudentClassroomPage; 


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
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("lessons");
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
      console.log(`[StudentClassroomPage] Fetching lessons for classroom ${classroomId}`);
      const lessonsList = await lessonService.getLessonsByClassroomId(classroomId);
      console.log(`[StudentClassroomPage] Fetched ${lessonsList.length} lessons`);
      setLessons(lessonsList);
    } catch (err) {
      console.error(`[StudentClassroomPage] Error fetching lessons:`, err);
      setError("Failed to load lessons.");
      setLessons([]);
    }
  };

  useEffect(() => {
    // Check if there's an active tab in location state (from navigation)
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);
  
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
       
        // Set initial lesson ID from URL parameter or first lesson
        let lessonToLoadId = initialLessonId;
        if (!lessonToLoadId && lessons.length > 0) {
          lessonToLoadId = lessons[0].id;
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
        setLoading(true);
        const lessonData = await lessonService.getLessonById(currentLessonId);
        setSelectedLesson(lessonData);
      } catch (err) {
        console.error(`Error fetching lesson ${currentLessonId}:`, err);
        setError(`Failed to load lesson: ${err.message}`);
        setSelectedLesson(null);
      } finally {
        setLoading(false);
      }
    };

    if (classroomDetails) {
      fetchLessonDetails();
    }
  }, [currentLessonId, classroomDetails]);

  useEffect(() => {
    if (selectedLesson?.id && user?.id) {
      // Fetch completion status
      console.log(`[StudentClassroomPage] Fetching completion status for lesson ${selectedLesson.id} and student ${user.id}`);
      lessonService.getLessonCompletionStatus(selectedLesson.id, user.id)
        .then(status => {
          console.log(`[StudentClassroomPage] Received completion status:`, status);
          setCompletionStatus(status);
          
          // Check for quiz availability
          const hasQuiz = selectedLesson.activities?.some(activity => activity.type === 'QUIZ');
          console.log(`[StudentClassroomPage] Lesson ${selectedLesson.id} quiz check:`, {
            hasQuiz,
            activities: selectedLesson.activities,
            quizActivities: selectedLesson.activities?.filter(activity => activity.type === 'QUIZ')
          });

          // If content is already read, show quiz if available
          if (status.contentRead) {
            console.log(`[StudentClassroomPage] Content is already read, checking quiz status`);
            if (hasQuiz && !status.quizCompleted) {
              console.log(`[StudentClassroomPage] Quiz is available and not completed, showing quiz`);
              setShowQuiz(true);
            } else if (hasQuiz && status.quizCompleted) {
              console.log(`[StudentClassroomPage] Quiz is completed, unlocking next lesson`);
              unlockNextLesson();
            } else if (!hasQuiz) {
              console.log(`[StudentClassroomPage] No quiz available, unlocking next lesson`);
              unlockNextLesson();
            }
            setHasScrolledToBottom(true);
          } else {
            // Check if content is small enough to be read without scrolling
            setTimeout(() => {
              const contentContainer = document.querySelector('.content-blocks');
              if (contentContainer) {
                const isContentSmall = contentContainer.scrollHeight <= contentContainer.clientHeight;
                console.log(`[StudentClassroomPage] Content size check:`, {
                  scrollHeight: contentContainer.scrollHeight,
                  clientHeight: contentContainer.clientHeight,
                  isContentSmall,
                  contentBlocks: selectedLesson.contentBlocks,
                  contentLength: selectedLesson.contentBlocks?.length || 0
                });
                if (isContentSmall) {
                  console.log(`[StudentClassroomPage] Content is small, marking as read automatically`);
                  markContentAsRead();
                }
              }
            }, 100); // Small delay to ensure content is rendered
          }
        })
        .catch(err => {
          console.error(`[StudentClassroomPage] Error fetching completion status:`, err);
          console.error(`[StudentClassroomPage] Error details:`, err.response?.data);
        });
    }
  }, [selectedLesson?.id, user?.id]);

  // Add a new useEffect to check quiz completion status periodically
  useEffect(() => {
    if (!selectedLesson?.id || !user?.id) return;

    const checkQuizCompletion = async () => {
      try {
        const status = await lessonService.getLessonCompletionStatus(selectedLesson.id, user.id);
        console.log(`[StudentClassroomPage] Periodic check - Quiz completion status:`, {
          status,
          currentCompletionStatus: completionStatus,
          lessonId: selectedLesson.id,
          studentId: user.id
        });
        
        if (status.quizCompleted && !completionStatus?.quizCompleted) {
          console.log(`[StudentClassroomPage] Quiz was completed, updating status and unlocking next lesson`);
          setCompletionStatus(status);
          unlockNextLesson();
        }
      } catch (err) {
        console.error(`[StudentClassroomPage] Error checking quiz completion:`, err);
      }
    };

    // Check every 2 seconds
    const intervalId = setInterval(checkQuizCompletion, 2000);

    return () => clearInterval(intervalId);
  }, [selectedLesson?.id, user?.id, completionStatus?.quizCompleted]);

  // Add a new useEffect to handle quiz completion from URL state
  useEffect(() => {
    if (location.state?.quizCompleted) {
      console.log(`[StudentClassroomPage] Quiz completion detected from URL state:`, {
        state: location.state,
        currentLesson: selectedLesson,
        currentStatus: completionStatus
      });
      
      // Ensure we have the score and lesson ID
      if (location.state.score !== undefined && selectedLesson?.id) {
        console.log(`[StudentClassroomPage] Processing quiz completion with score:`, location.state.score);
        handleQuizComplete(location.state.score);
      } else {
        console.error(`[StudentClassroomPage] Quiz completion state missing required data:`, {
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
      console.log(`[StudentClassroomPage] Marking lesson ${selectedLesson.id} as read for student ${user.id}`, {
        lessonId: selectedLesson.id,
        studentId: user.id,
        currentStatus: completionStatus,
        contentBlocks: selectedLesson.contentBlocks
      });
      
      lessonService.markLessonContentAsRead(selectedLesson.id, user.id)
        .then(response => {
          console.log(`[StudentClassroomPage] Successfully marked content as read:`, response);
          setCompletionStatus(prev => ({ ...prev, contentRead: true }));
          setHasScrolledToBottom(true);
          
          // Check for quiz availability
          const hasQuiz = selectedLesson.activities?.some(activity => activity.type === 'QUIZ');
          console.log(`[StudentClassroomPage] Quiz availability check after marking content as read:`, {
            hasQuiz,
            activities: selectedLesson.activities,
            quizActivities: selectedLesson.activities?.filter(activity => activity.type === 'QUIZ'),
            completionStatus: { ...completionStatus, contentRead: true }
          });

          if (hasQuiz) {
            console.log(`[StudentClassroomPage] Quiz is available, showing quiz`);
            setShowQuiz(true);
          } else {
            console.log(`[StudentClassroomPage] No quiz available, unlocking next lesson`);
            unlockNextLesson();
          }
        })
        .catch(err => {
          console.error(`[StudentClassroomPage] Error marking content as read:`, err);
          console.error(`[StudentClassroomPage] Error details:`, err.response?.data);
        });
    }
  };

  // Add a new useEffect to check content size on mount and when content changes
  useEffect(() => {
    if (selectedLesson?.contentBlocks) {
      console.log(`[StudentClassroomPage] Content blocks changed, checking size:`, {
        contentBlocks: selectedLesson.contentBlocks,
        contentLength: selectedLesson.contentBlocks.length
      });
      
      setTimeout(() => {
        const contentContainer = document.querySelector('.content-blocks');
        if (contentContainer) {
          const isContentSmall = contentContainer.scrollHeight <= contentContainer.clientHeight;
          console.log(`[StudentClassroomPage] Content size check on mount/change:`, {
            scrollHeight: contentContainer.scrollHeight,
            clientHeight: contentContainer.clientHeight,
            isContentSmall,
            contentBlocks: selectedLesson.contentBlocks
          });
          
          if (isContentSmall && !completionStatus?.contentRead) {
            console.log(`[StudentClassroomPage] Content is small on mount/change, marking as read`);
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
        console.log(`[StudentClassroomPage] Initializing unlocked lessons`);
        const unlockedSet = new Set();
        
        // First lesson is always unlocked
        if (lessons.length > 0) {
          unlockedSet.add(lessons[0].id);
        }

        // Check completion status for each lesson
        for (const lesson of lessons) {
          try {
            const status = await lessonService.getLessonCompletionStatus(lesson.id, user.id);
            console.log(`[StudentClassroomPage] Lesson ${lesson.id} completion status:`, status);
            
            // If this lesson is completed, add it and the next one to unlocked lessons
            if (status.quizCompleted) {
              unlockedSet.add(lesson.id); // Add the completed lesson
              const lessonIndex = lessons.findIndex(l => l.id === lesson.id);
              if (lessonIndex < lessons.length - 1) {
                unlockedSet.add(lessons[lessonIndex + 1].id); // Add the next lesson
              }
            }
          } catch (err) {
            console.error(`[StudentClassroomPage] Error checking completion status for lesson ${lesson.id}:`, err);
          }
        }

        console.log(`[StudentClassroomPage] Initialized unlocked lessons:`, Array.from(unlockedSet));
        setUnlockedLessons(unlockedSet);
      } catch (err) {
        console.error(`[StudentClassroomPage] Error initializing unlocked lessons:`, err);
      }
    };

    initializeUnlockedLessons();
  }, [lessons, user?.id]);

  const unlockNextLesson = () => {
    const currentLessonIndex = lessons.findIndex(l => l.id === selectedLesson.id);
    console.log(`[StudentClassroomPage] Unlocking next lesson:`, {
      currentLessonIndex,
      totalLessons: lessons.length,
      currentLessonId: selectedLesson.id,
      currentLessonTitle: selectedLesson.title,
      unlockedLessons: Array.from(unlockedLessons),
      completionStatus
    });
    
    if (currentLessonIndex < lessons.length - 1) {
      const nextLesson = lessons[currentLessonIndex + 1];
      console.log(`[StudentClassroomPage] Next lesson found:`, {
        id: nextLesson.id,
        title: nextLesson.title,
        currentUnlocked: Array.from(unlockedLessons)
      });
      
      // Add both the current lesson and the next lesson to unlocked lessons
      setUnlockedLessons(prev => {
        const newUnlocked = new Set([...prev, selectedLesson.id, nextLesson.id]);
        console.log(`[StudentClassroomPage] Updated unlocked lessons:`, {
          previous: Array.from(prev),
          new: Array.from(newUnlocked),
          currentLessonId: selectedLesson.id,
          nextLessonId: nextLesson.id
        });
        return newUnlocked;
      });
    } else {
      console.log(`[StudentClassroomPage] This is the last lesson, no next lesson to unlock`);
      // Still add the current lesson to unlocked lessons if it's the last one
      setUnlockedLessons(prev => {
        const newUnlocked = new Set([...prev, selectedLesson.id]);
        console.log(`[StudentClassroomPage] Updated unlocked lessons for last lesson:`, {
          previous: Array.from(prev),
          new: Array.from(newUnlocked),
          currentLessonId: selectedLesson.id
        });
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
      console.log(`[StudentClassroomPage] Student reached bottom of lesson ${selectedLesson?.id}`);
      markContentAsRead();
    }
  };

  const handleQuizComplete = (score) => {
    console.log(`[StudentClassroomPage] Starting quiz completion process:`, {
      lessonId: selectedLesson.id,
      studentId: user.id,
      score,
      currentStatus: completionStatus,
      quizActivity: selectedLesson.activities?.find(a => a.type === 'QUIZ')
    });

    // First, mark the lesson quiz as completed
    lessonService.markLessonQuizAsCompleted(selectedLesson.id, user.id, score)
      .then(response => {
        console.log(`[StudentClassroomPage] Lesson quiz completion response:`, {
          response,
          lessonId: selectedLesson.id,
          studentId: user.id,
          score
        });

        // Update completion status
        setCompletionStatus(prev => {
          const newStatus = { 
            ...prev, 
            quizCompleted: true, 
            quizScore: score,
            quizCompletedAt: new Date().toISOString()
          };
          console.log(`[StudentClassroomPage] Updated completion status:`, newStatus);
          return newStatus;
        });
        
        // After quiz completion, unlock next lesson
        console.log(`[StudentClassroomPage] Proceeding to unlock next lesson`);
        unlockNextLesson();

        // Refresh the lesson list to show updated completion status
        fetchLessons();
      })
      .catch(err => {
        console.error(`[StudentClassroomPage] Error marking lesson quiz as completed:`, {
          error: err,
          response: err.response?.data,
          lessonId: selectedLesson.id,
          studentId: user.id,
          score
        });
      });
  };

  // Add a new useEffect to check quiz completion status
  useEffect(() => {
    if (!selectedLesson?.id || !user?.id) return;

    const checkQuizCompletion = async () => {
      try {
        const status = await lessonService.getLessonCompletionStatus(selectedLesson.id, user.id);
        console.log(`[StudentClassroomPage] Checking quiz completion status:`, {
          status,
          currentStatus: completionStatus,
          lessonId: selectedLesson.id,
          studentId: user.id,
          quizActivity: selectedLesson.activities?.find(a => a.type === 'QUIZ')
        });
        
        if (status.quizCompleted && !completionStatus?.quizCompleted) {
          console.log(`[StudentClassroomPage] Quiz completion detected, updating status and unlocking next lesson`);
          setCompletionStatus(status);
          unlockNextLesson();
          // Refresh the lesson list to show updated completion status
          fetchLessons();
        }
      } catch (err) {
        console.error(`[StudentClassroomPage] Error checking quiz completion:`, {
          error: err,
          response: err.response?.data,
          lessonId: selectedLesson.id,
          studentId: user.id
        });
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
        console.log(`[StudentClassroomPage] Fetching quiz data for lesson ${selectedLesson.id}`);
        const quizActivities = selectedLesson.activities.filter(activity => activity.type === 'QUIZ');
        const attemptsMap = {};

        for (const activity of quizActivities) {
          try {
            console.log(`[StudentClassroomPage] Fetching quiz for activity ${activity.id}`);
            const quiz = await quizService.getQuizByActivityId(activity.id);
            console.log(`[StudentClassroomPage] Fetched quiz data:`, quiz);

            if (quiz) {
              // Fetch attempts for this quiz using getQuizAttemptsByStudent
              const attempts = await quizService.getQuizAttemptsByStudent(user.id);
              const quizAttempts = attempts
                .filter(attempt => attempt.quizId === quiz.id)
                .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)); // Sort by completion date, most recent first
              console.log(`[StudentClassroomPage] Fetched attempts for quiz ${quiz.id}:`, quizAttempts);

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
            console.error(`[StudentClassroomPage] Error fetching quiz data for activity ${activity.id}:`, err);
          }
        }

        console.log(`[StudentClassroomPage] Final quiz attempts map:`, attemptsMap);
        setQuizAttempts(attemptsMap);
      } catch (err) {
        console.error(`[StudentClassroomPage] Error fetching quiz attempts:`, err);
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
                        <span className="font-medium">Attempts:</span> {quizData?.attempts?.length || 0}/{quizData?.quiz?.maxAttempts || '∞'}
                      </div>
                    </div>

                    {lastAttempt && (
                      <div className="mb-4 p-3 bg-gray-50 rounded">
                        <p className="font-medium">Last Attempt:</p>
                        <p>Score: {lastAttempt.score}/{quizData?.quiz?.overallScore || 0}</p>
                        <p>Date: {new Date(lastAttempt.completedAt).toLocaleString()}</p>
                        <p>Attempt: {quizData?.attempts?.length || 0}/{quizData?.quiz?.maxAttempts || '∞'}</p>
                      </div>
                    )}

                    <Button
                      onClick={() => handleStartQuiz(activity.id)}
                      className="w-full"
                      disabled={!canAttempt}
                    >
                      {buttonText}
                    </Button>
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
    console.log(`[StudentClassroomPage] Starting quiz for activity ${activityId}`);
    
    // Find the quiz activity in the lesson
    const quizActivity = selectedLesson.activities?.find(activity => 
      activity.id === activityId && activity.type === 'QUIZ'
    );
    
    if (!quizActivity) {
      console.error(`[StudentClassroomPage] Quiz activity ${activityId} not found in lesson`);
      return;
    }

    console.log(`[StudentClassroomPage] Found quiz activity:`, quizActivity);
    
    try {
      // Get the quiz ID from the activity
      const quiz = await quizService.getQuizByActivityId(activityId);
      console.log(`[StudentClassroomPage] Found quiz:`, quiz);

      if (!quiz) {
        throw new Error('Quiz not found');
      }

      // Create a new quiz attempt
      const attempt = await quizService.createQuizAttempt(quiz.id, user.id);
      console.log(`[StudentClassroomPage] Created new quiz attempt:`, attempt);

      // Navigate to the new attempt
      window.location.href = `/student/quizzes/${quiz.id}/attempt/${attempt.id}`;
    } catch (error) {
      console.error(`[StudentClassroomPage] Error starting quiz:`, error);
      
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
    <div className="bg-[#E7EFFC] min-h-screen px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      <div className="max-w-5xl mx-auto">

        <div className="classroom-header flex flex-col md:flex-row md:space-x-8 h-full md:h-auto">
          {/* Left - Image */}
          <div className="w-full md:w-1/3 h-full">
            <div className="h-full bg-gray-200 rounded-tl-3xl rounded-bl-3xl overflow-hidden">
              {classroomDetails.image ? (
                <img
                  src={`data:image/jpeg;base64,${classroomDetails.image}`}
                  alt={classroomDetails.name}
                  className="w-full h-[280px] object-cover"
                />
              ) : (
                <div className="w-full h-[280px] flex items-center justify-center bg-gradient-to-r from-blue-100 to-blue-200">
                  <span className="text-lg text-blue-500 font-medium">
                    {selectedLesson?.title || classroomDetails.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right - Details */}
          <div className="w-full md:w-2/3 flex flex-col md:pl-4 md:pr-6 py-5 h-full">
            {/* Course code and title */}
            <div className="flex flex-col md:flex-row justify-between">
              <div>
                <div className="text-sm font-bold text-blue-600 mb-1">
                  {classroomDetails.shortCode}
                </div>
                <div className="flex items-center gap-2">
                  <Header type="h1" fontSize="2xl" weight="bold" className="text-gray-800">
                    {classroomDetails.name}
                  </Header>
                </div>
              </div>

              {/* Teacher */}
              <div className="mt-2 md:mt-0">
                <div className="text-sm font-semibold text-gray-800">
                  Teacher:{' '}
                  {classroomDetails.teacher?.firstName && classroomDetails.teacher?.lastName
                    ? `${classroomDetails.teacher.firstName} ${classroomDetails.teacher.lastName}`
                    : classroomDetails.teacher?.name || 'N/A'}
                </div>
                <div className="font-medium">{classroomDetails.teacherName}</div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-3">
              <p className="text-gray-700">{classroomDetails.description}</p>
            </div>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-4 divide-x divide-gray-300 text-center">
              <div className="stat-counter px-4">
                <div className="text-2xl font-bold">{lessons.length}</div>
                <div className="text-sm text-gray-500">Lessons</div>
              </div>
              <div className="stat-counter px-4">
                <div className="text-2xl font-bold">{activities.length}</div>
                <div className="text-sm text-gray-500">Activities</div>
              </div>
              <div className="stat-counter px-4">
                <div className="text-2xl font-bold text-green-500">
                  {quizStats.passedQuizzes}
                </div>
                <div className="text-sm text-gray-500">Passed</div>
              </div>
              <div className="stat-counter px-4">
                <div className="text-2xl font-bold text-orange-500">
                  {quizStats.notTakenQuizzes}
                </div>
                <div className="text-sm text-gray-500">Incomplete</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="my-10">
          <hr className="border-gray-300" />
          
          <div className="flex flex-col items-center justify-center py-4">
            <div className="tabs-nav flex items-center">
              <button
                onClick={() => handleTabChange("lessons")}
                className="px-4 py-2 mr-2 text-gray-500 hover:text-gray-800"
              >
                <span
                  className={`${
                    activeTab === "lessons"
                      ? "font-semibold border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Lessons
                </span>
              </button>

              <div className="border-l border-gray-300 h-6 mx-2" />
            
              <button
                onClick={() => handleTabChange("activities")}
                className="px-4 py-2 text-gray-500 hover:text-gray-800"
              >
                <span
                  className={`${
                    activeTab === "activities"
                      ? "font-semibold border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Activities
                </span>
              </button>


              <div className="border-l border-gray-300 h-6 mx-2" />
              <button
                onClick={() => handleTabChange("leaderboard")}
                className="px-4 py-2 text-gray-500 hover:text-gray-800"
              >
                <span
                  className={`${
                    activeTab === "leaderboard"
                      ? "font-semibold border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Leaderboard
                </span>
              </button>
            </div>
          </div>

          <hr className="border-gray-300" />
        </div>

        {/* Tab Contents */}
        <div className="mt-6">
          {activeTab === "lessons" && (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left Side - Sidebar */}
              <div className="w-full md:w-1/3 bg-[#60B5FF] rounded-tl-3xl rounded-bl-3xl overflow-hidden p-5">
                <LessonSidebar
                  lessons={lessons}
                  currentLessonId={currentLessonId}
                  onSelectLesson={handleSelectLesson}
                  isStudent={true}
                  unlockedLessons={unlockedLessons}
                />
              </div>

              {/* Right Side - Lesson Content */}
              <div className="w-full md:w-2/3 bg-[#60B5FF]/20 rounded-lg shadow h-[calc(85vh)] flex flex-col">
                {loading && currentLessonId && !selectedLesson ? (
                  <main className="lesson-detail-placeholder p-6 rounded-md min-h-[300px] flex items-center justify-center shadow h-full">
                    <p className="text-gray-500 text-lg">Loading lesson details...</p>
                  </main>
                ) : selectedLesson ? (
                  <div className="flex flex-col h-full">
                    {/* Fixed Title Section */}
                    <div className="p-5 border-b border-gray-100">
                      <Header
                        type="h2"
                        weight="bold"
                        size="3xl"
                        className="!text-4xl text-black"
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
        </div>
      </div>
    </div>
  );
};

export default StudentClassroomPage; 

