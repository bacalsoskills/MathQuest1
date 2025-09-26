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
import { FaSkullCrossbones, FaCompass, FaUsers, FaCoins, FaAnchor, FaMap, FaShip, FaScroll, FaFeatherAlt, FaMapMarkedAlt, FaUserPlus, FaTrash, FaEye } from "react-icons/fa";
import { useTheme } from '../../context/ThemeContext';

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
  
  const { darkMode } = useTheme();

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
      <div 
        className="flex justify-center items-center h-screen"
        style={{
          backgroundImage: darkMode
            ? "linear-gradient(180deg, rgba(2,6,23,1) 0%, rgba(3,7,18,1) 100%)"
            : "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)",
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          <p className={(darkMode ? 'text-yellow-300' : 'text-yellow-800') + ' text-lg font-semibold'}>Hoisting the sails...</p>
        </div>
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
    <div 
      className="relative px-4 sm:px-6 lg:px-8 pt-16 md:pt-0 lg:py-8 min-h-screen"
      style={{
        backgroundImage: darkMode
          ? "linear-gradient(180deg, rgba(2,6,23,1) 0%, rgba(3,7,18,1) 100%)"
          : "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)",
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >

      <div className="max-w-6xl mx-auto">
        {/* Ship Header with pirate theme */}
        <div className={`rounded-2xl shadow-2xl p-6 border-2 backdrop-blur-sm mb-6 ${
          darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
        }`} style={{ boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.08)' }}>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Ship Image */}
            <div className="w-full md:w-1/3">
              <div className={`rounded-2xl overflow-hidden border-2 shadow-lg ${
                darkMode ? 'border-yellow-700/40' : 'border-yellow-300'
              }`}>
                {classroomDetails.image ? (
                  <img
                    src={`data:image/jpeg;base64,${classroomDetails.image}`}
                    alt={classroomDetails.name}
                    className="w-full h-[280px] object-cover"
                  />
                ) : (
                  <div className="w-full h-[280px] flex flex-col items-center justify-center bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 relative">
                    <FaShip className="text-white text-6xl mb-4" />
                    <span className="text-2xl text-white font-bold tracking-wide">
                      {classroomDetails.shortCode}
                    </span>
                    {/* Nautical corner pins */}
                    <div className="absolute top-2 right-2 text-white/70 text-lg">⚓</div>
                    <div className="absolute bottom-2 left-2 text-white/70 text-lg">🧭</div>
                  </div>
                )}
              </div>
            </div>

            {/* Ship Details */}
            <div className="w-full md:w-2/3 flex flex-col">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FaAnchor className={(darkMode ? 'text-yellow-400' : 'text-yellow-600') + ' text-sm'} />
                    <span className={`text-sm font-semibold uppercase tracking-wide ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                      Ship Code: {classroomDetails.shortCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Header type="h1" fontSize="3xl" weight="bold" className={`${darkMode ? 'text-yellow-200' : 'text-gray-900'}`}>
                      {classroomDetails.name}
                    </Header>
                    <button 
                      onClick={handleOpenEditClassroomModal}
                      className={`transition-colors ${darkMode ? 'text-yellow-400 hover:text-yellow-300' : 'text-yellow-600 hover:text-yellow-700'}`}
                      title="Edit ship details"
                    >
                      <MdEdit className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Captain */}
                <div className="mt-2 md:mt-0">
                  <div className={`flex items-center gap-2 text-sm font-medium ${darkMode ? 'text-yellow-200' : 'text-gray-800'}`}>
                    <FaShip className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                    Captain:{' '}
                    {classroomDetails.teacher?.firstName && classroomDetails.teacher?.lastName
                      ? `${classroomDetails.teacher.firstName} ${classroomDetails.teacher.lastName}`
                      : classroomDetails.teacher?.name || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-3">
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{classroomDetails.description}</p>
              </div>

              {/* Ship Stats */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`px-4 py-3 rounded-xl border-2 shadow-sm ${
                  darkMode ? 'bg-[#0f1428]/80 border-yellow-700/40' : 'bg-[#fbf4de] border-yellow-300'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <FaScroll className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                    <div className={`text-2xl font-extrabold ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>{lessons.length}</div>
                  </div>
                  <div className={`mt-1 text-xs tracking-wide text-center ${darkMode ? 'text-yellow-200/90' : 'text-yellow-700/80'}`}>Scrolls</div>
                </div>
                <div className={`px-4 py-3 rounded-xl border-2 shadow-sm ${
                  darkMode ? 'bg-[#0f1428]/80 border-yellow-700/40' : 'bg-[#fbf4de] border-yellow-300'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <FaFeatherAlt className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                    <div className={`text-2xl font-extrabold ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>{activities.length}</div>
                  </div>
                  <div className={`mt-1 text-xs tracking-wide text-center ${darkMode ? 'text-yellow-200/90' : 'text-yellow-700/80'}`}>Quests</div>
                </div>
                <div className={`px-4 py-3 rounded-xl border-2 shadow-sm ${
                  darkMode ? 'bg-[#0f1428]/80 border-yellow-700/40' : 'bg-[#fbf4de] border-yellow-300'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <FaUsers className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                    <div className={`text-2xl font-extrabold ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>{totalStudents}</div>
                  </div>
                  <div className={`mt-1 text-xs tracking-wide text-center ${darkMode ? 'text-yellow-200/90' : 'text-yellow-700/80'}`}>Crew</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation removed in favor of Quick Action Bar */}

        {/* Tab Contents */}
        <div className="mt-6 tab-content-section">
          {/* Captain's Navigation - Pirate themed */}
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 sticky top-16 md:static z-10">
            <button
              onClick={() => handleTabChange("lessons")}
              title="Scrolls (Lessons)"
              aria-label="Go to Scrolls"
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 ${
                darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
              } ${
                activeTab === 'lessons' ? (darkMode ? 'ring-2 ring-yellow-500/50' : 'ring-2 ring-yellow-400') : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <FaScroll className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                <span className={`text-sm font-semibold ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>Scrolls</span>
              </div>
              <span className={darkMode ? 'text-yellow-400' : 'text-yellow-600'}>→</span>
            </button>
            <button
              onClick={() => handleTabChange("activities")}
              title="Quests (Treasure & Games)"
              aria-label="Go to Quests"
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 ${
                darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
              } ${
                activeTab === 'activities' ? (darkMode ? 'ring-2 ring-yellow-500/50' : 'ring-2 ring-yellow-400') : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <FaFeatherAlt className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                <span className={`text-sm font-semibold ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>Quests</span>
              </div>
              <span className={darkMode ? 'text-yellow-400' : 'text-yellow-600'}>→</span>
            </button>
            <button
              onClick={() => handleTabChange("class-record")}
              title="Treasure Log (Coins & Compass)"
              aria-label="Go to Treasure Log"
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 ${
                darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
              } ${
                activeTab === 'class-record' ? (darkMode ? 'ring-2 ring-yellow-500/50' : 'ring-2 ring-yellow-400') : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <FaCoins className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                <span className={`text-sm font-semibold ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>Treasure Log</span>
              </div>
              <span className={darkMode ? 'text-yellow-400' : 'text-yellow-600'}>→</span>
            </button>
            <button
              onClick={() => handleTabChange("students")}
              title="Crew Roster"
              aria-label="Go to Crew"
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 ${
                darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
              } ${
                activeTab === 'students' ? (darkMode ? 'ring-2 ring-yellow-500/50' : 'ring-2 ring-yellow-400') : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <FaUsers className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                <span className={`text-sm font-semibold ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>Crew</span>
              </div>
              <span className={darkMode ? 'text-yellow-400' : 'text-yellow-600'}>→</span>
            </button>
          </div>
          <div className="flex justify-end my-5 gap-2">
            {activeTab === "activities" && (
              <>
                <button
                  onClick={handleOpenAddQuizModal}
                   title="Add Quiz"
                   aria-label="Add Quiz"
                   className={`font-semibold flex items-center gap-2 h-10 px-4 rounded-lg transition-all duration-300 hover:scale-105 ${
                     darkMode 
                       ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                       : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                   }`}
                >
                  <FaCoins className="w-4 h-4" />
                  Add Quiz
                </button>
                <button
                  onClick={handleOpenAddActivityModal}
                 title="Add Game Activity"
                 aria-label="Add Game Activity"
                 className={`font-semibold flex items-center gap-2 h-10 px-4 rounded-lg transition-all duration-300 hover:scale-105 ${
                   darkMode 
                     ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                     : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                 }`}
                >
                  <FaFeatherAlt className="w-4 h-4" />
                  Add Quest
                </button>
              </>
            )}
            {activeTab === "lessons" && (
              <button
                onClick={handleOpenAddModal}
                title="Add Lesson"
                aria-label="Add Lesson"
                className={`font-semibold flex items-center gap-2 h-10 px-4 rounded-lg transition-all duration-300 hover:scale-105 ${
                  darkMode 
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                <FaScroll className="w-4 h-4" />
                Add Scroll
              </button>
            )}
            {activeTab === "students" && (
              <button
                onClick={() => setIsAddStudentModalOpen(true)}
                title="Add Student"
                aria-label="Add Student"
                className={`font-semibold flex items-center gap-2 h-10 px-4 rounded-lg transition-all duration-300 hover:scale-105 ${
                  darkMode 
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                <FaUserPlus className="w-4 h-4" />
                Recruit Crew
              </button>
            )}
          </div>

          {activeTab === "lessons" && (
            <div className="flex flex-col md:flex-row gap-6">
              
              <div className={`w-full md:w-1/3 rounded-2xl overflow-hidden p-5 border-2 shadow-lg ${
                darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
              }`} style={{ boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.08)' }}>
                <LessonSidebar
                  lessons={lessons}
                  currentLessonId={currentLessonId}
                  onSelectLesson={handleSelectLesson}
                />
              </div>

     
              <div className={`w-full md:w-2/3 rounded-2xl shadow-2xl h-[70vh] sm:h-[75vh] md:h-[calc(85vh)] min-h-[420px] flex flex-col relative border-2 backdrop-blur-sm ${
                darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
              }`} style={{ boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.08)' }}>
                
                {lessonLoading && (
                  <div className={`absolute inset-0 flex items-center justify-center z-10 ${
                    darkMode ? 'bg-[#0b1022]/90' : 'bg-[#f5ecd2]/90'
                  }`}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
                      <p className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>Hoisting the scroll...</p>
                    </div>
                  </div>
                )}
                
                {!lessons || lessons.length === 0 ? (
                  <main className={`lesson-detail-placeholder p-6 rounded-2xl min-h-[300px] flex items-center justify-center shadow-2xl flex-1 border-2 backdrop-blur-sm ${
                    darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
                  }`} style={{ boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.08)' }}>
                    <div className="text-center">
                      <FaScroll className={`mx-auto mb-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} text-6xl`} />
                      <Header
                        type="h1"
                        weight="bold"
                        size="3xl"
                        className={`!text-4xl mb-4 ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}
                      >
                        Create Your First Scroll
                      </Header>
                      <p className={`text-lg mb-6 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>This ship has no scrolls yet. Time to chart your course!</p>
                      <Button
                        variant="default"
                        size="sm"
                        rounded="full"
                        className={`flex items-center gap-2 h-10 ${
                          darkMode 
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                            : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        }`}
                        onClick={handleOpenAddModal}
                      >
                        <FaScroll className="w-4 h-4" />
                        Create First Scroll
                      </Button>
                    </div>
                  </main>
                ) : loading && currentLessonId && !selectedLesson ? (
                  <main className={`lesson-detail-placeholder p-6 rounded-2xl min-h-[300px] flex items-center justify-center shadow-2xl flex-1 border-2 backdrop-blur-sm ${
                    darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
                  }`} style={{ boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.08)' }}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
                      <p className={`text-lg ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>Unrolling the scroll...</p>
                    </div>
                  </main>
                ) : selectedLesson ? (
                  <div className="flex flex-col h-full">
                    {/* Fixed Title Section */}
                    <div className={`p-5 border-b-2 backdrop-blur-sm ${
                      darkMode ? 'border-yellow-700/40 bg-[#0f1428]/80' : 'border-yellow-300 bg-[#fbf4de]/80'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <FaScroll className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                          <Header
                            type="h2"
                            weight="bold"
                            className={`!text-4xl ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}
                          >{selectedLesson.title}</Header>
                        </div>
                        <button 
                          onClick={handleOpenEditLessonModal}
                          className={`transition-colors p-1 ${darkMode ? 'text-yellow-400 hover:text-yellow-300' : 'text-yellow-600 hover:text-yellow-700'}`}
                          title="Edit scroll details"
                        >
                          <MdEdit className="w-6 h-6" />
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Content Section */}
                    <div className="flex-1 overflow-y-auto p-5">
                      {stats && (
                        <div className={`rounded-2xl p-4 shadow-sm mb-6 border-2 backdrop-blur-sm ${
                          darkMode ? 'bg-[#0f1428]/80 border-yellow-700/40' : 'bg-[#fbf4de]/80 border-yellow-300'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-2" title={`Crew members who read the scroll`}>
                                <BookOpen className={`w-4 h-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                                <span className={darkMode ? 'text-yellow-200' : 'text-yellow-800'}>{stats.studentsRead} / {stats.totalStudents} Read</span>
                              </div>
                              {selectedLesson.activities?.some(activity => activity?.type === 'QUIZ') && (
                                <div className="flex items-center gap-2" title={`Crew members who completed the quest`}>
                                  <CheckCircle className={`w-4 h-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                                  <span className={darkMode ? 'text-yellow-200' : 'text-yellow-800'}>{stats.studentsCompletedQuiz} / {stats.totalStudents} Completed Quest</span>
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
                            <div
                              key={block.id}
                              className="content-block bg-right-bottom bg-no-repeat"
                              style={{ backgroundImage: "url('/images/game-images/dash-path.png')", backgroundSize: '100px' }}
                            >
                              <ContentBlockDisplay block={block} />
                            </div>
                          ))}

                          {/* Quest Section */}
                          {selectedLesson.activities?.filter(activity => activity?.type === 'QUIZ' && activity?.id)?.length > 0 && (
                            <div className="mt-8">
                              <div className="quiz-section">
                                <div className="flex items-center gap-2 mb-4">
                                  <FaCoins className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                                  <Header type="h3" weight="semibold" className={`${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                                    Scroll Quest
                                  </Header>
                                </div>
                                {selectedLesson.activities
                                  .filter(activity => activity?.type === 'QUIZ' && activity?.id)
                                  .map(activity => {
                                    const quizData = quizDataMap[activity.id];
                                    return (
                                      <div key={activity.id} className={`mb-6 p-4 rounded-2xl shadow border-2 backdrop-blur-sm ${
                                        darkMode ? 'bg-[#0f1428]/80 border-yellow-700/40' : 'bg-[#fbf4de]/80 border-yellow-300'
                                      }`}>
                                        <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>{activity.title || quizData?.quizName || 'Quest'}</h4>
                                        <p className={`mb-4 ${darkMode ? 'text-yellow-300/90' : 'text-yellow-700/90'}`}>{activity.description || quizData?.description}</p>
                                        
                                        {/* Quest Details */}
                                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                          <div>
                                            <span className={`font-medium ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>Time Limit:</span> <span className={darkMode ? 'text-yellow-300' : 'text-yellow-700'}>{quizData?.timeLimitMinutes || 0} minutes</span>
                                          </div>
                                          <div>
                                            <span className={`font-medium ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>Quest Type:</span> <span className={darkMode ? 'text-yellow-300' : 'text-yellow-700'}>{quizData?.quizType || 'Standard'}</span>
                                          </div>
                                          <div>
                                            <span className={`font-medium ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>Passing Score:</span> <span className={darkMode ? 'text-yellow-300' : 'text-yellow-700'}>{quizData?.passingScore || 0}/{quizData?.overallScore || 0}</span>
                                          </div>
                                          <div>
                                            <span className={`font-medium ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>Max Attempts:</span> <span className={darkMode ? 'text-yellow-300' : 'text-yellow-700'}>{quizData?.maxAttempts || '1'}</span>
                                          </div>
                                          <div>
                                            <span className={`font-medium ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>Available From:</span> <span className={darkMode ? 'text-yellow-300' : 'text-yellow-700'}>{quizData?.availableFrom ? new Date(quizData.availableFrom).toLocaleString() : 'Not set'}</span>
                                          </div>
                                          <div>
                                            <span className={`font-medium ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>Available To:</span> <span className={darkMode ? 'text-yellow-300' : 'text-yellow-700'}>{quizData?.availableTo ? new Date(quizData.availableTo).toLocaleString() : 'Not set'}</span>
                                          </div>
                                          {quizData?.attempts && (
                                            <div>
                                              <span className={`font-medium ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>Total Attempts:</span> <span className={darkMode ? 'text-yellow-300' : 'text-yellow-700'}>{quizData.attempts.length || 0}</span>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* Quest Status */}
                                        <div className={`mt-4 p-3 rounded-2xl border-2 backdrop-blur-sm ${
                                          darkMode ? 'bg-[#0f1428]/60 border-yellow-700/30' : 'bg-[#fbf4de]/60 border-yellow-300'
                                        }`}>
                                          <p className={`font-medium ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>Quest Status:</p>
                                          <p className={darkMode ? 'text-yellow-300' : 'text-yellow-700'}>
                                            {stats?.studentsCompletedQuiz || 0} out of {stats?.totalStudents || 0} crew members have completed this quest.
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
                          <FaScroll className={`mx-auto mb-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} text-4xl`} />
                          <p className={`${darkMode ? 'text-yellow-300/90' : 'text-yellow-700/90'}`}>No content has been added to this scroll yet.</p>
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
                              background: "rgba(255,255,255,0.95)",
                              borderRadius: "9999px",
                              padding: "4px 8px",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                            }}
                          >
                            {studentsWhoRead.length > 4 && (
                              <div
                                style={{
                                  background: "#8b5e34",
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
                              <Avatar key={student.id} className="h-8 w-8 border-2 border-amber-700 -ml-2 first:ml-0 dark:border-yellow-500">
                                {renderStudentAvatar(student)}
                              </Avatar>
                            ))}
                          </div>
                        );
                      })()
                    )}
                  </div>
                ) : lessons.length > 0 && !currentLessonId ? (
                  <main className={`lesson-detail-placeholder p-6 rounded-2xl min-h-[300px] flex items-center justify-center shadow-2xl flex-1 border-2 backdrop-blur-sm ${
                    darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
                  }`} style={{ boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.08)' }}>
                    <p className={`text-lg ${darkMode ? 'text-yellow-300/90' : 'text-yellow-700/90'}`}>Please select a scroll to view its details.</p>
                  </main>
                ) : (
                  <main className={`lesson-detail-placeholder p-6 rounded-2xl min-h-[300px] flex items-center justify-center shadow-2xl flex-1 border-2 backdrop-blur-sm ${
                    darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
                  }`} style={{ boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.08)' }}>
                    <div className="text-center">
                      <FaScroll className={`mx-auto mb-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} text-4xl`} />
                      <p className={`text-lg mb-4 ${darkMode ? 'text-yellow-300/90' : 'text-yellow-700/90'}`}>This ship currently has no scrolls.</p>
                    </div>
                  </main>
                )}
              </div>
            </div>
          )}

          {activeTab === "activities" && (
            <div className={`p-6 rounded-2xl shadow-2xl border-2 backdrop-blur-sm ${
              darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
            }`} style={{ boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.08)' }}>
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <FaCoins className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                  <span className={`font-semibold ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>Treasure Quests</span>
                </div>
                <QuizManager classroomId={classroomId} refreshTrigger={activityRefreshTrigger} />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <FaFeatherAlt className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                <span className={`font-semibold ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>Adventure Quests</span>
              </div>
              <ActivityManager 
                classroomId={classroomId} 
                refreshTrigger={activityRefreshTrigger}
              />
            </div>
          )}

          {activeTab === "class-record" && (
            <div className={`p-6 rounded-2xl shadow-2xl border-2 backdrop-blur-sm ${
              darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
            }`} style={{ boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.08)' }}>
              <ClassRecordManager 
                classroomId={classroomId}
                teacherId={user?.id}
              />
            </div>
          )}

          {activeTab === "students" && (
            <div className={`p-6 rounded-2xl shadow-2xl border-2 backdrop-blur-sm ${
              darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
            }`} style={{ boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.08)' }}>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <FaUsers className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                  <Header type="h2" fontSize="2xl" weight="bold" className={`${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                    Crew Roster ({classroomStudents.length})
                  </Header>
                </div>
                <p className={`mb-4 ${darkMode ? 'text-yellow-300/90' : 'text-yellow-700/90'}`}>Manage crew members aboard this ship</p>
                
                {/* Search box for crew members */}
              <div className="relative w-full md:max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkedAlt className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search crew members..."
                    className={`pl-10 pr-3 py-2 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${
                      darkMode 
                        ? 'bg-[#0f1428] text-gray-100 border-yellow-700/40 focus:ring-yellow-500/50 focus:border-yellow-500' 
                        : 'bg-[#fbf4de] text-gray-900 border-yellow-300 focus:ring-yellow-500/50 focus:border-yellow-500'
                    }`}
                    value={enrolledStudentsSearchTerm}
                    onChange={(e) => setEnrolledStudentsSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {loadingStudents ? (
                <div className="flex justify-center items-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
                    <p className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>Gathering the crew...</p>
                  </div>
                </div>
              ) : classroomStudents.length === 0 ? (
                <div className="text-center py-8">
                  <FaUsers className={`mx-auto mb-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} text-4xl`} />
                  <p className={`mb-6 text-lg ${darkMode ? 'text-yellow-300/90' : 'text-yellow-700/90'}`}>No crew members aboard this ship yet.</p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setIsAddStudentModalOpen(true)}
                    className={`flex items-center gap-2 ${
                      darkMode 
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                        : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    }`}
                  >
                    <FaUserPlus className="w-4 h-4" />
                    Recruit First Crew Member
                  </Button>
                </div>
              ) : getFilteredEnrolledStudents().length === 0 ? (
                <div className="text-center py-8">
                  <FaMapMarkedAlt className={`mx-auto mb-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} text-4xl`} />
                  <p className={`mb-4 ${darkMode ? 'text-yellow-300/90' : 'text-yellow-700/90'}`}>No crew members found matching '{enrolledStudentsSearchTerm}' <span className={`underline ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} onClick={() => setEnrolledStudentsSearchTerm('')}>clear search</span></p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-amber-200 dark:divide-yellow-500/30">
                    <thead className={`${darkMode ? 'bg-[#0f1428]/80' : 'bg-[#fbf4de]/80'}`}>
                      <tr>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                          Crew Member
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                          Username
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                          Email
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'bg-[#0b1022]/60' : 'bg-[#f5ecd2]/60'} divide-y divide-amber-100 dark:divide-yellow-500/20`}>
                      {getFilteredEnrolledStudents().map(student => (
                        <tr key={student.id} className={`hover:${darkMode ? 'bg-[#0f1428]/80' : 'bg-[#fbf4de]/80'}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                               <Avatar key={student.id} className="h-10 w-10 mr-3">
                                {renderStudentAvatar(student)}
                              </Avatar>
                              <div>
                                <div className={`text-sm font-medium ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                                  {student.firstName} {student.lastName}
                                </div>
                                <div className={`text-sm ${darkMode ? 'text-yellow-300/80' : 'text-yellow-700/80'}`}>
                                  ID: {student.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                            @{student.username}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                            {student.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRemoveStudent(student.id)}
                              className="flex items-center gap-1 text-red-700 hover:text-red-900"
                            >
                              <FaTrash className="w-3 h-3" />
                              Walk the Plank
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
        title={`Recruit Crew Member for ${classroomDetails?.name || 'Ship'}`}
        maxWidth="max-w-lg"
      >
        {error && isAddStudentModalOpen && (
          <div className="text-red-500 mb-3">{error}</div>
        )}
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="studentSearch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search for New Crew Members
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CiSearch className="text-gray-400 dark:text-gray-300" />
              </div>
              <Input
                type="text"
                id="studentSearch"
                placeholder="Search by name or username..."
                className="w-full pl-10 pr-3 py-2 border dark:text-gray-300 border-gray-300 dark:border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Search by name or username. Results will show crew members not already aboard this ship.
            </p>
          </div>
          
          {searchingStudents ? (
            <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-300 flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-yellow-500"></div>
              <span>Searching the seas...</span>
            </div>
          ) : studentSearchTerm && studentSearchResults.length === 0 ? (
            <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-300 flex flex-col items-center gap-2">
              <FaUsers className="text-2xl text-gray-400" />
              <span>No crew members found matching '{studentSearchTerm}'</span>
            </div>
          ) : !studentSearchTerm ? (
            <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-300 flex flex-col items-center gap-2">
              <FaCompass className="text-2xl text-gray-400" />
              <span>Type to search for new crew members</span>
            </div>
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
                    <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                      <FaAnchor className="w-3 h-3" />
                      Already aboard
                    </span>
                  ) : student.isAdding ? (
                    <span className="text-sm text-blue-600 font-medium animate-pulse flex items-center gap-1">
                      <FaShip className="w-3 h-3" />
                      Recruiting...
                    </span>
                  ) : (
                    <div className="flex items-center">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation(); 
                          handleAddStudent(student.id);
                        }}
                        variant="default"
                        size="sm"
                        className="text-sm flex items-center gap-1"
                      >
                        <FaUserPlus className="w-3 h-3" />
                        Recruit
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