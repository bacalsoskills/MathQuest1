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
import { BookOpen, CheckCircle } from "lucide-react";
import QuizDisplay from "../../components/quiz/QuizDisplay";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { CiSearch } from "react-icons/ci";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import Modal from "../../ui/modal";

const TeacherClassroomPage = () => {
  const { classroomId, lessonId: initialLessonId } = useParams();
  const [classroomDetails, setClassroomDetails] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
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
  const [stats, setStats] = useState(null);
  const [studentsWhoRead, setStudentsWhoRead] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState(null);
  const [lastFetchedLessonId, setLastFetchedLessonId] = useState(null);
  const [quizDataMap, setQuizDataMap] = useState({});

  // Students tab state
  const [classroomStudents, setClassroomStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [enrolledStudentsSearchTerm, setEnrolledStudentsSearchTerm] = useState('');

  // Handle URL hash changes to automatically switch tabs
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const tabName = hash.replace('#', '');
        // Map hash values to tab names
        const tabMapping = {
          'class-record-tab': 'class-record',
          'lessons-tab': 'lessons',
          'activities-tab': 'activities',
          'students-tab': 'students'
        };
        
        if (tabMapping[tabName]) {
          setActiveTab(tabMapping[tabName]);
        }
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
        
        // Fetch lessons separately using the dedicated lessons endpoint
        const lessonsList = await lessonService.getLessonsByClassroomId(classroomId);
        setLessons(lessonsList);

        // Set initial lesson ID from URL parameter or last lesson
        let lessonToLoadId = initialLessonId;
        if (!lessonToLoadId && lessonsList && lessonsList.length > 0) {
          lessonToLoadId = lessonsList[lessonsList.length - 1].id;
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

  // Fetch students when students tab is active
  useEffect(() => {
    if (activeTab === "students" && classroomId) {
      fetchClassroomStudents();
    }
  }, [activeTab, classroomId]);

  const fetchClassroomStudents = async () => {
    try {
      setLoadingStudents(true);
      const students = await classroomService.getStudentsInClassroom(classroomId);
      setClassroomStudents(students);
    } catch (err) {
      console.error('Fetch students error:', err);
      setError(`Failed to load students for ${classroomDetails?.name || 'classroom'}`);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSearchStudents = async (searchTerm) => {
    if (!classroomId || !searchTerm.trim()) {
      setStudentSearchResults([]);
      return;
    }
    
    setSearchingStudents(true);
    try {
      // Search for students using the backend API
      const results = await classroomService.searchStudents(searchTerm, classroomId);
      
      // Additional client-side filtering for better search results
      const filteredResults = results.filter(student => {
        const searchLower = searchTerm.toLowerCase();
        const firstName = (student.firstName || '').toLowerCase();
        const lastName = (student.lastName || '').toLowerCase();
        const username = (student.username || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        
        return (
          firstName.includes(searchLower) ||
          lastName.includes(searchLower) ||
          username.includes(searchLower) ||
          fullName.includes(searchLower)
        );
      });
      
      setStudentSearchResults(filteredResults);
      setError('');
    } catch (err) {
      console.error('Search students error:', err);
      setError(err.message || 'Failed to search for students');
      setStudentSearchResults([]);
    } finally {
      setSearchingStudents(false);
    }
  };

  // Helper function to safely render avatar
  const renderStudentAvatar = (student) => {
    if (student.profileImage) {
      // Check if the profile image is already a complete URL
      if (student.profileImage.startsWith('http')) {
        return (
          <AvatarImage
            src={student.profileImage}
            alt={`${student.firstName} ${student.lastName}`}
          />
        );
      }
      // Check if it's a base64 string
      if (student.profileImage.startsWith('data:')) {
        return (
          <AvatarImage
            src={student.profileImage}
            alt={`${student.firstName} ${student.lastName}`}
          />
        );
      }
      // Assume it's a base64 string without the data URL prefix
      return (
        <AvatarImage
          src={`data:image/jpeg;base64,${student.profileImage}`}
          alt={`${student.firstName} ${student.lastName}`}
        />
      );
    }
    
    // Fallback to initials
    const initials = `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase();
    return (
      <AvatarFallback className="bg-blue-500 text-white">
        {initials || '?'}
      </AvatarFallback>
    );
  };

  // Helper function to filter enrolled students
  const getFilteredEnrolledStudents = () => {
    if (!enrolledStudentsSearchTerm.trim()) {
      return classroomStudents;
    }
    
    const searchLower = enrolledStudentsSearchTerm.toLowerCase();
    return classroomStudents.filter(student => {
      const firstName = (student.firstName || '').toLowerCase();
      const lastName = (student.lastName || '').toLowerCase();
      const username = (student.username || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`.toLowerCase();
      
      return (
        firstName.includes(searchLower) ||
        lastName.includes(searchLower) ||
        username.includes(searchLower) ||
        fullName.includes(searchLower)
      );
    });
  };

  const handleAddStudent = async (studentId) => {
    if (!studentId || !classroomId) return;
    
    // Find the student in the search results
    const studentToAdd = studentSearchResults.find(s => s.id === studentId);
    if (!studentToAdd || studentToAdd.inClassroom) return;
    
    // Optimistically update UI
    setStudentSearchResults(prevResults => 
      prevResults.map(student => 
        student.id === studentId 
          ? { ...student, inClassroom: true, isAdding: true } 
          : student
      )
    );
    
    try {
      await classroomService.addStudentToClassroom(classroomId, studentId);
      
      // Update the student search results to mark this student as in the classroom
      setStudentSearchResults(prevResults => 
        prevResults.map(student => 
          student.id === studentId 
            ? { ...student, inClassroom: true, isAdding: false } 
            : student
        )
      );
      
      // Refresh the classroom students list
      await fetchClassroomStudents();
      
      // Update total student count
      const newCount = await classroomService.getStudentCountInClassroom(classroomId);
      setTotalStudents(newCount);
      
      setError('');
      toast.success('Student added successfully');
    } catch (err) {
      console.error('Add student error:', err);
      setError(err.message || 'Failed to add student to classroom');
      toast.error(err.message || 'Failed to add student to classroom');
      
      // Revert the optimistic update
      setStudentSearchResults(prevResults => 
        prevResults.map(student => 
          student.id === studentId 
            ? { ...student, inClassroom: false, isAdding: false } 
            : student
        )
      );
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!classroomId) return;
 
    if (!window.confirm('Are you sure you want to remove this student from the classroom?')) {
      return;
    }
    
    try {
      await classroomService.removeStudentFromClassroom(classroomId, studentId);
      setClassroomStudents(prevStudents => prevStudents.filter(s => s.id !== studentId));
      
      // Update total student count
      const newCount = await classroomService.getStudentCountInClassroom(classroomId);
      setTotalStudents(newCount);
      
      toast.success('Student removed successfully');
    } catch (err) {
      console.error('Remove student error:', err);
      setError(err.message || 'Failed to remove student from classroom');
      toast.error(err.message || 'Failed to remove student from classroom');
    }
  };

  // Debounce student search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (studentSearchTerm) {
        handleSearchStudents(studentSearchTerm);
      } else {
        setStudentSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [studentSearchTerm, classroomId]);

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
        setLessonLoading(true);
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
        setLessonLoading(false);
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

  useEffect(() => {
    if (!selectedLesson?.id || loadingStats || lastFetchedLessonId === selectedLesson.id) {
      return;
    }

    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        setStatsError(null);
        
        // Fetch completion stats for teachers
        const statsData = await lessonService.getLessonCompletionStats(selectedLesson.id);
        setStats(statsData);
        setLastFetchedLessonId(selectedLesson.id);

        // Fetch students who read the lesson
        if (statsData.studentsRead > 0) {
          const students = await lessonService.getStudentsWhoReadLesson(selectedLesson.id);
          setStudentsWhoRead(students);
        } else {
          setStudentsWhoRead([]);
        }
      } catch (err) {
      
        setStatsError(err.message || 'Failed to fetch lesson statistics');
        setStats(null);
        setStudentsWhoRead([]);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [selectedLesson?.id, loadingStats, lastFetchedLessonId]);

  // Add effect to fetch quiz data when lesson changes
  useEffect(() => {
    if (!selectedLesson?.activities) return;

    const quizActivities = selectedLesson.activities.filter(activity => activity?.type === 'QUIZ' && activity?.id);
    
    if (quizActivities.length > 0) {
      // For each quiz activity, fetch the quiz details
      quizActivities.forEach(activity => {
        // Skip if we already have the quiz data
        if (quizDataMap[activity.id]) return;

        quizService.getQuizByActivityId(activity.id)
          .then(quizData => {
            setQuizDataMap(prev => ({
              ...prev,
              [activity.id]: quizData
            }));
          })
          .catch(err => {
            console.error(`[TeacherClassroomPage] Error fetching quiz for activity ${activity.id}:`, err);
          });
      });
    }
  }, [selectedLesson?.id, selectedLesson?.activities, quizDataMap]);

  useEffect(() => {
    if (studentsWhoRead.length > 0) {
      studentsWhoRead.slice(-4).forEach(student => {
        const imgHash = student.profileImage ? student.profileImage.substring(0, 16) : 'NO_IMAGE';
      
      });
    }
  }, [studentsWhoRead]);

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
      // Close the modal
      setIsAddQuizModalOpen(false);

      // Show success message
      toast.success('Quiz created successfully!');

      // Trigger a refresh by incrementing the refreshTrigger
      setActivityRefreshTrigger(prev => prev + 1);
      
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
                <div className="text-2xl font-bold dark:text-gray-100">
                  {totalStudents}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-100">Students</div>
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
                className="md:px-4 py-2 mr-1 md:mr-2 text-gray-500 hover:text-gray-800 "
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
                className="md:px-4 py-2 mr-1 md:mr-2 text-gray-500 hover:text-gray-800 "
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
                onClick={() => handleTabChange("class-record")}
                className="md:px-4 py-2 mr-1 md:mr-2 text-gray-500 hover:text-gray-800 "
                id="class-record-tab"
              >
                <span
                  className={`${
                    activeTab === "class-record"
                      ? "font-semibold border-b-2 border-blue-600 text-blue-600 "
                      : "text-gray-500 hover:text-gray-800 dark:!text-gray-100  dark:hover:!text-gray-100/50"
                  }`}
                >
                  Class Record
                </span>
              </button>

              <div className="border-l border-gray-300 h-6 mx-2" />
              <button
                onClick={() => handleTabChange("students")}
                className="md:px-4 py-2 mr-1 md:mr-2 text-gray-500 hover:text-gray-800 "
                id="students-tab"
              >
                <span
                  className={`${
                    activeTab === "students"
                      ? "font-semibold border-b-2 border-blue-600 text-blue-600 "
                      : "text-gray-500 hover:text-gray-800 dark:!text-gray-100  dark:hover:!text-gray-100/50"
                  }`}
                >
                  Students
                </span>
              </button>
            </div>
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-[#18C8FF] via-[#4B8CFF] to-[#6D6DFF] "></div>
        </div>

        {/* Tab Contents */}
        <div className="mt-6 tab-content-section">
          <div className="flex justify-end my-5 gap-2">
            {activeTab === "activities" && (
              <>
                <button
                  onClick={handleOpenAddQuizModal}
                   className="dark:text-blue-300 text-secondary font-semibold flex items-center gap-2 h-10 order-1 sm:order-2"
                >
                  <AiOutlinePlusCircle className="w-5 h-5" />
                  Add Quiz
                </button>
                <button
                  onClick={handleOpenAddActivityModal}
                 className="dark:text-blue-300 text-secondary font-semibold flex items-center gap-2 h-10 order-1 sm:order-2"
                >
                  <AiOutlinePlusCircle className="w-5 h-5" />
                  Add Game
                </button>
              </>
            )}
            {activeTab === "lessons" && (
              <button
                onClick={handleOpenAddModal}
                className="dark:text-blue-300 text-secondary font-semibold flex items-center gap-2 h-10 order-1 sm:order-2"
              >
                <AiOutlinePlusCircle className="w-5 h-5" />
                Add Lesson
              </button>
            )}
            {activeTab === "students" && (
              <button
                onClick={() => setIsAddStudentModalOpen(true)}
                className="dark:text-blue-300 text-secondary font-semibold flex items-center gap-2 h-10 order-1 sm:order-2"
              >
                <AiOutlinePlusCircle className="w-5 h-5" />
                Add Student
              </button>
            )}
          </div>

          {activeTab === "lessons" && (
            <div className="flex flex-col md:flex-row gap-6">
              
              <div className="w-full md:w-1/3 bg-[#60B5FF] rounded-tl-3xl rounded-bl-3xl overflow-hidden p-5">
                <LessonSidebar
                  lessons={lessons}
                  currentLessonId={currentLessonId}
                  onSelectLesson={handleSelectLesson}
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
                        rounded="full"
                        className="flex items-center gap-2 h-10"
                        onClick={handleOpenAddModal}
                      >
                        Add Your First Lesson
                      </Button>
                    </div>
                  </main>
                ) : loading && currentLessonId && !selectedLesson ? (
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
                      <div className="flex justify-between items-center">
                        <Header
                          type="h2"
                          weight="bold"
                          className="!text-4xl text-primary "
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
                      {stats && (
                        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1" title={`Students who read the content`}>
                                <BookOpen className="w-4 h-4" />
                                <span>{stats.studentsRead} / {stats.totalStudents} Read</span>
                              </div>
                              {/* Only show quiz completion if there's a quiz in the lesson */}
                              {selectedLesson.activities?.some(activity => activity?.type === 'QUIZ') && (
                                <div className="flex items-center gap-1" title={`Students who completed the quiz`}>
                                  <CheckCircle className="w-4 h-4" />
                                  <span>{stats.studentsCompletedQuiz} / {stats.totalStudents} Completed Quiz</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Content Blocks */}
                      {selectedLesson.contentBlocks?.length > 0 ? (
                        <div className="content-blocks space-y-8">
                          {selectedLesson.contentBlocks.map((block) => (
                            <div key={block.id} className="content-block">
                              <ContentBlockDisplay block={block} />
                            </div>
                          ))}

                          {/* Quiz Section */}
                          {selectedLesson.activities?.filter(activity => activity?.type === 'QUIZ' && activity?.id)?.length > 0 && (
                            <div className="mt-8">
                              <div className="quiz-section">
                                <Header type="h3" weight="semibold" className="mb-4">
                                  Lesson Quiz
                                </Header>
                                {selectedLesson.activities
                                  .filter(activity => activity?.type === 'QUIZ' && activity?.id)
                                  .map(activity => {
                                    const quizData = quizDataMap[activity.id];
                                    return (
                                      <div key={activity.id} className="mb-6 p-4 bg-white rounded-lg shadow">
                                        <h4 className="text-lg font-semibold mb-2">{activity.title || quizData?.quizName || 'Quiz'}</h4>
                                        <p className="text-gray-600 mb-4">{activity.description || quizData?.description}</p>
                                        
                                        {/* Quiz Details */}
                                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                          <div>
                                            <span className="font-medium">Time Limit:</span> {quizData?.timeLimitMinutes || 0} minutes
                                          </div>
                                          <div>
                                            <span className="font-medium">Quiz Type:</span> {quizData?.quizType || 'Standard'}
                                          </div>
                                          <div>
                                            <span className="font-medium">Passing Score:</span> {quizData?.passingScore || 0}/{quizData?.overallScore || 0}
                                          </div>
                                          <div>
                                            <span className="font-medium">Max Attempts:</span> {quizData?.maxAttempts || '1'}
                                          </div>
                                          <div>
                                            <span className="font-medium">Available From:</span> {quizData?.availableFrom ? new Date(quizData.availableFrom).toLocaleString() : 'Not set'}
                                          </div>
                                          <div>
                                            <span className="font-medium">Available To:</span> {quizData?.availableTo ? new Date(quizData.availableTo).toLocaleString() : 'Not set'}
                                          </div>
                                          {quizData?.attempts && (
                                            <div>
                                              <span className="font-medium">Total Attempts:</span> {quizData.attempts.length || 0}
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* Quiz Status */}
                                        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-100">
                                          <p className="font-medium text-blue-700">Quiz Status:</p>
                                          <p className="text-blue-600">
                                            {stats?.studentsCompletedQuiz || 0} out of {stats?.totalStudents || 0} students have completed this quiz.
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
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

                    {/* Student Avatars Overlay */}
                    {studentsWhoRead.length > 0 && (
                      (() => {
                        return (
                          <div
                            style={{
                              position: "absolute",
                              bottom: 24,
                              right: 24,
                              display: "flex",
                              alignItems: "center",
                              zIndex: 10,
                              background: "white",
                              borderRadius: "9999px",
                              padding: "4px 8px",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                            }}
                          >
                            {studentsWhoRead.length > 4 && (
                              <div
                                style={{
                                  background: "#444950",
                                  color: "#fff",
                                  borderRadius: "9999px",
                                  padding: "2px 8px",
                                  fontSize: "14px",
                                  fontWeight: 500,
                                  marginRight: "4px"
                                }}
                              >
                                +{studentsWhoRead.length - 4}
                              </div>
                            )}
                            {studentsWhoRead.slice(-4).map((student) => (
                              <Avatar key={student.id} className="h-8 w-8 border-2 border-[#23272f] -ml-2 first:ml-0">
                                {renderStudentAvatar(student)}
                              </Avatar>
                            ))}
                          </div>
                        );
                      })()
                    )}
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
                <QuizManager classroomId={classroomId} refreshTrigger={activityRefreshTrigger} />
              </div>
              <ActivityManager 
                classroomId={classroomId} 
                refreshTrigger={activityRefreshTrigger}
              />
            </div>
          )}

          {activeTab === "class-record" && (
            <div className="bg-white p-6 rounded-lg shadow">
              <ClassRecordManager 
                classroomId={classroomId}
                teacherId={user?.id}
              />
            </div>
          )}

          {activeTab === "students" && (
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="mb-6">
                <Header type="h2" fontSize="2xl" weight="bold" className="text-gray-800 mb-2">
                  Enrolled Students ({classroomStudents.length})
                </Header>
                <p className="text-gray-600 mb-4">Manage students enrolled in this classroom</p>
                
                {/* Search box for enrolled students */}
                <div className="relative max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CiSearch className="text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search enrolled students..."
                    className="pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={enrolledStudentsSearchTerm}
                    onChange={(e) => setEnrolledStudentsSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {loadingStudents ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                </div>
              ) : classroomStudents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No students enrolled in this classroom yet.</p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setIsAddStudentModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <AiOutlinePlusCircle className="w-4 h-4" />
                    Add First Student
                  </Button>
                </div>
              ) : getFilteredEnrolledStudents().length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No students found matching '{enrolledStudentsSearchTerm}' <span className="underline text-blue-500" onClick={() => setEnrolledStudentsSearchTerm('')}>clear search</span></p>
                  {/* <Button
                    variant="link"
                    size="sm"
                    onClick={() => setEnrolledStudentsSearchTerm('')}
                    className="flex items-center gap-2"
                  >
                    Clear Search
                  </Button> */}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Username
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredEnrolledStudents().map(student => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {/* <Avatar className="h-10 w-10 mr-3">
                                {renderStudentAvatar(student)}
                              </Avatar> */}
                               <Avatar key={student.id} className="h-10 w-10 mr-3">
                                {renderStudentAvatar(student)}
                              </Avatar>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {student.firstName} {student.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {student.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            @{student.username}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRemoveStudent(student.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
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
       <AddQuizModal
        isOpen={isAddQuizModalOpen}
        onClose={handleCloseAddQuizModal}
        classroomId={classroomId}
        onQuizCreated={handleQuizCreated}
      />

      {/* Add Student Modal */}
      <Modal 
        isOpen={isAddStudentModalOpen} 
        onClose={() => {
          setIsAddStudentModalOpen(false);
          setStudentSearchTerm('');
          setStudentSearchResults([]);
          setError('');
        }}
        title={`Add Student to ${classroomDetails?.name || 'Classroom'}`}
        maxWidth="max-w-lg"
      >
        {error && isAddStudentModalOpen && (
          <div className="text-red-500 mb-3">{error}</div>
        )}
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="studentSearch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search Students
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CiSearch className="text-gray-400 dark:text-gray-300" />
              </div>
              <Input
                type="text"
                id="studentSearch"
                placeholder="Search by first name, last name, or username"
                className="w-full pl-10 pr-3 py-2 border dark:text-gray-300 border-gray-300 dark:border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Search by first name, last name, or username. Results will show students not already in this classroom.
            </p>
          </div>
          
          {searchingStudents ? (
            <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-300">Searching...</div>
          ) : studentSearchTerm && studentSearchResults.length === 0 ? (
            <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-300">No students found matching '{studentSearchTerm}'</div>
          ) : !studentSearchTerm ? (
            <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-300">Type to search for students</div>
          ) : (
            <div className="mt-2 max-h-60 overflow-y-auto">
              {studentSearchResults.map(student => (
                <div 
                  key={student.id} 
                  className={`flex justify-between items-center p-3 border-b border-gray-100 ${
                    !student.inClassroom 
                      ? 'hover:bg-blue-50 cursor-pointer transition-colors duration-150' 
                      : ''
                  }`}
                  onClick={() => !student.inClassroom && handleAddStudent(student.id)}
                >
                  <div className="flex items-center gap-3 flex-grow">
                    <Avatar className="h-8 w-8">
                      {renderStudentAvatar(student)}
                    </Avatar>
                    <div className="flex-grow">
                      <p className="font-medium text-gray-800 dark:text-gray-300">{student.firstName} {student.lastName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-300">@{student.username}</p>
                    </div>
                  </div>
                  {student.inClassroom ? (
                    <span className="text-sm text-green-600 font-medium">Already in classroom</span>
                  ) : student.isAdding ? (
                    <span className="text-sm text-blue-600 font-medium animate-pulse">Adding...</span>
                  ) : (
                    <div className="flex items-center">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation(); 
                          handleAddStudent(student.id);
                        }}
                        variant="default"
                        size="sm"
                        className="text-sm"
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TeacherClassroomPage; 