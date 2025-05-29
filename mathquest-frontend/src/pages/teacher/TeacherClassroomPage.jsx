import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import classroomService from "../../services/classroomService";
import lessonService from "../../services/lessonService";
import quizService from '../../services/quizService';
import LessonSidebar from "../../components/lessons/LessonSidebar";
import AddLessonModal from "../../components/teacher/AddLessonModal";
import EditLessonModal from "../../components/teacher/EditLessonModal";
import EditClassroomModal from "../../components/teacher/EditClassroomModal";
import AddGameActivityModal from "../../components/teacher/AddGameActivityModal";
import ClassRecordManager from "./ClassRecordManager"
import AddQuizModal from "../../components/teacher/AddQuizModal";
import QuizManager from "../../components/teacher/QuizManager";
import { Header } from '../../ui/heading';
import { AiOutlinePlusCircle } from "react-icons/ai";
import ContentBlockDisplay from "../../components/lessons/ContentBlockDisplay";
import ActivityManager from "../../components/teacher/ActivityManager";
import { MdEdit } from "react-icons/md";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import activityService from "../../services/activityService";
import { Button } from "../../ui/button";

const TeacherClassroomPage = () => {
  const { classroomId, lessonId: initialLessonId } = useParams();
  const [classroomDetails, setClassroomDetails] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("lessons");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [isEditClassroomModalOpen, setIsEditClassroomModalOpen] = useState(false);
  const [isEditLessonModalOpen, setIsEditLessonModalOpen] = useState(false);
  const [isAddQuizModalOpen, setIsAddQuizModalOpen] = useState(false);
  const [studentCounts, setStudentCounts] = useState({});
  const [totalStudents, setTotalStudents] = useState(0);
  const [activityRefreshTrigger, setActivityRefreshTrigger] = useState(0);
  const [activitiesCount, setActivitiesCount] = useState(0);
  const [quizzes, setQuizzes] = useState([]);
  const [activities, setActivities] = useState([]);
  const { user } = useAuth();

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

        // Set initial lesson ID from URL parameter or first lesson
        let lessonToLoadId = initialLessonId;
        if (!lessonToLoadId && lessonsList && lessonsList.length > 0) {
          lessonToLoadId = lessonsList[0].id;
        }
        setCurrentLessonId(lessonToLoadId);

        const counts = {};
        lessonsList.forEach(lesson => {
          counts[lesson.id] = lesson.students ? lesson.students.length : 0;
        });
        setStudentCounts(counts);

        // Get total student count for the classroom
        const studentsCount = await classroomService.getStudentCountInClassroom(classroomId);
        setTotalStudents(studentsCount);
      } catch (err) {
        console.error("Error fetching classroom data:", err);
        setError("Failed to load classroom data.");
        setClassroomDetails(null);
        setLessons([]);
      }
    };

    fetchData();
  }, [classroomId, initialLessonId]);
  
  useEffect(() => {
    const fetchActivities = async () => {
      const activitiesList = await activityService.getActivitiesByClassroom(classroomId);
      if (activitiesList) {
        setActivities(activitiesList);
      }
    };
    fetchActivities();
  }, [classroomId]);

  useEffect(() => {
    const fetchLessonDetails = async () => {
      if (!currentLessonId) {
        setSelectedLesson(null);
        if (lessons.length === 0 && classroomDetails) {
          setLoading(false);
        }
        return;
      }
      try {
        if (!loading) setLoading(true);
        const lessonData = await lessonService.getLessonById(currentLessonId);
        setSelectedLesson(lessonData);
        
        // Update activities count when lesson changes or activities are added/removed
        if (lessonData && lessonData.activities) {
          setActivitiesCount(lessonData.activities.length);
        } else {
          setActivitiesCount(0);
        }
      } catch (err) {
        console.error(`Error fetching lesson ${currentLessonId}:`, err);
        setError(`Failed to load lesson: ${err.message}`);
        setSelectedLesson(null);
      } finally {
        if (currentLessonId || (lessons.length === 0 && classroomDetails)) {
          setLoading(false);
        }
      }
    };

    if (classroomDetails) {
      fetchLessonDetails();
    }
  }, [currentLessonId, classroomDetails, activityRefreshTrigger]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (classroomId) {
        try {
          const quizData = await quizService.getQuizzesByClassroom(classroomId);
          setQuizzes(quizData);
        } catch (err) {
          console.error("Error fetching quizzes:", err);
        }
      }
    };

    fetchQuizzes();
  }, [classroomId]);

  const handleSelectLesson = (lessonId) => {
    setCurrentLessonId(lessonId);
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleOpenAddActivityModal = () => {
    setIsAddActivityModalOpen(true);
  };

  const handleCloseAddActivityModal = () => {
    setIsAddActivityModalOpen(false);
  };

  const handleOpenEditClassroomModal = () => {
    setIsEditClassroomModalOpen(true);
  };

  const handleCloseEditClassroomModal = () => {
    setIsEditClassroomModalOpen(false);
  };

  const handleOpenEditLessonModal = () => {
    if (!selectedLesson) {
      setError("Please select a lesson first to edit.");
      return;
    }
    setIsEditLessonModalOpen(true);
  };

  const handleCloseEditLessonModal = () => {
    setIsEditLessonModalOpen(false);
  };

  const handleLessonAdded = async (newLesson) => {
    // Refresh the lessons list after adding a new lesson
    try {
      const updatedLessons = await lessonService.getLessonsByClassroomId(classroomId);
      setLessons(updatedLessons);
      setCurrentLessonId(newLesson.id);
    } catch (err) {
      console.error("Error refreshing lessons:", err);
    }
  };

  const handleClassroomUpdated = async (updatedClassroom) => {
    // Refresh the classroom details
    try {
      setClassroomDetails(updatedClassroom);
    } catch (err) {
      console.error("Error updating classroom details:", err);
    }
  };

  const handleLessonUpdated = async (updatedLesson) => {
    // Refresh the selected lesson and lessons list
    try {
      const updatedLessons = await lessonService.getLessonsByClassroomId(classroomId);
      setLessons(updatedLessons);
      if (updatedLesson.id === currentLessonId) {
        setSelectedLesson(updatedLesson);
      }
    } catch (err) {
      console.error("Error refreshing lesson data:", err);
    }
  };

  const handleActivityCreated = async (newActivity) => {
    // Increment the refresh trigger to force a refresh of activities
    setActivityRefreshTrigger(prev => prev + 1);
    
    // Refresh the selected lesson to show the new activity
    if (currentLessonId) {
      try {
        const lessonData = await lessonService.getLessonById(currentLessonId);
        setSelectedLesson(lessonData);
        if (lessonData && lessonData.activities) {
          setActivitiesCount(lessonData.activities.length);
        }
      } catch (err) {
        console.error("Error refreshing lesson data:", err);
      }
    }
  };

  const handleOpenAddQuizModal = () => {
    // if (!selectedLesson) {
    //   setError("Please select a lesson first to add a quiz.");
    //   return;
    // }
    setIsAddQuizModalOpen(true);
  };

  const handleCloseAddQuizModal = () => {
    setIsAddQuizModalOpen(false);
  };

  const handleQuizCreated = async (quizPayload) => {
    try {
      console.log('Quiz created successfully:', quizPayload);

      // Close the modal
      setIsAddQuizModalOpen(false);

      // Show success message
      toast.success('Quiz created successfully!');

      // Trigger a refresh by incrementing the refreshTrigger
      setActivityRefreshTrigger(prev => prev + 1);

      // Refresh the lesson data to show updated activities
      // if (currentLessonId) {
      //   const updatedLesson = await lessonService.getLessonById(currentLessonId);
      //   setSelectedLesson(updatedLesson);
      // }
      
      // Refresh quizzes
      const quizData = await quizService.getQuizzesByClassroom(classroomId);
      setQuizzes(quizData);
    } catch (err) {
      console.error('Error updating after quiz creation:', err);
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
                <button 
                  onClick={handleOpenEditClassroomModal}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Edit classroom details"
                >
                  <MdEdit className="w-5 h-5" />
                </button>
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
            <div className="text-2xl font-bold ">
              {totalStudents}
            </div>
            <div className="text-sm text-gray-500">Students</div>
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
            onClick={() => handleTabChange("class-record")}
           className="px-4 py-2 text-gray-500 hover:text-gray-800"
         >
           <span
             className={`${
               activeTab === "class-record"
                 ? "font-semibold border-b-2 border-blue-600 text-blue-600"
                 : "text-gray-500 hover:text-gray-800"
             }`}
           >
             Class Record
           </span>
         </button>
          </div>
        </div>

        <hr className="border-gray-300" />
    </div>


    {/* Tab Contents */}
    <div className="mt-6 ">
       <div className="flex justify-end my-5 gap-2">
        {activeTab === "activities" && (
          <>
            <button
              onClick={handleOpenAddQuizModal}
              className="px-4 py-2 font-bold text-secondary flex items-center gap-2 h-10"
            >
              <AiOutlinePlusCircle className="w-5 h-5" />
              Add Quiz
            </button>
            <button
              onClick={handleOpenAddActivityModal}
              className="px-4 py-2 font-bold text-secondary flex items-center gap-2 h-10"
            >
              <AiOutlinePlusCircle className="w-5 h-5" />
              Add Game
            </button>
          </>
        )}
        {activeTab === "lessons" && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 font-bold text-secondary flex items-center gap-2 h-10"
          >
            <AiOutlinePlusCircle className="w-5 h-5" />
            Add Lesson
          </button>
        )}
      </div>
      {activeTab === "lessons" && (
        
        <div className="flex flex-col md:flex-row gap-6">


          {/* Left Side - Sidebar */}
          <div className="w-full md:w-1/3 bg-[#60B5FF] rounded-tl-3xl rounded-bl-3xl overflow-hidden p-5">
            <LessonSidebar
              lessons={lessons}
              currentLessonId={currentLessonId}
              onSelectLesson={handleSelectLesson}
            />
          </div>



          {/* Right Side - Lesson Content */}
          <div className="w-full md:w-2/3 bg-[#60B5FF]/20 rounded-lg shadow h-[calc(100vh-300px)] flex flex-col">
            {!lessons || lessons.length === 0 ? (
              <main className="lesson-detail-placeholder p-6 bg-gray-50 rounded-md min-h-[300px] flex items-center justify-center shadow h-full">
                <div className="text-center">
                  <Header
                    type="h1"
                    weight="bold"
                    size="3xl"
                    className="!text-4xl text-gray-800 mb-4"
                  >
                    Add New Lesson
                  </Header>
                  <p className="text-gray-500 text-lg mb-4">This classroom currently has no lessons.</p>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex items-center gap-2 h-10"
                    onClick={handleOpenAddModal}
                  >
                    Add Your First Lesson
                  </Button>
                </div>
              </main>
            ) : loading && currentLessonId && !selectedLesson ? (
              <main className="lesson-detail-placeholder p-6 rounded-md min-h-[300px] flex items-center justify-center shadow h-full">
                <p className="text-gray-500 text-lg">Loading lesson details...</p>
              </main>
            ) : selectedLesson ? (
              <div className="flex flex-col h-full">
                {/* Fixed Title Section */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <Header
                      type="h2"
                      weight="bold"
                      size="3xl"
                      className="!text-4xl text-black"
                    >{selectedLesson.title}</Header>
                    <button 
                      onClick={handleOpenEditLessonModal}
                      className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                      title="Edit lesson details"
                    >
                      <MdEdit className="w-6 h-6" />
                    </button>
                  </div>
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
                      <button
                        onClick={handleOpenAddModal}
                        className="mt-4 px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                      >
                        Add Content Block
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <main className="lesson-detail-placeholder p-6 bg-gray-50 rounded-md min-h-[300px] flex items-center justify-center shadow h-full">
                <p className="text-gray-500 text-lg">Please select a lesson to view its details.</p>
              </main>
            )}
          </div>
        </div>
      )}

      {activeTab === "activities" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {/* <h2 className="text-2xl font-semibold text-gray-700">Quizzes</h2> */}
              {/* <button
                onClick={handleOpenAddQuizModal}
                className="px-4 py-2 font-bold text-secondary flex items-center gap-2 h-10"
              >
                <AiOutlinePlusCircle className="w-5 h-5" />
                Add Quiz
              </button> */}
            </div>
            <QuizManager classroomId={classroomId} refreshTrigger={activityRefreshTrigger} />
          </div>

          {/* <h2 className="text-2xl font-semibold mb-4 text-gray-700">Game Activities</h2> */}
          <ActivityManager 
            classroomId={classroomId} 
            refreshTrigger={activityRefreshTrigger}
          />
        </div>
      )}
       {activeTab === "class-record" && (
        <ClassRecordManager 
          classroomId={classroomId}
          teacherId={user?.id}
        />
      )}
    </div>

      
      {/* Add Lesson/Quiz Modal */}
      <AddLessonModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        classroomId={classroomId}
        onLessonAdded={handleLessonAdded}
      />
      
      {/* Edit Classroom Modal */}
      <EditClassroomModal
        isOpen={isEditClassroomModalOpen}
        onClose={handleCloseEditClassroomModal}
        classroom={classroomDetails}
        onClassroomUpdated={handleClassroomUpdated}
      />
      
      {/* Edit Lesson Modal */}
      <EditLessonModal
        isOpen={isEditLessonModalOpen}
        onClose={handleCloseEditLessonModal}
        lesson={selectedLesson}
        classroomId={classroomId}
        onLessonUpdated={handleLessonUpdated}
      />
      
      {/* Add Game Activity Modal */}
      <AddGameActivityModal
        isOpen={isAddActivityModalOpen}
        onClose={handleCloseAddActivityModal}
        classroomId={classroomId}
        onActivityCreated={handleActivityCreated}
      />

      {/* Add the Quiz Modal */}
       {/* Add the Quiz Modal */}
       <AddQuizModal
        isOpen={isAddQuizModalOpen}
        onClose={handleCloseAddQuizModal}
        classroomId={classroomId}
        onQuizCreated={handleQuizCreated}
      />
      </div>
    </div>
  );
};

export default TeacherClassroomPage; 