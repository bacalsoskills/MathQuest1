// import React, { useState, useEffect } from "react";
// import { useParams, useLocation } from "react-router-dom";
// import classroomService from "../../services/classroomService";
// import lessonService from "../../services/lessonService";
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
//                   0
//                 </div>
//                 <div className="text-sm text-gray-500">Passed</div>
//               </div>
//               <div className="stat-counter px-4">
//                 <div className="text-2xl font-bold text-orange-500">0</div>
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
import LessonSidebar from "../../components/lessons/LessonSidebar";
import ContentBlockDisplay from "../../components/lessons/ContentBlockDisplay";
import ClassroomGamesTab from "./ClassroomGamesTab";
import QuizManager from "../../components/teacher/QuizManager";
import Leaderboard from "../../components/leaderboard/Leaderboard";
import { Header } from '../../ui/heading';
import activityService from "../../services/activityService";

const StudentClassroomPage = () => {
  const { classroomId, lessonId: initialLessonId } = useParams();
  const location = useLocation();
  const [classroomDetails, setClassroomDetails] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("lessons");
  const [activities, setActivities] = useState([]);
  const [quizStats, setQuizStats] = useState({ passedQuizzes: 0, notTakenQuizzes: 0 });

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
        
        // Fetch lessons separately using the dedicated lessons endpoint
        const lessonsList = await lessonService.getLessonsByClassroomId(classroomId);
        setLessons(lessonsList);

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
        if (!lessonToLoadId && lessonsList && lessonsList.length > 0) {
          lessonToLoadId = lessonsList[0].id;
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

  const handleSelectLesson = (lessonId) => {
    setCurrentLessonId(lessonId);
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
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
                />
              </div>

              {/* Right Side - Lesson Content */}
              <div className="w-full md:w-2/3 bg-[#60B5FF]/20 rounded-lg shadow h-[calc(100vh-300px)] flex flex-col">
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
                    <div className="flex-1 overflow-y-auto p-5">
                      {selectedLesson.contentBlocks?.length > 0 ? (
                        <div className="content-blocks">
                          {selectedLesson.contentBlocks.map((block) => (
                            <div key={block.id} className="content-block mb-8">
                              <ContentBlockDisplay block={block} />
                            </div>
                          ))}
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