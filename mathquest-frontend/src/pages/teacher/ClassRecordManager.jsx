import React, { useState, useEffect, useRef } from "react";
import { reportService } from "../../services/reportService";
import { Header } from '../../ui/heading';
import { FaDownload, FaSpinner, FaFileExcel, FaFileCsv, FaInfoCircle, FaChevronDown } from "react-icons/fa";
import { BiAnalyse } from "react-icons/bi";
import { MdOutlineQuiz } from "react-icons/md";
import { GoScreenFull } from "react-icons/go";
import { toast } from "react-hot-toast";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar, Line, Chart } from 'react-chartjs-2';
import { useAuth } from "../../context/AuthContext";
import Modal from "../../ui/modal.jsx";
import classroomService from "../../services/classroomService";
import { leaderboardService } from "../../services/leaderboardService";

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Calculate student ranks based on average score
const calculateRanks = (students, quizzes) => {

  
  // Calculate total possible points across all quizzes
  const totalPossiblePoints = quizzes.reduce((sum, quiz) => {
    const quizPoints = Number(quiz.overallScore) || 0;

    return sum + quizPoints;
  }, 0);
  
 

  return students
    .map((student, index) => ({ ...student, index }))
    .map(student => {
      // Calculate total score and check completion status
      const totalScore = student.quizScores?.reduce((sum, score) => {
        // Handle both object and number scores
        const scoreValue = typeof score === 'object' ? (score?.score || 0) : (Number(score) || 0);
    
        return sum + scoreValue;
      }, 0) || 0;
      
      
      
      // Calculate average based on total possible points
      const averageScore = totalPossiblePoints > 0 
        ? ((totalScore / totalPossiblePoints) * 100).toFixed(2) 
        : 0;
      
    
      
      const isComplete = student.quizScores?.every(score => score !== null && score !== undefined);
      
      return {
        ...student,
        totalScore,
        averageScore: parseFloat(averageScore),
        status: isComplete ? 'Complete' : 'Incomplete'
      };
    })
    .sort((a, b) => b.averageScore - a.averageScore)
    .map((student, rank) => ({ ...student, rank: rank + 1 }))
    .sort((a, b) => a.index - b.index);
};

const calculateAnalytics = (quizData, quizAttempts) => {
  if (!quizData?.quizzes || !quizAttempts?.attempts || !quizAttempts?.students) {
   
    return null;
  }



  const { quizzes } = quizData;
  const { attempts, students } = quizAttempts;

  // First, calculate average score for each student per quiz
  const studentQuizAverages = {};
  students.forEach(student => {
    studentQuizAverages[student.id] = {};
  });

  // Group attempts by student and quiz, and calculate average for each student-quiz combination
  attempts.forEach(attempt => {
    const studentId = attempt.studentId || attempt.user_id;
    const quizId = attempt.quizId || attempt.quiz_id;
    const score = attempt.score || 0;

    if (!studentQuizAverages[studentId][quizId]) {
      studentQuizAverages[studentId][quizId] = {
        scores: [],
        average: 0
      };
    }

    studentQuizAverages[studentId][quizId].scores.push(score);
  });

  // Calculate averages for each student-quiz combination
  Object.keys(studentQuizAverages).forEach(studentId => {
    Object.keys(studentQuizAverages[studentId]).forEach(quizId => {
      const scores = studentQuizAverages[studentId][quizId].scores;
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      studentQuizAverages[studentId][quizId].average = average;
    });
  });

  // Calculate mastery rate (students who passed all quizzes)
  let studentsWithMastery = 0;
  students.forEach(student => {
    const studentAttempts = studentQuizAverages[student.id] || {};
    const allQuizzesTaken = Object.keys(studentAttempts).length === quizzes.length;
    
    if (allQuizzesTaken) {
      const allPassed = quizzes.every(quiz => {
        const studentData = studentAttempts[quiz.id];
        if (!studentData) return false;
        
        // Calculate percentage score based on the quiz's overall score
        const percentageScore = (studentData.average / quiz.overallScore) * 100;
        // Calculate passing percentage
        const passingPercentage = (quiz.passingScore / quiz.overallScore) * 100;
        
  
        
        return percentageScore >= passingPercentage;
      });
      
      if (allPassed) {
        studentsWithMastery++;
    
      }
    }
  });

  const masteryRate = students.length > 0 ? (studentsWithMastery / students.length) * 100 : 0;


  // Calculate quiz performance metrics using student averages
  const quizPerformance = quizzes.map(quiz => {
    let totalStudents = 0;
    let passedStudents = 0;
    let totalScore = 0;
    let studentAverages = [];
    let studentScores = []; // Add this to track individual student scores

    students.forEach(student => {
      const studentQuizData = studentQuizAverages[student.id]?.[quiz.id];
      if (studentQuizData) {
        totalStudents++;
        const studentAverage = studentQuizData.average;
        // Calculate percentage based on perfect score
        const percentageScore = (studentAverage / (quiz.overallScore || 100)) * 100;
        studentAverages.push(percentageScore);
        studentScores.push({
          studentId: student.id,
          score: percentageScore
        });
        totalScore += percentageScore;
        
        // Fix: Compare percentage score with passing score percentage
        const passingPercentage = (quiz.passingScore / (quiz.overallScore || 100)) * 100;
        if (percentageScore >= passingPercentage) {
          passedStudents++;
        }
      }
    });

    // Calculate pass rate based on percentage scores
    const passRate = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0;
    
    // Calculate quiz average as percentage of perfect score
    const quizAverage = totalStudents > 0 
      ? totalScore / totalStudents
      : 0;

    return {
      quizId: quiz.id,
      quizName: quiz.quizName,
      passRate: parseFloat(passRate.toFixed(2)),
      averageScore: parseFloat(quizAverage.toFixed(2)),
      totalStudents,
      passedStudents,
      studentAverages,
      studentScores, // Include individual student scores
      passingScore: quiz.passingScore,
      overallScore: quiz.overallScore,
      topic: quiz.topic || `Quiz ${quiz.id}` // Default to Quiz ID if no topic
    };
  });

  // Calculate content mastery by topic with more detailed statistics
  const topicMastery = {};
  quizPerformance.forEach(quiz => {
    const topic = quiz.topic || `Quiz ${quiz.id}`;
    
    if (!topicMastery[topic]) {
      topicMastery[topic] = {
        totalQuizzes: 0,
        totalPassRate: 0,
        totalStudents: 0,
        quizzes: [], // Store individual quiz data
        studentPerformance: {} // Track student performance per topic
      };
    }

    // Add quiz data
    topicMastery[topic].quizzes.push({
      quizName: quiz.quizName,
      averageScore: quiz.averageScore,
      passRate: quiz.passRate,
      totalStudents: quiz.totalStudents,
      passedStudents: quiz.passedStudents
    });

    // Update topic statistics
    topicMastery[topic].totalQuizzes++;
    topicMastery[topic].totalPassRate += quiz.passRate || 0;
    topicMastery[topic].totalStudents += quiz.totalStudents || 0;

    // Track student performance
    quiz.studentScores?.forEach(score => {
      if (!topicMastery[topic].studentPerformance[score.studentId]) {
        topicMastery[topic].studentPerformance[score.studentId] = {
          scores: [],
          average: 0
        };
      }
      topicMastery[topic].studentPerformance[score.studentId].scores.push(score.score);
    });
  });

  // Calculate detailed statistics for each topic
  Object.keys(topicMastery).forEach(topic => {
    const topicData = topicMastery[topic];
    
    // Calculate average pass rate
    topicData.averagePassRate = topicData.totalQuizzes > 0
      ? topicData.totalPassRate / topicData.totalQuizzes
      : 0;

    // Calculate student averages for the topic
    Object.values(topicData.studentPerformance).forEach(studentData => {
      studentData.average = studentData.scores.length > 0
        ? studentData.scores.reduce((sum, score) => sum + score, 0) / studentData.scores.length
        : 0;
    });

    // Calculate topic statistics
    topicData.studentAverages = Object.values(topicData.studentPerformance)
      .map(data => data.average);
    
    topicData.topicAverage = topicData.studentAverages.length > 0
      ? topicData.studentAverages.reduce((sum, avg) => sum + avg, 0) / topicData.studentAverages.length
      : 0;

    topicData.masteryLevel = topicData.averagePassRate >= 80 ? 'High' :
                            topicData.averagePassRate >= 60 ? 'Medium' : 'Low';
  });

  // Calculate global average score
  const globalAverageScore = quizPerformance.length > 0
    ? quizPerformance.reduce((sum, quiz) => sum + (quiz.averageScore || 0), 0) / quizPerformance.length
    : 0;

  return {
    totalStudents: students.length,
    totalQuizzes: quizzes.length,
    uniqueQuizzesTaken: new Set(attempts.map(a => a.quizId || a.quiz_id)).size,
    averageScore: parseFloat(globalAverageScore.toFixed(2)),
    masteryRate: parseFloat(masteryRate.toFixed(2)),
    studentsWithMastery: studentsWithMastery,
    quizPerformance,
    topicMastery,
    totalQuizzesPassed: quizPerformance.reduce((sum, quiz) => sum + (quiz.passedStudents || 0), 0),
    totalQuizzesFailed: quizPerformance.reduce((sum, quiz) => sum + ((quiz.totalStudents || 0) - (quiz.passedStudents || 0)), 0)
  };
};

const capitalizeName = (name) => {
  if (!name) return '';
  // Split the name into words and capitalize each word
  return name.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const ClassRecordManager = ({ classroomId }) => {
  const { currentUser, token } = useAuth();
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [generatingExcelReport, setGeneratingExcelReport] = useState(false);
  const [generatingCsvReport, setGeneratingCsvReport] = useState(false);
  const [reportName, setReportName] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [visibleSection, setVisibleSection] = useState("reports");
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [isAttemptModalOpen, setIsAttemptModalOpen] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState(null);
  const [quizDataLoading, setQuizDataLoading] = useState(true);
  const [classroom, setClassroom] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for highest to lowest, 'asc' for lowest to highest
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeQuizTab, setActiveQuizTab] = useState('overall');
  const dropdownRef = useRef(null);
  const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState(false);
  const downloadDropdownRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Add new useEffect for analytics calculation
  useEffect(() => {
    if (quizData?.quizzes && quizAttempts?.attempts && quizAttempts?.students) {
 
      const calculatedAnalytics = calculateAnalytics(quizData, quizAttempts);
      setAnalytics(calculatedAnalytics);
      setAnalyticsLoading(false);
    }
  }, [quizData, quizAttempts]);

  // Add useEffect to handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (isDownloadDropdownOpen && downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target)) {
        setIsDownloadDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isDownloadDropdownOpen]);

  useEffect(() => {
    if (!currentUser?.id) {
      console.error("No user found in context");
  
      toast.error("Please log in to access this feature");
      return;
    }

    if (!token) {
      console.error("No authentication token found");
  
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        toast.error("Please log in to access this feature");
        return;
      }
    }


    fetchData();
  }, [classroomId, currentUser, token]);

  const fetchData = async () => {
    if (!currentUser?.id || (!token && !localStorage.getItem('token'))) {
      return;
    }

    try {

      setLoading(true);
      setAnalyticsLoading(true);
      setQuizDataLoading(true);

      // Fetch classroom data first
      const classroomResponse = await fetch(`/classrooms/${classroomId}`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!classroomResponse.ok) {
        throw new Error('Failed to fetch classroom data');
      }
      const classroomData = await classroomResponse.json();
      setClassroom(classroomData);
     

      // Fetch reports
      const reportData = await reportService.getReportsByClassroom(classroomId);
 
      
      // Parse report data for each report
      const parsedReports = reportData.map(report => {
        const parsedReport = {
          ...report,
          reportData: typeof report.reportData === 'string'
            ? JSON.parse(report.reportData)
            : report.reportData
        };

        // Parse nested JSON strings if they exist
        if (typeof parsedReport.reportData.students === 'string') {
          parsedReport.reportData.students = JSON.parse(parsedReport.reportData.students);
        }
        if (typeof parsedReport.reportData.quizzes === 'string') {
          parsedReport.reportData.quizzes = JSON.parse(parsedReport.reportData.quizzes);
        }

        // Parse quiz attempts for each student
        if (parsedReport.reportData.students) {
          parsedReport.reportData.students.forEach(student => {
            if (typeof student.quizAttempts === 'string') {
              student.quizAttempts = JSON.parse(student.quizAttempts);
            }
          });
        }

        return parsedReport;
      });

      setReports(parsedReports);
      
      // Set the most recent report as the selected report
      if (parsedReports && parsedReports.length > 0) {
        setSelectedReport(parsedReports[0]);
      }

      // Fetch analytics
      const analyticsData = await reportService.getClassRecordAnalytics(classroomId);
     

      // Get actual student count from classroom data
      const studentCount = classroomData.students?.length || await classroomService.getStudentCountInClassroom(classroomId);
      
      // Merge analytics with actual student count
      setAnalytics({
        ...analyticsData,
        totalStudents: studentCount // Override with actual student count
      });

      // Fetch quiz data and attempts
      const [quizDataResponse, quizAttemptsResponse] = await Promise.all([
        reportService.getClassroomQuizData(classroomId),
        reportService.getQuizAttempts(classroomId)
      ]);

      setQuizData(quizDataResponse);
      setQuizAttempts(quizAttemptsResponse);

      setLoading(false);
      setQuizDataLoading(false);
    } catch (error) {
      console.error("Error fetching class record data:", error);
      if (error.response?.status === 401) {
        console.error("Authentication error:", error.response.data);
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error("Failed to load class record data");
      }
      setLoading(false);
      setAnalyticsLoading(false);
      setQuizDataLoading(false);
    }
  };

  const handleGenerateReport = async (fileType) => {
    if (!currentUser?.id) {
   
      toast.error("Please log in to generate reports");
      return;
    }

    if (!classroom) {

      toast.error("Failed to load classroom data");
      return;
    }

    try {
      if (fileType === 'EXCEL') {
        setGeneratingExcelReport(true);
      } else if (fileType === 'CSV') {
        setGeneratingCsvReport(true);
      }

      
      // Validate required data
      if (!quizData?.quizzes || !quizAttempts?.attempts || !quizAttempts?.students) {
     
        throw new Error("Required data is not available");
      }

  

      // Create quiz metadata and validate quiz IDs
      const quizMap = new Map(quizData.quizzes.map(quiz => [quiz.id, quiz]));


      // Validate attempts have matching quizzes
      const validAttempts = quizAttempts.attempts.filter(attempt => {
        const hasMatchingQuiz = quizMap.has(attempt.quizId);
        if (!hasMatchingQuiz) {
          console.warn(`Found attempt with no matching quiz: Attempt ID ${attempt.id}, Quiz ID ${attempt.quizId}`);
        }
        return hasMatchingQuiz;
      });



      // Organize attempts by student
      const attemptsByStudent = {};
      validAttempts.forEach(attempt => {
        const studentId = attempt.studentId || attempt.user_id;
        const quizId = attempt.quizId || attempt.quiz_id;
        
        if (!studentId || !quizId) {
          console.warn("Skipping attempt with missing IDs:", attempt);
          return;
        }

        if (!attemptsByStudent[studentId]) {
          attemptsByStudent[studentId] = {
            attempts: {},
            totalAttempts: 0
          };
        }
        
        // Count total attempts for each quiz
        if (!attemptsByStudent[studentId].attempts[quizId]) {
          attemptsByStudent[studentId].attempts[quizId] = {
            attempts: [],
            bestScore: 0
          };
        }
        
        attemptsByStudent[studentId].attempts[quizId].attempts.push(attempt);
        attemptsByStudent[studentId].totalAttempts++;
        
        // Update best score if this attempt is better
        if (!attemptsByStudent[studentId].attempts[quizId].bestScore || 
            attemptsByStudent[studentId].attempts[quizId].bestScore < attempt.score) {
          attemptsByStudent[studentId].attempts[quizId].bestScore = attempt.score;
        }
      });

      // Update student records for Excel/CSV with new format
      const studentRecordsForExcel = quizAttempts.students.map(student => {
        const studentAttempts = attemptsByStudent[student.id] || { attempts: {}, totalAttempts: 0 };
        const quizScores = {};
        let totalPoints = 0;
        let completedQuizzes = 0;
        
        // Calculate total possible points
        const totalPossiblePoints = quizData.quizzes.reduce((sum, quiz) => {
          return sum + (Number(quiz.overallScore) || 0);
        }, 0);
        
        // Calculate scores for each quiz
        quizData.quizzes.forEach(quiz => {
          const quizAttempts = studentAttempts.attempts[quiz.id];
          if (quizAttempts) {
            // Calculate average score for this quiz
            const averageScore = quizAttempts.attempts.reduce((sum, a) => sum + (a.score || 0), 0) / quizAttempts.attempts.length;
            quizScores[`quiz_${quiz.id}`] = averageScore.toFixed(2);
            totalPoints += Number(averageScore);
            completedQuizzes++;
          } else {
            quizScores[`quiz_${quiz.id}`] = null;
          }
        });
        
        // Calculate average score using total possible points
        const averageScore = totalPossiblePoints > 0 
          ? ((totalPoints / totalPossiblePoints) * 100).toFixed(2)
          : 0;
        
        const status = completedQuizzes === quizData.quizzes.length ? 'Complete' : 'Incomplete';
        
        // Create a single record with all fields, separating lastName and firstName
        return {
          rank: 0, // Will be set after sorting
          lastName: capitalizeName(student.lastName),
          firstName: capitalizeName(student.firstName),
          ...quizScores,
          totalPoints: Number(totalPoints.toFixed(4)), // Convert to number after formatting
          averageScore: parseFloat(averageScore),
          status
        };
      })
      // Sort by average score and assign ranks
      .sort((a, b) => b.averageScore - a.averageScore)
      .map((student, index) => ({
        ...student,
        rank: index + 1
      }));

      // Update headers to include Excel styling
      const headers = [
        { key: "rank", label: "Rank" },
        { key: "lastName", label: "Last Name" },
        { key: "firstName", label: "First Name" },
        ...quizData.quizzes.map(quiz => ({ 
          key: `quiz_${quiz.id}`, 
          label: `${quiz.quizName} (Quiz Items: ${quiz.totalItems} | Overall Score: ${quiz.overallScore} | Passing: ${quiz.passingScore})`
        })),
        { key: "totalPoints", label: "Total Points" },
        { key: "averageScore", label: "Average Score (%)" },
        { key: "status", label: "Status" }
      ];

      // Update the report description to ensure proper data formatting
      const reportDescription = JSON.stringify({
        classroomId: classroom.id,
        classroomName: classroom.name,
        totalStudents: quizAttempts.students.length,
        totalQuizzes: quizData.quizzes.length,
        quizzes: quizData.quizzes.map(quiz => ({
          id: quiz.id,
          quizName: quiz.quizName,
          totalItems: quiz.totalItems,
          passingScore: quiz.passingScore,
          overallScore: Number(quiz.overallScore) || 0
        })),
        students: studentRecordsForExcel.map(student => ({
          ...student,
          totalPoints: Number(student.totalPoints),
          averageScore: Number(student.averageScore)
        })),
        headers: headers,
        generatedAt: new Date().toISOString()
      });



      // Generate new report
      const newReport = await reportService.generateClassRecordReport(
        classroomId,
        currentUser.id,
        reportName,
        reportDescription,
        fileType
      );
      
      if (!newReport?.id) {
        throw new Error("Failed to generate report: No report ID returned");
      }

     

      // Download the newly generated report
      const getFileExtension = (type) => {
        switch (type.toUpperCase()) {
          case 'EXCEL':
            return '.xlsx';
          case 'CSV':
            return '.csv';
          default:
            return '.txt';
        }
      };

      const fileName = `${classroom.name || 'Class'}_Record${getFileExtension(fileType)}`;
      await reportService.downloadAndSaveReportFile(newReport.id, fileName);
      
      toast.success(`Class record report generated and downloaded as ${fileType}`);
      await fetchData(); // Refresh the reports list

    } catch (error) {

      
      // Extract error message from response if available
      const errorMessage = error.response?.data?.message || error.message;
      console.error("Error message:", errorMessage);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else if (error.response?.status === 500) {
        toast.error("Server error while generating report. Please try again later.");
      } else {
        toast.error(`Failed to generate report: ${errorMessage}`);
      }
    } finally {
      if (fileType === 'EXCEL') {
        setGeneratingExcelReport(false);
      } else if (fileType === 'CSV') {
        setGeneratingCsvReport(false);
      }
    }
  };

  const handleAttemptClick = async (attempt, attemptsByStudent) => {

    
    try {
      // Get all attempts for this student and quiz
      const studentAttempts = attemptsByStudent[attempt.studentId]?.attempts[attempt.quizId]?.attempts || [];
      const totalAttempts = studentAttempts.length;
     
      
      // Calculate average score
      const averageScore = studentAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts;
 

      // Find highest score and its attempt number
      const highestScoreAttempt = studentAttempts.reduce((best, current, index) => {
        if (!best || current.score > best.score) {
          return { ...current, attemptNumber: index + 1 };
        }
        return best;
      }, null);

      // Fetch the leaderboard for this specific quiz
      const quizLeaderboard = await leaderboardService.getLeaderboardByQuiz(attempt.quizId);
      

      // Find the student's rank in this quiz
      const studentRank = quizLeaderboard?.findIndex(
        entry => entry.studentId === attempt.studentId
      ) + 1;
    
      
      // Calculate time spent in minutes and seconds
      const timeSpentSeconds = attempt.timeSpentSeconds || attempt.timeSpent || 0;
      const minutes = Math.floor(timeSpentSeconds / 60);
      const seconds = timeSpentSeconds % 60;
      const formattedTime = `${minutes}.${seconds.toString().padStart(2, '0')}`;
      

      
      setSelectedAttempt({
        ...attempt,
        totalAttempts,
        averageScore: averageScore.toFixed(2),
        timeSpent: formattedTime,
        rank: studentRank || 'N/A',
        highestScore: highestScoreAttempt?.score || 0,
        bestScoreAttemptNumber: highestScoreAttempt?.attemptNumber || 0
      });
      setIsAttemptModalOpen(true);
    } catch (error) {
      
      toast.error('Failed to fetch student rank');
    }
  };

  const renderAttemptModal = () => {
    if (!selectedAttempt) return null;
    

    return (
      <Modal
        isOpen={isAttemptModalOpen}
        onClose={() => setIsAttemptModalOpen(false)}
        title="Quiz Attempt Details"
      >
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-sm">
              <p className="dark:text-gray-300"><strong>Average Score:</strong> {selectedAttempt.averageScore}</p>
              <p className="dark:text-gray-300"><strong>Highest Score:</strong> {selectedAttempt.highestScore}</p>
              <p className="dark:text-gray-300"><strong>Best Score Attempt:</strong> #{selectedAttempt.bestScoreAttemptNumber}</p>
              <p className="dark:text-gray-300"><strong>Total Attempts:</strong> {selectedAttempt.totalAttempts}</p>
              <p className="dark:text-gray-300"><strong>Status:</strong> {selectedAttempt.passed ? 'Passed' : 'Failed'}</p>
              <p className="dark:text-gray-300"><strong>Time Spent:</strong> {selectedAttempt.timeSpent || 'N/A'}</p>
              <p className="dark:text-gray-300"><strong>Rank:</strong> {selectedAttempt.rank || 'N/A'}</p>
              <p className="dark:text-gray-300"><strong>Completed:</strong> {selectedAttempt.completedAt ? new Date(selectedAttempt.completedAt).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        </div>
      </Modal>
    );
  };

  const getSortedStudents = (students) => {
    const sorted = [...students];
    // Always sort by rank, just change the order
    sorted.sort((a, b) => sortOrder === 'desc' ? a.rank - b.rank : b.rank - a.rank);
    return sorted;
  };

  const getCurrentQuizName = () => {
    if (activeQuizTab === 'overall') {
      return 'Overall Analytics';
    }
    const quiz = analytics?.quizPerformance?.find(q => q.quizId === activeQuizTab);
    return quiz ? quiz.quizName : 'Overall Analytics';
  };

  const renderClassRecord = () => {
    if (quizDataLoading) {
      return (
        <div className="flex justify-center items-center h-32">
          <FaSpinner className="animate-spin text-blue-600 text-2xl" />
        </div>
      );
    }

    if (!quizData?.quizzes || !quizAttempts?.attempts) {
      return (
        <div className="text-center py-8 text-gray-500">
          No quiz data available for this classroom.
        </div>
      );
    }



    const { quizzes } = quizData;
    const { attempts, students } = quizAttempts;


    // Organize attempts by student
    const attemptsByStudent = {};
    attempts.forEach(attempt => {
      if (!attempt.studentId && attempt.user_id) {
        attempt.studentId = attempt.user_id;
      }
      if (!attempt.quizId && attempt.quiz_id) {
        attempt.quizId = attempt.quiz_id;
      }

      if (!attemptsByStudent[attempt.studentId]) {
        attemptsByStudent[attempt.studentId] = {
          attempts: {},
          totalAttempts: 0
        };
      }
      
      // Count total attempts for each quiz
      if (!attemptsByStudent[attempt.studentId].attempts[attempt.quizId]) {
        attemptsByStudent[attempt.studentId].attempts[attempt.quizId] = {
          attempts: [],
          bestScore: 0
        };
      }
      
      attemptsByStudent[attempt.studentId].attempts[attempt.quizId].attempts.push(attempt);
      attemptsByStudent[attempt.studentId].totalAttempts++;
      
      // Update best score if this attempt is better
      if (!attemptsByStudent[attempt.studentId].attempts[attempt.quizId].bestScore || 
          attemptsByStudent[attempt.studentId].attempts[attempt.quizId].bestScore < attempt.score) {
        attemptsByStudent[attempt.studentId].attempts[attempt.quizId].bestScore = attempt.score;
      }
    });

    // Prepare student data with scores and status
    const studentData = students.map(student => {
      const studentAttempts = attemptsByStudent[student.id] || { attempts: {}, totalAttempts: 0 };
      const quizScores = quizzes.map(quiz => {
        const quizAttempts = studentAttempts.attempts[quiz.id];
        if (!quizAttempts) return null;
        
        // Calculate average score for this quiz
        const totalScore = quizAttempts.attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
        const averageScore = totalScore / quizAttempts.attempts.length;
        
        return {
          score: averageScore,
          totalAttempts: quizAttempts.attempts.length,
          bestScore: quizAttempts.bestScore
        };
      });
      
      const totalScore = quizScores.reduce((sum, score) => {
        const scoreValue = Number(score?.score) || 0;
        return sum + scoreValue;
      }, 0);
      
      const totalPossiblePoints = quizzes.reduce((sum, quiz) => {
        const quizTotalPoints = Number(quiz.overallScore) || 0;
        return sum + quizTotalPoints;
      }, 0);
      
      const averageScore = totalPossiblePoints > 0 
        ? ((totalScore / totalPossiblePoints) * 100).toFixed(2) 
        : 0;
      
      const isComplete = quizScores.every(score => score !== null);

      return {
        ...student,
        quizScores,
        totalScore: Number(totalScore.toFixed(2)), // Round total score to 2 decimal places
        averageScore: parseFloat(averageScore),
        status: isComplete ? 'Complete' : 'Incomplete',
        totalAttempts: studentAttempts.totalAttempts
      };
    });

    // Calculate ranks with the new function
    const rankedStudents = calculateRanks(studentData, quizzes);
    const sortedStudents = getSortedStudents(rankedStudents);

    return (
      <div>
        <div className={`overflow-x-auto ${isFullScreen ? 'fixed inset-0 z-50 bg-white p-4' : ''}`}>
          {isFullScreen && (
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Class Record - Full Screen View</h3>
              <button
                onClick={() => setIsFullScreen(false)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>
          )}
          
          {/* Sort button and Download dropdown - visible in both normal and full-screen modes */}
          <div className="mt-2 mb-6 flex flex-col md:flex-row justify-end  items-start md:items-center gap-4 px-1">
              {/* Full Screen Button - only show in normal mode */}
              {!isFullScreen && (
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full md:w-auto"
              >
                <GoScreenFull className="mr-2 h-4 w-4" />
                Full Screen
              </button>
            )}
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full md:w-auto"
            >
              Sort: {sortOrder === 'desc' ? 'Highest Rank' : 'Lowest Rank'}
              {sortOrder === 'desc' ? ' ↓' : ' ↑'}
            </button>
            
          
            
            {/* Download Dropdown */}
            <div className="relative w-full md:w-auto" ref={downloadDropdownRef}>
              <button
                onClick={() => setIsDownloadDropdownOpen(!isDownloadDropdownOpen)}
                className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full md:w-auto"
              >
                <div className="flex items-center">
                  <FaDownload className="mr-2 h-4 w-4" />
                  Download Report
                </div>
                <FaChevronDown className="ml-2 h-4 w-4" />
              </button>
              
              {isDownloadDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200 md:right-0">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleGenerateReport('EXCEL');
                        setIsDownloadDropdownOpen(false);
                      }}
                      disabled={generatingExcelReport}
                      className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center ${
                        generatingExcelReport ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <FaFileExcel className="mr-2 h-4 w-4" />
                      {generatingExcelReport ? 'Generating Excel...' : 'Download Excel'}
                    </button>
                    <button
                      onClick={() => {
                        handleGenerateReport('CSV');
                        setIsDownloadDropdownOpen(false);
                      }}
                      disabled={generatingCsvReport}
                      className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center ${
                        generatingCsvReport ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <FaFileCsv className="mr-2 h-4 w-4" />
                      {generatingCsvReport ? 'Generating CSV...' : 'Download CSV'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className={`${isFullScreen ? 'h-[calc(100vh-120px)]' : 'max-h-96'} overflow-y-auto`}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20"
                  >
                    Rank {sortOrder === 'desc' ? '↓' : '↑'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Student Name
                  </th>
                  {quizzes.map(quiz => (
                    <th key={quiz.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      <div className="break-words">
                        {quiz.quizName}
                      </div>
                      <div className="text-xxs font-normal normal-case text-gray-400 mt-1">
                        Items: {quiz.totalItems} | Score: {quiz.overallScore} | Pass: {quiz.passingScore}
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Total Points
                    <div className="text-xxs font-normal normal-case text-gray-400">
                      (Max: {quizzes.reduce((sum, quiz) => sum + (Number(quiz.overallScore) || 0), 0)})
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Average Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedStudents.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap w-20">
                      <div className="text-sm font-medium text-gray-900">
                        {student.rank}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap w-48">
                      <div className="text-sm font-medium text-gray-900">
                        {capitalizeName(student.lastName)}, {capitalizeName(student.firstName)}
                      </div>
                    </td>
                    {quizzes.map(quiz => {
                      const quizAttempts = attemptsByStudent[student.id]?.attempts[quiz.id];
                      const averageScore = quizAttempts ? 
                        (quizAttempts.attempts.reduce((sum, a) => sum + (a.score || 0), 0) / quizAttempts.attempts.length).toFixed(2) : 
                        null;
                      return (
                        <td key={quiz.id} className="px-6 py-4 whitespace-nowrap w-40">
                          {quizAttempts ? (
                            <button
                              onClick={() => handleAttemptClick(quizAttempts.attempts[0], attemptsByStudent)}
                              className={`text-sm flex items-center ${
                                averageScore >= quiz.passingScore ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {averageScore}
                              <FaInfoCircle className="ml-1" />
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap w-32">
                      <span className="text-sm font-medium text-gray-900">
                        {student.totalScore.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap w-32">
                      <span className={`text-sm font-medium ${
                        student.averageScore >= 60 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {student.averageScore}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap w-32">
                      <span className={`text-sm font-medium ${
                        student.status === 'Complete' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    if (analyticsLoading) {
      return (
        <div className="flex justify-center items-center h-32">
          <FaSpinner className="animate-spin text-blue-600 text-2xl" />
        </div>
      );
    }

    if (!analytics) {
   
      return (
        <div className="text-center py-8 text-gray-500">
          No analytics data available.
        </div>
      );
    }

    // Prepare data for the line graph (Overall Progress)
    const lineData = {
      labels: analytics.quizPerformance?.map(q => q.quizName) || [],
      datasets: [
        {
          type: 'bar',
          label: 'Class Average Score',
          data: analytics.quizPerformance?.map(q => q.averageScore) || [],
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            if (!ctx) return 'rgba(125, 211, 252, 0.7)';
            const gradient = ctx.createLinearGradient(0, context.chart.height, 0, 0);
            gradient.addColorStop(0, 'rgba(125, 211, 252, 0.6)');
            gradient.addColorStop(1, 'rgba(125, 211, 252, 0.9)');
            return gradient;
          },
          borderColor: 'rgba(125, 211, 252, 1)',
          barPercentage: 0.7,
          categoryPercentage: 0.7,
          order: 2,
        },
        {
          type: 'line',
          label: 'Class Average Score',
          data: analytics.quizPerformance?.map(q => q.averageScore) || [],
          borderColor: 'rgb(30, 58, 138)',
          backgroundColor: 'rgb(30, 58, 138)',
          tension: 0,
          fill: false,
          pointBackgroundColor: 'rgb(30, 58, 138)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(30, 58, 138)',
          pointRadius: 6,                   
          pointHoverRadius: 8,
          pointBorderWidth: 2,
          order: 1,
        }
      ]
    };


    // Function to generate bell curve data
    const generateBellCurveData = (studentAverages, quiz) => {
    
      
      // Get the max score and passing score from the quiz
      const maxScore = Number(quiz.overallScore) || 100;
      const passingScore = Number(quiz.passingScore) || 60;
      
      // Create ranges based on the max score
      const rangeSize = Math.ceil(maxScore / 5); // Divide max score into 5 ranges
      const ranges = [];
      
      for (let i = 0; i < 5; i++) {
        const min = i * rangeSize;
        const max = Math.min((i + 1) * rangeSize, maxScore);
        ranges.push({
          min,
          max,
          label: `${min}-${max}`
        });
      }

      const distribution = ranges.map(range => {
        const count = studentAverages.filter(avg => avg >= range.min && avg <= range.max).length;
        
        return {
          label: range.label,
          count,
          isPassingRange: range.min >= passingScore
        };
      });



      return {
        labels: distribution.map(d => d.label),
        datasets: [{
          label: 'Number of Students',
          data: distribution.map(d => d.count),
          backgroundColor: distribution.map(d => d.isPassingRange ? '#4CAF50' : '#2196F3'),
          borderColor: distribution.map(d => d.isPassingRange ? '#388E3C' : '#1976D2'),
          borderWidth: 1
        }]
      };
    };

    // Function to generate pie chart data for pass/fail
    const generatePassFailData = (studentAverages, passingScore) => {

      
      // Check if there's any data
      if (!studentAverages || studentAverages.length === 0) {
       
        return {
          labels: ['No Data'],
          datasets: [{
            data: [1],
            backgroundColor: ['#9CA3AF'] // gray-400
          }]
        };
      }
      
      // Always calculate pass/fail based on total students who took the quiz
      const totalStudents = studentAverages.length;
      const passed = studentAverages.filter(avg => avg >= passingScore).length;
      const failed = totalStudents - passed;
      

      return {
        labels: ['Passed', 'Failed'],
        datasets: [{
          data: [passed, failed],
          backgroundColor: ['#4CAF50', '#f44336']
        }]
      };
    };

    // Get all student scores for each quiz
    const getQuizScores = (quizId) => {
  
      
      if (!quizAttempts?.attempts || !quizAttempts?.students) {

        return [];
      }
      
      // Calculate average scores for each student in this quiz
      const studentAverages = {};
      
      // First, group attempts by student
      quizAttempts.attempts
        .filter(attempt => (attempt.quizId || attempt.quiz_id) === quizId)
        .forEach(attempt => {
          const studentId = attempt.studentId || attempt.user_id;
          if (!studentAverages[studentId]) {
            studentAverages[studentId] = {
              scores: [],
              average: 0
            };
          }
          studentAverages[studentId].scores.push(attempt.score || 0);
        });
      
      // Calculate average for each student
      Object.values(studentAverages).forEach(studentData => {
        const total = studentData.scores.reduce((sum, score) => sum + score, 0);
        studentData.average = total / studentData.scores.length;
      });
      
      // Return array of student averages
      const scores = Object.values(studentAverages).map(data => data.average);
      
    
      return scores;
    };

    return (
      <div className="space-y-8">
        {/* Quiz Filter Dropdown - Upper Right */}
        <div className="flex justify-end mb-6">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <div className="flex items-center">
                <MdOutlineQuiz className="mr-2 h-4 w-4" />
                {getCurrentQuizName()}
              </div>
              <FaChevronDown className="ml-2 h-4 w-4" />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setActiveQuizTab('overall');
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Overall Analytics
                  </button>
                  {analytics?.quizPerformance?.map((quiz, index) => (
                    <button
                      key={quiz.quizId || index}
                      onClick={() => {
                        setActiveQuizTab(quiz.quizId);
                        setIsDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {quiz.quizName || `Quiz ${index + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Overall Analytics */}
        {activeQuizTab === "overall" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <div className="bg-white  p-4 md:p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Total Students</h3>
                <p className="text-3xl font-bold text-blue-800">{analytics?.totalStudents || 0}</p>
              </div>
              <div className="bg-white  p-4 md:p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Average Score</h3>
                <p className="text-3xl font-bold text-blue-800">{analytics?.averageScore?.toFixed(2) || '0.00'}%</p>
              </div>
              <div className="bg-white  p-4 md:p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Mastery Rate</h3>
                <p className="text-3xl font-bold text-blue-800">{analytics?.masteryRate?.toFixed(2) || '0.00'}%</p>
                <p className="text-sm text-gray-500 mt-1">
                  Among {analytics?.totalStudents || 0} students in the classroom, {analytics?.studentsWithMastery || 0} {analytics?.studentsWithMastery === 1 ? 'student has' : 'students have'} passed all quizzes
                </p>
              </div>
              <div className="bg-white  p-4 md:p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Quizzes Taken</h3>
                <p className="text-3xl font-bold text-blue-800">{analytics?.uniqueQuizzesTaken || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Unique quizzes attempted</p>
              </div>
            </div>

            <div className="bg-white  p-4 md:p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Class Progress Over Time</h3>
              <div className="h-64 sm:h-80 lg:h-96 pr-2 lg:pr-4">
                <Chart
                  type="bar"
                  data={{
                    labels: (analytics.quizPerformance?.map(q => {
                      const label = q.quizName || '';
                      return label.length > 18 ? label.slice(0, 15) + '...' : label;
                    })) || [],
                    datasets: [
                      {
                        type: 'bar',
                        label: 'Class Average Score',
                        data: analytics.quizPerformance?.map(q => q.averageScore) || [],
                        backgroundColor: (context) => {
                          const ctx = context.chart.ctx;
                          if (!ctx) return 'rgba(125, 211, 252, 0.7)';
                          const gradient = ctx.createLinearGradient(0, context.chart.height, 0, 0);
                          gradient.addColorStop(0, 'rgba(125, 211, 252, 0.6)');
                          gradient.addColorStop(1, 'rgba(125, 211, 252, 0.9)');
                          return gradient;
                        },
                        borderColor: 'rgba(125, 211, 252, 1)',
                        barPercentage: 0.7,
                        categoryPercentage: 0.7,
                        order: 2,
                      },
                      {
                        type: 'line',
                        label: 'Class Average Score',
                        data: analytics.quizPerformance?.map(q => q.averageScore) || [],
                        borderColor: 'rgb(30, 58, 138)',
                        backgroundColor: 'rgb(30, 58, 138)',
                        tension: 0,
                        fill: false,
                        pointBackgroundColor: 'rgb(30, 58, 138)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgb(30, 58, 138)',
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBorderWidth: 2,
                        order: 1,
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      title: { display: false },
                      tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 12 },
                        titleColor: '#333',
                        bodyColor: '#666',
                        borderColor: 'rgba(0,0,0,0.1)',
                        borderWidth: 1,
                        padding: 15,
                        displayColors: true,
                        mode: 'index',
                        intersect: false,
                        filter: (context) => context.dataset.type === 'line',
                        callbacks: {
                          title: function(context) {
                            // Use the full quiz name from the original data instead of the truncated label
                            const quizIndex = context[0].dataIndex;
                            const fullQuizName = analytics.quizPerformance?.[quizIndex]?.quizName || context[0].label;
                            return fullQuizName;
                          },
                          label: function(context) {
                            const datasetLabel = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${datasetLabel}: ${value}%`;
                          }
                        }
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: { display: false },
                        grid: {
                          drawBorder: false,
                          color: 'rgba(200, 200, 200, 0.3)',
                        },
                        ticks: {
                          padding: 10,
                          stepSize: 10,
                          color: '#6b7280',
                        },
                      },
                      x: {
                        title: { display: false },
                        grid: { display: false },
                        ticks: {
                          autoSkip: false,
                          maxRotation: 0,
                          minRotation: 0,
                          color: '#6b7280',
                          callback: function(value, index, values) {
                            const label = this.getLabelForValue(value);
                            return label.length > 18 ? label.slice(0, 15) + '...' : label;
                      }
                    },
                      },
                    },
                    interaction: {
                      mode: 'index',
                      intersect: false,
                      },
                  }}
                />
              </div>
            </div>

            <div className="bg-white  p-4 md:p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Content Mastery & Progress Analysis</h3>
              <div className="min-h-[400px] lg:min-h-[500px]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 h-full">
                  {/* Left side: Content Mastery by Topic as horizontal segmented bars with blue gradient */}
                  <div className="space-y-4 lg:space-y-6">
                      <h4 className="font-medium text-blue-800 mb-2">Content Mastery by Topic</h4>
                    <div className="space-y-3 lg:space-y-4">
                        {Object.entries(analytics?.topicMastery || {})
                          .sort((a, b) => b[1].averagePassRate - a[1].averagePassRate)
                        .map(([topic, data]) => (
                          <div key={topic} className="flex items-center gap-2 lg:gap-4">
                            <span className="w-24 lg:w-32 truncate text-gray-700 text-xs lg:text-sm">{data.quizzes?.[0]?.quizName || topic}</span>
                            <div className="flex-1 flex items-center">
                              <div className="w-full h-2 lg:h-3 bg-gray-200 rounded-full overflow-hidden flex">
                                {Array.from({ length: 20 }).map((_, i) => {
                                  // Blue gradient: blue-400 to blue-900
                                  const blueShades = [
                                    'bg-blue-400', 'bg-blue-400', 'bg-blue-500', 'bg-blue-500',
                                    'bg-blue-600', 'bg-blue-600', 'bg-blue-700', 'bg-blue-700',
                                    'bg-blue-800', 'bg-blue-800', 'bg-blue-900', 'bg-blue-900',
                                    'bg-blue-900', 'bg-blue-800', 'bg-blue-700', 'bg-blue-600',
                                    'bg-blue-500', 'bg-blue-400', 'bg-blue-400', 'bg-blue-400'
                                  ];
                            return (
                                    <div
                                      key={i}
                                      className={`h-full ${i < Math.round(data.averagePassRate / 5) ? blueShades[i] : 'bg-gray-200'}`}
                                      style={{ width: '5%' }}
                                    />
                            );
                          })}
                      </div>
                              <span className="ml-2 lg:ml-3 text-xs lg:text-sm font-semibold text-gray-800 w-8 lg:w-10 text-right">{Math.round(data.averagePassRate)}%</span>
                            </div>
                          </div>
                        ))}
                    </div>
                    {/* Notes/Recommendations for Content Mastery */}
                    <div className="mt-3 lg:mt-4 p-2 lg:p-3 bg-blue-50 border-l-4 border-blue-400 rounded max-h-32 lg:max-h-44 overflow-y-auto">
                      <h5 className="font-semibold text-blue-700 mb-1 flex items-center gap-2 text-sm lg:text-base"><span>Notes</span></h5>
                      <ul className="list-disc list-inside text-xs lg:text-sm text-blue-800 space-y-1">
                        {Object.entries(analytics?.topicMastery || {})
                          .filter(([_, data]) => data.averagePassRate < 70)
                          .map(([topic, data]) => (
                            <li key={topic}>
                              Consider re-teaching <span className="font-semibold">{data.quizzes?.[0]?.quizName || topic}</span> (Current mastery: {data.averagePassRate.toFixed(1)}%)
                            </li>
                          ))}
                        {Object.entries(analytics?.topicMastery || {}).filter(([_, data]) => data.averagePassRate < 70).length === 0 && (
                          <li>All topics have satisfactory mastery rates.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Right side: Progress Analysis as horizontal segmented bars with violet gradient */}
                  <div className="space-y-4 lg:space-y-6">
                      <h4 className="font-medium text-purple-800 mb-2">Progress Analysis</h4>
                      <div className="space-y-3 lg:space-y-4">
                      {analytics?.quizPerformance?.map((quiz, idx) => (
                        <div key={quiz.quizId || idx} className="flex items-center gap-2 lg:gap-4">
                          <span className="w-24 lg:w-32 truncate text-gray-700 text-xs lg:text-sm">{quiz.quizName}</span>
                          <div className="flex-1 flex items-center">
                            <div className="w-full h-2 lg:h-3 bg-gray-200 rounded-full overflow-hidden flex">
                              {Array.from({ length: 20 }).map((_, i) => {
                                // Violet gradient: violet-400 to violet-900
                                const violetShades = [
                                  'bg-violet-400', 'bg-violet-400', 'bg-violet-500', 'bg-violet-500',
                                  'bg-violet-600', 'bg-violet-600', 'bg-violet-700', 'bg-violet-700',
                                  'bg-violet-800', 'bg-violet-800', 'bg-violet-900', 'bg-violet-900',
                                  'bg-violet-900', 'bg-violet-800', 'bg-violet-700', 'bg-violet-600',
                                  'bg-violet-500', 'bg-violet-400', 'bg-violet-400', 'bg-violet-400'
                                ];
                                return (
                                  <div
                                    key={i}
                                    className={`h-full ${i < Math.round(quiz.averageScore / 5) ? violetShades[i] : 'bg-gray-200'}`}
                                    style={{ width: '5%' }}
                                  />
                                );
                              })}
                            </div>
                            <span className="ml-2 lg:ml-3 text-xs lg:text-sm font-semibold text-gray-800 w-8 lg:w-10 text-right">{Math.round(quiz.averageScore)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Notes/Recommendations for Progress Analysis */}
                    <div className="mt-3 lg:mt-4 p-2 lg:p-3 bg-violet-50 border-l-4 border-violet-400 rounded max-h-32 lg:max-h-44 overflow-y-auto">
                      <h5 className="font-semibold text-violet-700 mb-1 flex items-center gap-2 text-sm lg:text-base"><span>Notes</span></h5>
                      <div className="text-xs lg:text-sm text-violet-800">
                        <div className="mb-1">
                          <span className="font-semibold">Overall Trend:</span> {(() => {
                            const quizzes = analytics?.quizPerformance || [];
                            const trend = quizzes.map((quiz, index) => {
                              if (index === 0) return null;
                              const prevQuiz = quizzes[index - 1];
                              return quiz.averageScore - prevQuiz.averageScore;
                            }).filter(Boolean);
                            const overallTrend = trend.length > 0 ? trend.reduce((sum, t) => sum + t, 0) / trend.length : 0;
                            return (
                              <span className={overallTrend > 0 ? 'text-green-600' : 'text-red-600'}>
                                {overallTrend > 0 ? '↑' : '↓'} {Math.abs(overallTrend).toFixed(1)}%
                              </span>
                            );
                          })()}
                        </div>
                        <div className="mb-1">
                          <span className="font-semibold">Quiz-to-Quiz Progress:</span>
                          <ul className="list-disc list-inside ml-2 lg:ml-4">
                            {(() => {
                              const quizzes = analytics?.quizPerformance || [];
                              return quizzes.map((quiz, index) => {
                                if (index === 0) return null;
                                const prevQuiz = quizzes[index - 1];
                                const improvement = quiz.averageScore - prevQuiz.averageScore;
                                return (
                                  <li key={quiz.quizId || index} className={improvement > 0 ? 'text-green-600' : 'text-red-600'}>
                                    {prevQuiz.quizName} → {quiz.quizName}: {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
                                  </li>
                                );
                              }).filter(Boolean);
                            })()}
                          </ul>
                        </div>
                        <div>
                          <span className="font-semibold">Recommendations:</span>
                          <ul className="list-disc list-inside ml-2 lg:ml-4">
                            {(() => {
                              const quizzes = analytics?.quizPerformance || [];
                              const negativeTrends = quizzes.map((quiz, index) => {
                                if (index === 0) return null;
                                const prevQuiz = quizzes[index - 1];
                                const improvement = quiz.averageScore - prevQuiz.averageScore;
                                if (improvement < 0) {
                                  return { from: prevQuiz.quizName, to: quiz.quizName };
                                }
                                return null;
                              }).filter(Boolean);
                              if (negativeTrends.length > 0) {
                                return negativeTrends.map((trend, idx) => (
                                  <li key={idx}>
                                    Encourage students to review <span className="font-semibold">{trend.from}</span> and <span className="font-semibold">{trend.to}</span> as scores declined between these quizzes.
                                  </li>
                                ));
                              } else {
                                return <li>Class is showing consistent or improving performance. Continue current strategies!</li>;
                              }
                            })()}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Individual Quiz Analytics */}
        {activeQuizTab !== 'overall' && analytics?.quizPerformance && (
          <div className="space-y-8">
            {(() => {
              const quiz = analytics.quizPerformance.find(q => q.quizId === activeQuizTab);
              
              if (!quiz) {
       
                return (
                  <div className="text-center py-8 text-gray-500">
                    No quiz data available.
                  </div>
                );
              }

              // Get the full quiz data from quizData to access overallScore
              const fullQuizData = quizData?.quizzes?.find(q => q.id === quiz.quizId);
           
              const quizScores = getQuizScores(quiz.quizId);
        
              
              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white  p-4 md:p-6 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-4">Score Distribution (Bell Curve)</h3>
                      <div className="h-64 sm:h-72 lg:h-80">
                        <Line
                          data={(() => {
                            // Use the same binning, but format for a Line chart
                            const bellData = generateBellCurveData(quizScores, fullQuizData || quiz);
                            const baseData = bellData.datasets[0].data;
                            // 1. Actual: baseData
                            // 2. Cumulative count
                            let cumulative = 0;
                            const cumulativeData = baseData.map(v => (cumulative += v));
                            return {
                              labels: bellData.labels,
                              datasets: [
                                {
                                  label: 'Actual (# students)',
                                  data: baseData,
                                  borderColor: '#60a5fa', // blue-400
                                  backgroundColor: 'rgba(96,165,250,0.08)',
                                  tension: 0.5,
                                  fill: false,
                                  borderWidth: 4,
                                  pointRadius: 3,
                                  pointHoverRadius: 6,
                                  order: 1,
                                },
                                {
                                  label: 'Cumulative (# students ≤ range)',
                                  data: cumulativeData,
                                  borderColor: '#2563eb', // blue-600
                                  backgroundColor: 'rgba(37,99,235,0.08)',
                                  tension: 0.5,
                                  fill: false,
                                  borderWidth: 3,
                                  pointRadius: 3,
                                  pointHoverRadius: 6,
                                  order: 2,
                                }
                              ]
                            };
                          })()}
                          options={{
                            maintainAspectRatio: false,
                            interaction: { mode: 'nearest', intersect: false },
                            scales: {
                              y: {
                                beginAtZero: true,
                                title: {
                                  display: true,
                                  text: 'Number of Students'
                                },
                                grid: {
                                  drawOnChartArea: true,
                                  color: '#e5e7eb',
                                },
                                ticks: {
                                  color: '#666',
                                },
                              },
                              x: {
                                title: {
                                  display: true,
                                  text: 'Score Ranges'
                                },
                                grid: {
                                  drawOnChartArea: false,
                                },
                                ticks: {
                                  color: '#666',
                                },
                              }
                            },
                            plugins: {
                              legend: {
                                display: true,
                                labels: {
                                  usePointStyle: true,
                                  boxWidth: 18,
                                  font: { weight: 'bold' },
                                }
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    const label = context.dataset.label || '';
                                    const value = context.raw;
                                    if (label.startsWith('Actual')) {
                                      return `${label}: ${value} students in this range`;
                                    } else if (label.startsWith('Cumulative')) {
                                      return `${label}: ${value} students scored ≤ this range`;
                                    }
                                    return `${label}: ${value}`;
                                  }
                                }
                              },
                              annotation: {},
                            },
                            plugins: [
                              // Custom plugin for horizontal bands, arrows, and labels
                              {
                                id: 'bellCurveBands',
                                afterDraw: (chart) => {
                                  const { ctx, chartArea, scales } = chart;
                                  if (!chartArea) return;
                                  // Draw horizontal bands (20%, 40%, 60%)
                                  const bandPercents = [0.2, 0.4, 0.6];
                                  const bandColors = ['#f3f4f6', '#e0e7ef', '#e3fcec'];
                                  bandPercents.forEach((p, i) => {
                                    const y = scales.y.getPixelForValue(scales.y.max * (1 - p));
                                    ctx.save();
                                    ctx.globalAlpha = 0.18;
                                    ctx.fillStyle = bandColors[i];
                                    ctx.fillRect(chartArea.left, y, chartArea.right - chartArea.left, 32);
                                    ctx.globalAlpha = 1;
                                    ctx.font = 'bold 16px sans-serif';
                                    ctx.fillStyle = '#222';
                                    ctx.textAlign = 'center';
                                    ctx.fillText(`${p * 100}%`, (chartArea.left + chartArea.right) / 2, y + 24);
                                    ctx.restore();
                                  });
                                  // Draw horizontal arrows and 10% labels below x-axis
                                  const xTicks = scales.x.getTicks();
                                  const yBottom = chartArea.bottom + 24;
                                  ctx.save();
                                  ctx.strokeStyle = '#bbb';
                                  ctx.fillStyle = '#222';
                                  ctx.lineWidth = 2;
                                  ctx.font = 'bold 14px sans-serif';
                                  ctx.textAlign = 'center';
                                  for (let i = 0; i < xTicks.length - 1; i++) {
                                    const x1 = scales.x.getPixelForTick(i);
                                    const x2 = scales.x.getPixelForTick(i + 1);
                                    // Draw arrow
                                    ctx.beginPath();
                                    ctx.moveTo(x1, yBottom);
                                    ctx.lineTo(x2, yBottom);
                                    ctx.stroke();
                                    // Draw arrow heads
                                    ctx.beginPath();
                                    ctx.moveTo(x2 - 6, yBottom - 4);
                                    ctx.lineTo(x2, yBottom);
                                    ctx.lineTo(x2 - 6, yBottom + 4);
                                    ctx.stroke();
                                    // Draw label
                                    ctx.fillText('10%', (x1 + x2) / 2, yBottom + 18);
                                  }
                                  ctx.restore();
                                }
                              }
                            ]
                          }}
                        />
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Perfect Score: {fullQuizData?.overallScore || quiz.overallScore || 'N/A'}</p>
                        <p>Passing Score: {quiz.passingScore}</p>
                      </div>
                    </div>
                    <div className="bg-white  p-4 md:p-6 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-4">Pass/Fail Distribution</h3>
                      <div className="h-64 sm:h-72 lg:h-80">
                        <Pie
                          data={generatePassFailData(quizScores, quiz.passingScore)}
                          options={{
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'top',
                                display: quizScores && quizScores.length > 0
                              },
                              tooltip: {
                                enabled: quizScores && quizScores.length > 0,
                                callbacks: {
                                  label: function(context) {
                                    if (context.label === 'No Data') {
                                      return 'No student data available';
                                    }
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.raw / total) * 100).toFixed(1);
                                    return `${context.label}: ${context.raw} students (${percentage}%)`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    <div className="bg-white  p-4 md:p-6 rounded-lg shadow">
                      <h3 className="text-lg font-bold text-primary mb-2">Average Score</h3>
                      <p className="text-3xl font-bold text-blue-800">{quiz.averageScore?.toFixed(2)}%</p>
                    </div>
                    <div className="bg-white  p-4 md:p-6 rounded-lg shadow">
                      <h3 className="text-lg font-bold text-primary mb-2">Pass Rate</h3>
                      <p className="text-3xl font-bold text-blue-800">{quiz.passRate?.toFixed(2)}%</p>
                    </div>
                    <div className="bg-white  p-4 md:p-6 rounded-lg shadow">
                      <h3 className="text-lg font-bold text-primary mb-2">Students Who Took the Quiz</h3>
                      <p className="text-3xl font-bold text-blue-800">{(() => {
                        // Count unique students who took the quiz
                        const uniqueStudents = new Set();
                        if (quizAttempts?.attempts) {
                          quizAttempts.attempts.forEach(attempt => {
                            if ((attempt.quizId || attempt.quiz_id) === quiz.quizId) {
                              uniqueStudents.add(attempt.studentId || attempt.user_id);
                            }
                          });
                        }
                        return uniqueStudents.size;
                      })()}</p>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-3 md:p-6">
      {/* Section Selector */}
      <div className="flex justify-center mb-8">
        <nav className="flex space-x-4" aria-label="Tabs">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-sm ${
              visibleSection === "reports"
                ? "bg-blue-900 text-gray-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setVisibleSection("reports")}
          >
            Class Records
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-sm ${
              visibleSection === "analytics"
                ? "bg-blue-900 text-gray-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setVisibleSection("analytics")}
          >
            Analytics
          </button>
        </nav>
      </div>

      {visibleSection === "reports" ? (
        <>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <FaSpinner className="animate-spin text-blue-600 text-2xl" />
            </div>
          ) : selectedReport ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <Header type="h3" fontSize="lg" weight="semibold" className="text-gray-700 ml-2">
                  {selectedReport.reportName}
                </Header>
                {/* {selectedReport.hasFile && (
                  <button
                    onClick={() => handleGenerateReport(selectedReport.fileType)}
                    className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <FaDownload className="mr-2" />
                    Download {selectedReport.fileType === 'CSV' ? 'CSV' : 'Excel'}
                  </button>
                )} */}
              </div>
              {renderClassRecord()}
            </div>
          ) : quizData?.quizzes && quizAttempts?.attempts ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <Header type="h3" fontSize="lg" weight="semibold" className="text-gray-700">
                  Class Record
                </Header>
              </div>
              {renderClassRecord()}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No reports available. Generate a new report to see it here.
            </div>
          )}
        </>
      ) : (
        renderAnalytics()
      )}

      {renderAttemptModal()}
    </div>
  );
};

export default ClassRecordManager; 


