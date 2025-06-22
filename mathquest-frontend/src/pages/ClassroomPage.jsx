import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Assuming you use React Router for params
import classroomService from "../services/classroomService";
import lessonService from "../services/lessonService";
import ClassroomHeader from "../components/classroom/ClassroomHeader";
import ClassroomTabs from "../components/classroom/ClassroomTabs";
import LessonSidebar from "../components/lessons/LessonSidebar";
import LessonDetailView from "../components/lessons/LessonDetailView";

const ClassroomPage = () => {
  const { classroomId, lessonId: initialLessonId } = useParams();
  const [classroomDetails, setClassroomDetails] = useState(null);
  const [lessons, setLessons] = useState([]); 
  const [selectedLesson, setSelectedLesson] = useState(null); 
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false); // Separate loading state for lesson changes
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("lessons"); 

  useEffect(() => {
    const fetchClassroomData = async () => {
      if (!classroomId) return;
      try {
        setLoading(true);
        const details = await classroomService.getClassroomDetails(classroomId);
        setClassroomDetails(details); 
        setLessons(details.lessons || []); 

        // Determine initial lesson to load
        let lessonToLoadId = initialLessonId;
        if (!lessonToLoadId && details.lessons && details.lessons.length > 0) {
          lessonToLoadId = details.lessons[details.lessons.length - 1].id; 
        }
        setCurrentLessonId(lessonToLoadId);
      } catch (err) {
        console.error("Error fetching classroom data:", err);
        setError("Failed to load classroom data.");
        setClassroomDetails(null);
        setLessons([]);
      }
    };

    fetchClassroomData();
  }, [classroomId, initialLessonId]);

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
        setLessonLoading(true);
        const lessonData = await lessonService.getLessonById(currentLessonId);
        setSelectedLesson(lessonData);
      } catch (err) {
        console.error(`Error fetching lesson ${currentLessonId}:`, err);
        setError(`Failed to load lesson: ${err.message}`);
        setSelectedLesson(null);
      } finally {
        setLessonLoading(false);
        if (currentLessonId || (lessons.length === 0 && classroomDetails)) {
          setLoading(false);
        }
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
  
    return   <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
  }

  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }

  if (!classroomDetails) {
    return <div>Classroom not found or failed to load.</div>;
  }

  return (
   
    <div className="classroom-page-container p-4 md:p-6 lg:p-8 bg-white rounded-lg shadow-md mx-auto max-w-7xl">
      <ClassroomHeader
        classroomDetails={classroomDetails}
        lessonsCount={lessons.length}
        // activitiesCount, passedCount, incompleteCount props would be passed here.
        // For example:
        // activitiesCount={classroomDetails?.activityCount || 0}
        // passedCount={classroomDetails?.progress?.passedCount || 0}
        // incompleteCount={classroomDetails?.progress?.incompleteCount || 0}
      />

      {/* Tabs for Lessons and Activities */}
      <div className="mt-6"> 
        <ClassroomTabs activeTab={activeTab} onTabChange={handleTabChange} />
      </div>


      <div className="mt-6"> 
        {activeTab === "lessons" && (
         
          <div className="flex flex-col md:flex-row gap-6"> 
            <div className="w-full md:w-1/3 lg:w-1/4"> 
              <LessonSidebar
                lessons={lessons}
                currentLessonId={currentLessonId}
                onSelectLesson={handleSelectLesson}
          
              />
            </div>
            <div className="w-full md:w-2/3 lg:w-3/4 relative"> {/* Main content width, responsive */}
              {/* Lesson Loading Overlay */}
              {lessonLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 text-sm">Loading lesson...</p>
                  </div>
                </div>
              )}
              
              {loading && currentLessonId && !selectedLesson ? (
                <main
                  className="lesson-detail-placeholder p-6 bg-gray-50 rounded-md min-h-[300px] flex items-center justify-center shadow" 
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 text-lg">Loading lesson details...</p>
                  </div>
                </main>
              ) : selectedLesson ? (
                <LessonDetailView lesson={selectedLesson} />
              ) : lessons.length > 0 && !currentLessonId ? (
                <main
                  className="lesson-detail-placeholder p-6 bg-gray-50 rounded-md min-h-[300px] flex items-center justify-center shadow" 
                >
                  <p className="text-gray-500 text-lg">Please select a lesson to view its details.</p>
                </main>
              ) : (
                 <main
                  className="lesson-detail-placeholder p-6 bg-gray-50 rounded-md min-h-[300px] flex items-center justify-center shadow" 
                >
                  <p className="text-gray-500 text-lg">This classroom currently has no lessons.</p>
                </main>
              )}
            </div>
          </div>
        )}

        {activeTab === "activities" && (
          <div
            className="activities-view-placeholder p-6 bg-gray-50 rounded-md min-h-[300px] shadow"
          >
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Activities Overview</h2>
            <p className="text-gray-600">
              This section will display classroom activities. (Content not yet
              implemented)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomPage;
