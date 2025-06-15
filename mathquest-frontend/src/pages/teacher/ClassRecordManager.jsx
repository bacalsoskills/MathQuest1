import React, { useState, useEffect } from "react";
import { reportService } from "../../services/reportService";
import { Header } from '../../ui/heading';
import { FaDownload, FaSpinner, FaFileExcel, FaFileCsv, FaInfoCircle } from "react-icons/fa";
import { BiAnalyse } from "react-icons/bi";
import { toast } from "react-hot-toast";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { useAuth } from "../../context/AuthContext";
import Modal from "../../ui/modal.jsx";
import classroomService from "../../services/classroomService";
import { leaderboardService } from "../../services/leaderboardService";

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Calculate student ranks based on average score
const calculateRanks = (students, quizzes) => {
  // Log quiz data for debugging
  console.log("[ClassRecordManager] Raw quiz data:", JSON.stringify(quizzes, null, 2));
  
  // Calculate total possible points across all quizzes
  const totalPossiblePoints = quizzes.reduce((sum, quiz) => {
    const quizPoints = Number(quiz.overallScore) || 0;
    console.log(`[ClassRecordManager] Quiz ${quiz.id} (${quiz.quizName}): overallScore = ${quiz.overallScore}, parsed as ${quizPoints}`);
    return sum + quizPoints;
  }, 0);
  
  console.log("[ClassRecordManager] Total possible points across all quizzes:", totalPossiblePoints);

  return students
    .map((student, index) => ({ ...student, index }))
    .map(student => {
      // Calculate total score and check completion status
      const totalScore = student.quizScores?.reduce((sum, score) => {
        // Handle both object and number scores
        const scoreValue = typeof score === 'object' ? (score?.score || 0) : (Number(score) || 0);
        console.log(`[ClassRecordManager] Adding score ${score} (parsed as ${scoreValue}) to total`);
        return sum + scoreValue;
      }, 0) || 0;
      
      console.log(`[ClassRecordManager] Student ${student.id} total score: ${totalScore}`);
      
      // Calculate average based on total possible points
      const averageScore = totalPossiblePoints > 0 
        ? ((totalScore / totalPossiblePoints) * 100).toFixed(2) 
        : 0;
      
      console.log(`[ClassRecordManager] Student ${student.id} average score: ${averageScore}% (${totalScore}/${totalPossiblePoints})`);
      
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
    console.log("[Analytics] Missing required data:", {
      hasQuizzes: !!quizData?.quizzes,
      hasAttempts: !!quizAttempts?.attempts,
      hasStudents: !!quizAttempts?.students
    });
    return null;
  }

  console.log("[Analytics] Calculating analytics for all students");
  console.log("[Analytics] Total students:", quizAttempts.students.length);
  console.log("[Analytics] Total quizzes:", quizData.quizzes.length);
  console.log("[Analytics] Total attempts:", quizAttempts.attempts.length);

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
        
        console.log(`[Analytics] Student ${student.id} Quiz ${quiz.id}:`, {
          average: studentData.average,
          overallScore: quiz.overallScore,
          percentageScore,
          passingPercentage,
          passed: percentageScore >= passingPercentage
        });
        
        return percentageScore >= passingPercentage;
      });
      
      if (allPassed) {
        studentsWithMastery++;
        console.log(`[Analytics] Student ${student.id} achieved mastery`);
      }
    }
  });

  const masteryRate = students.length > 0 ? (studentsWithMastery / students.length) * 100 : 0;
  console.log("[Analytics] Mastery rate calculation:", {
    studentsWithMastery,
    totalStudents: students.length,
    masteryRate
  });

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

  // Add new useEffect for analytics calculation
  useEffect(() => {
    if (quizData?.quizzes && quizAttempts?.attempts && quizAttempts?.students) {
      console.log("[Analytics] Calculating analytics with new data");
      const calculatedAnalytics = calculateAnalytics(quizData, quizAttempts);
      setAnalytics(calculatedAnalytics);
      setAnalyticsLoading(false);
    }
  }, [quizData, quizAttempts]);

  useEffect(() => {
    if (!currentUser?.id) {
      console.error("No user found in context");
      console.log("Auth context:", { currentUser, token });
      toast.error("Please log in to access this feature");
      return;
    }

    if (!token) {
      console.error("No authentication token found");
      console.log("Current token state:", token);
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        toast.error("Please log in to access this feature");
        return;
      }
    }

    console.log("Current user:", currentUser);
    console.log("Current token:", token ? "Present" : "Not present");
    fetchData();
  }, [classroomId, currentUser, token]);

  const fetchData = async () => {
    if (!currentUser?.id || (!token && !localStorage.getItem('token'))) {
      return;
    }

    try {
      console.log("Fetching data for classroom:", classroomId);
      console.log("Current user ID:", currentUser.id);
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
      console.log("Fetched classroom data:", classroomData);

      // Fetch reports
      const reportData = await reportService.getReportsByClassroom(classroomId);
      console.log("Fetched reports:", reportData);
      
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
      console.log("Fetched analytics:", analyticsData);

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
      console.error("No user found in context");
      toast.error("Please log in to generate reports");
      return;
    }

    if (!classroom) {
      console.error("No classroom data available");
      toast.error("Failed to load classroom data");
      return;
    }

    try {
      if (fileType === 'EXCEL') {
        setGeneratingExcelReport(true);
      } else if (fileType === 'CSV') {
        setGeneratingCsvReport(true);
      }
      console.log("%c=== STARTING NEW REPORT GENERATION ===", "background: blue; color: white; font-size: 16px");
      
      // Validate required data
      if (!quizData?.quizzes || !quizAttempts?.attempts || !quizAttempts?.students) {
        console.error("Missing required data:", {
          hasQuizzes: !!quizData?.quizzes,
          hasAttempts: !!quizAttempts?.attempts,
          hasStudents: !!quizAttempts?.students
        });
        throw new Error("Required data is not available");
      }

      // Log data for debugging
      console.log("Data for report generation:", {
        quizzes: quizData.quizzes,
        attempts: quizAttempts.attempts,
        students: quizAttempts.students,
        classroom: classroom
      });

      // Create quiz metadata and validate quiz IDs
      const quizMap = new Map(quizData.quizzes.map(quiz => [quiz.id, quiz]));
      console.log("Quiz map:", quizMap);

      // Validate attempts have matching quizzes
      const validAttempts = quizAttempts.attempts.filter(attempt => {
        const hasMatchingQuiz = quizMap.has(attempt.quizId);
        if (!hasMatchingQuiz) {
          console.warn(`Found attempt with no matching quiz: Attempt ID ${attempt.id}, Quiz ID ${attempt.quizId}`);
        }
        return hasMatchingQuiz;
      });

      console.log("Valid attempts:", validAttempts);

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

      console.log("Sending report generation request:", {
        classroomId,
        teacherId: currentUser.id,
        reportName,
        fileType,
        reportDescription: JSON.parse(reportDescription) // Log parsed version for readability
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

      console.log("New report generated:", newReport);

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
      console.error("%c=== ERROR IN REPORT GENERATION ===", "color: red; font-weight: bold");
      console.error("Full error:", error);
      
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
    console.log('[ClassRecordManager] Handling attempt click:', { attempt, attemptsByStudent });
    
    try {
      // Get all attempts for this student and quiz
      const studentAttempts = attemptsByStudent[attempt.studentId]?.attempts[attempt.quizId]?.attempts || [];
      const totalAttempts = studentAttempts.length;
      console.log('[ClassRecordManager] Student attempts:', { studentAttempts, totalAttempts });
      
      // Calculate average score
      const averageScore = studentAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts;
      console.log('[ClassRecordManager] Average score calculation:', { averageScore });

      // Find highest score and its attempt number
      const highestScoreAttempt = studentAttempts.reduce((best, current, index) => {
        if (!best || current.score > best.score) {
          return { ...current, attemptNumber: index + 1 };
        }
        return best;
      }, null);

      // Fetch the leaderboard for this specific quiz
      const quizLeaderboard = await leaderboardService.getLeaderboardByQuiz(attempt.quizId);
      console.log('[ClassRecordManager] Quiz leaderboard:', quizLeaderboard);

      // Find the student's rank in this quiz
      const studentRank = quizLeaderboard?.findIndex(
        entry => entry.studentId === attempt.studentId
      ) + 1;
      console.log('[ClassRecordManager] Student rank:', studentRank);
      
      // Calculate time spent in minutes and seconds
      const timeSpentSeconds = attempt.timeSpentSeconds || attempt.timeSpent || 0;
      const minutes = Math.floor(timeSpentSeconds / 60);
      const seconds = timeSpentSeconds % 60;
      const formattedTime = `${minutes}.${seconds.toString().padStart(2, '0')}`;
      
      console.log('[ClassRecordManager] Time calculation:', {
        timeSpentSeconds,
        minutes,
        seconds,
        formattedTime
      });
      
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
      console.error('[ClassRecordManager] Error fetching leaderboard:', error);
      toast.error('Failed to fetch student rank');
    }
  };

  const renderAttemptModal = () => {
    if (!selectedAttempt) return null;
    
    console.log('[ClassRecordManager] Rendering attempt modal with data:', selectedAttempt);

    return (
      <Modal
        isOpen={isAttemptModalOpen}
        onClose={() => setIsAttemptModalOpen(false)}
        title="Quiz Attempt Details"
      >
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-sm">
              <p><strong>Average Score:</strong> {selectedAttempt.averageScore}</p>
              <p><strong>Highest Score:</strong> {selectedAttempt.highestScore}</p>
              <p><strong>Best Score Attempt:</strong> #{selectedAttempt.bestScoreAttemptNumber}</p>
              <p><strong>Total Attempts:</strong> {selectedAttempt.totalAttempts}</p>
              <p><strong>Status:</strong> {selectedAttempt.passed ? 'Passed' : 'Failed'}</p>
              <p><strong>Time Spent:</strong> {selectedAttempt.timeSpent || 'N/A'}</p>
              <p><strong>Rank:</strong> {selectedAttempt.rank || 'N/A'}</p>
              <p><strong>Completed:</strong> {selectedAttempt.completedAt ? new Date(selectedAttempt.completedAt).toLocaleString() : 'N/A'}</p>
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

    console.log("Quiz Data Structure:", quizData);
    console.log("Quiz Attempts Structure:", quizAttempts);

    const { quizzes } = quizData;
    const { attempts, students } = quizAttempts;

    console.log("First quiz sample:", quizzes[0]);
    console.log("First attempt sample:", attempts[0]);
    console.log("First student sample:", students[0]);

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
        {/* Sort button moved outside the table */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-2 border rounded-md flex items-center bg-white shadow-sm hover:bg-gray-50"
          >
            Sort: {sortOrder === 'desc' ? 'Highest Rank' : 'Lowest Rank'}
            {sortOrder === 'desc' ? ' ↓' : ' ↑'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Rank {sortOrder === 'desc' ? '↓' : '↑'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                {quizzes.map(quiz => (
                  <th key={quiz.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {quiz.quizName}
                    <div className="text-xxs font-normal normal-case text-gray-400">
                      Quiz Items: {quiz.totalItems} | Overall Score: {quiz.overallScore} | Passing: {quiz.passingScore}
                    </div>
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Points
                  <div className="text-xxs font-normal normal-case text-gray-400">
                    (Max: {quizzes.reduce((sum, quiz) => sum + (Number(quiz.overallScore) || 0), 0)})
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStudents.map(student => (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {student.rank}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                      <td key={quiz.id} className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {student.totalScore.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      student.averageScore >= 60 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {student.averageScore}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
      console.log("[Analytics] No analytics data available");
      return (
        <div className="text-center py-8 text-gray-500">
          No analytics data available.
        </div>
      );
    }

    console.log("[Analytics] Raw analytics data:", analytics);
    console.log("[Analytics] Quiz Performance data:", analytics.quizPerformance);
    console.log("[Analytics] Quiz Attempts data:", quizAttempts);

    // Prepare data for the line graph (Overall Progress)
    const lineData = {
      labels: analytics.quizPerformance?.map(q => q.quizName) || [],
      datasets: [
        {
          label: 'Class Average Score',
          data: analytics.quizPerformance?.map(q => q.averageScore) || [],
          borderColor: '#2196F3',
          tension: 0.4,
          fill: false,
           // Customize the dots (points)
          pointBackgroundColor: '#fb923c', 
          pointBorderColor: '#1e3a8a',     
          pointRadius: 6,                   
          pointHoverRadius: 8   ,          

          clip: { top: 10, bottom: 0, left: 0, right: 0 }
        }
      ]
    };

    console.log("[Analytics] Line graph data:", lineData);

    // Function to generate bell curve data
    const generateBellCurveData = (studentAverages, quiz) => {
      console.log("[Analytics] Generating bell curve data for student averages:", studentAverages);
      
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
        console.log(`[Analytics] Range ${range.label}: ${count} students`);
        return {
          label: range.label,
          count,
          isPassingRange: range.min >= passingScore
        };
      });

      console.log("[Analytics] Final bell curve distribution:", distribution);

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
      console.log("[Analytics] Generating pass/fail data:", { studentAverages, passingScore });
      
      // Always calculate pass/fail based on total students who took the quiz
      const totalStudents = studentAverages.length;
      const passed = studentAverages.filter(avg => avg >= passingScore).length;
      const failed = totalStudents - passed;
      
      console.log("[Analytics] Pass/Fail counts:", { passed, failed, total: totalStudents });
      
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
      console.log("[Analytics] Getting scores for quiz:", quizId);
      
      if (!quizAttempts?.attempts || !quizAttempts?.students) {
        console.log("[Analytics] No quiz attempts or students data available");
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
      
      console.log("[Analytics] Found average scores for quiz:", scores);
      return scores;
    };

    return (
      <div className="space-y-8">
        {/* Analytics Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                console.log("[Analytics] Switching to Overall tab");
                setVisibleSection("analytics");
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                visibleSection === "analytics"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overall
            </button>
            {analytics?.quizPerformance?.map((quiz, index) => (
              <button
                key={quiz.quizId || index}
                onClick={() => {
                  console.log(`[Analytics] Switching to quiz tab:`, { quizName: quiz.quizName, index });
                  setVisibleSection(`quiz-${index}`);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  visibleSection === `quiz-${index}`
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {quiz.quizName || `Quiz ${index + 1}`}
              </button>
            ))}
          </nav>
        </div>

        {/* Overall Analytics */}
        {visibleSection === "analytics" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Total Students</h3>
                <p className="text-3xl font-bold text-blue-600">{analytics?.totalStudents || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Average Score</h3>
                <p className="text-3xl font-bold text-green-600">{analytics?.averageScore?.toFixed(2) || '0.00'}%</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Mastery Rate</h3>
                <p className="text-3xl font-bold text-purple-600">{analytics?.masteryRate?.toFixed(2) || '0.00'}%</p>
                <p className="text-sm text-gray-500 mt-1">
                  Among {analytics?.totalStudents || 0} students in the classroom, {analytics?.studentsWithMastery || 0} {analytics?.studentsWithMastery === 1 ? 'student has' : 'students have'} passed all quizzes
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Quizzes Taken</h3>
                <p className="text-3xl font-bold text-orange-600">{analytics?.uniqueQuizzesTaken || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Unique quizzes attempted</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Class Progress Over Time</h3>
              <div className="h-96">
                <Line 
                  data={lineData}
                  options={{
                    maintainAspectRatio: false,
                    layout: {
                      padding: {
                        top: 10
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: 'Score (%)'
                        },
                        ticks: {
                          padding: 10
                        },
                        grid: {
                          display: true 
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Quizzes'
                        },
                        offset: true,
                        ticks: {
                          padding: 10
                        },
                        grid: {
                          display: false 
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: false 
                      },
                      tooltip: {
                        enabled: true 
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Content Mastery & Progress Analysis</h3>
              <div className="h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  {/* Left side: Content Mastery */}
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Content Mastery by Topic</h4>
                      <div className="space-y-3">
                        {Object.entries(analytics?.topicMastery || {})
                          .sort((a, b) => b[1].averagePassRate - a[1].averagePassRate)
                          .map(([topic, data]) => {
                            const masteryLevel = data.averagePassRate >= 80 ? 'High' :
                                               data.averagePassRate >= 60 ? 'Medium' : 'Low';
                            const needsReteaching = data.averagePassRate < 70;
                            
                            return (
                              <div key={topic} className={`p-2 rounded ${needsReteaching ? 'bg-red-50' : 'bg-white'}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-gray-700">{data.quizzes?.[0]?.quizName || topic}</span>
                                  <div className="flex items-center space-x-2">
                                    <span className={`text-sm px-2 py-1 rounded-full ${
                                      masteryLevel === 'High' ? 'bg-green-100 text-green-800' :
                                      masteryLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {masteryLevel}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                      {data.averagePassRate.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      data.averagePassRate >= 80 ? 'bg-green-500' :
                                      data.averagePassRate >= 60 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${data.averagePassRate}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Progress Analysis */}
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2">Progress Analysis</h4>
                      <div className="space-y-4">
                        {/* Overall Trend */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-700">Overall Trend</span>
                            {(() => {
                              const quizzes = analytics?.quizPerformance || [];
                              const trend = quizzes.map((quiz, index) => {
                                if (index === 0) return null;
                                const prevQuiz = quizzes[index - 1];
                                return quiz.averageScore - prevQuiz.averageScore;
                              }).filter(Boolean);
                              
                              const overallTrend = trend.reduce((sum, t) => sum + t, 0) / trend.length;
                              
                              return (
                                <span className={`font-medium ${
                                  overallTrend > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {overallTrend > 0 ? '↑' : '↓'} {Math.abs(overallTrend).toFixed(1)}%
                                </span>
                              );
                            })()}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                (() => {
                                  const quizzes = analytics?.quizPerformance || [];
                                  const trend = quizzes.map((quiz, index) => {
                                    if (index === 0) return null;
                                    const prevQuiz = quizzes[index - 1];
                                    return quiz.averageScore - prevQuiz.averageScore;
                                  }).filter(Boolean);
                                  const overallTrend = trend.reduce((sum, t) => sum + t, 0) / trend.length;
                                  return overallTrend > 0 ? 'bg-green-500' : 'bg-red-500';
                                })()
                              }`}
                              style={{ 
                                width: `${Math.min(Math.abs(
                                  (() => {
                                    const quizzes = analytics?.quizPerformance || [];
                                    const trend = quizzes.map((quiz, index) => {
                                      if (index === 0) return null;
                                      const prevQuiz = quizzes[index - 1];
                                      return quiz.averageScore - prevQuiz.averageScore;
                                    }).filter(Boolean);
                                    return trend.reduce((sum, t) => sum + t, 0) / trend.length;
                                  })()
                                ) * 2, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>

                        {/* Quiz-to-Quiz Progress */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Quiz-to-Quiz Progress</h5>
                          <div className="space-y-2">
                            {(() => {
                              const quizzes = analytics?.quizPerformance || [];
                              return quizzes.map((quiz, index) => {
                                if (index === 0) return null;
                                const prevQuiz = quizzes[index - 1];
                                const improvement = quiz.averageScore - prevQuiz.averageScore;
                                
                                return (
                                  <div key={quiz.quizId} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">
                                      {prevQuiz.quizName} → {quiz.quizName}
                                    </span>
                                    <span className={`font-medium ${
                                      improvement > 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
                                    </span>
                                  </div>
                                );
                              }).filter(Boolean);
                            })()}
                          </div>
                        </div>

                        {/* Recommendations */}
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h5>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            {Object.entries(analytics?.topicMastery || {})
                              .filter(([_, data]) => data.averagePassRate < 70)
                              .map(([topic, data]) => (
                                <li key={topic}>
                                  Consider re-teaching {data.quizzes?.[0]?.quizName || topic} (Current mastery: {data.averagePassRate.toFixed(1)}%)
                                </li>
                              ))}
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
        {visibleSection.startsWith('quiz-') && analytics?.quizPerformance && (
          <div className="space-y-8">
            {(() => {
              const quizIndex = parseInt(visibleSection.split('-')[1]);
              const quiz = analytics.quizPerformance[quizIndex];
              
              if (!quiz) {
                console.error("[Analytics] No quiz data found for index:", quizIndex);
                return (
                  <div className="text-center py-8 text-gray-500">
                    No quiz data available.
                  </div>
                );
              }

              // Get the full quiz data from quizData to access overallScore
              const fullQuizData = quizData?.quizzes?.find(q => q.id === quiz.quizId);
              console.log("[Analytics] Rendering quiz analytics:", { 
                quizIndex, 
                quiz,
                fullQuizData,
                overallScore: fullQuizData?.overallScore
              });
              
              const quizScores = getQuizScores(quiz.quizId);
              console.log("[Analytics] Quiz scores for rendering:", quizScores);
              
              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-4">Score Distribution (Bell Curve)</h3>
                      <div className="h-80">
                        <Line 
                          data={(() => {
                            // Use the same binning, but format for a Line chart
                            const bellData = generateBellCurveData(quizScores, fullQuizData || quiz);
                            return {
                              labels: bellData.labels,
                              datasets: [
                                {
                                  label: 'Number of Students',
                                  data: bellData.datasets[0].data,
                                  borderColor: '#1976D2',
                                  backgroundColor: 'rgba(33, 150, 243, 0.25)', // more visible blue shade fill
                                  pointBackgroundColor: '#1976D2',
                                  pointBorderColor: '#1976D2',
                                  tension: 0.5, // smooth curve
                                  fill: true, // fill area under the curve
                                  borderWidth: 3,
                                  pointRadius: 4,
                                  pointHoverRadius: 6,
                                }
                              ]
                            };
                          })()}
                          options={{
                            maintainAspectRatio: false,
                            scales: {
                              y: {
                                beginAtZero: true,
                                title: {
                                  display: true,
                                  text: 'Number of Students'
                                }
                              },
                              x: {
                                title: {
                                  display: true,
                                  text: 'Score Ranges'
                                }
                              }
                            },
                            plugins: {
                              legend: {
                                display: false
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    return `Students: ${context.raw}`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Perfect Score: {fullQuizData?.overallScore || quiz.overallScore || 'N/A'}</p>
                        <p>Passing Score: {quiz.passingScore}</p>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-4">Pass/Fail Distribution</h3>
                      <div className="h-80">
                        <Pie 
                          data={generatePassFailData(quizScores, quiz.passingScore)}
                          options={{
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'top'
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-2">Average Score</h3>
                      <p className="text-3xl font-bold text-green-600">{quiz.averageScore?.toFixed(2)}%</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-2">Pass Rate</h3>
                      <p className="text-3xl font-bold text-blue-600">{quiz.passRate?.toFixed(2)}%</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-2">Students Who Took the Quiz</h3>
                      <p className="text-3xl font-bold text-purple-600">{(() => {
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
    <div className="bg-white rounded-lg shadow p-6">
      {/* Section Selector */}
      <div className="mb-6">
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            className={`py-2 px-4 ${
              visibleSection === "reports"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setVisibleSection("reports")}
          >
            Class Records
          </button>
          <button
            className={`py-2 px-4 ${
              visibleSection === "analytics"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setVisibleSection("analytics")}
          >
            Analytics
          </button>
        </div>
      </div>

      {visibleSection === "reports" ? (
        <>
          <div className="mb-6">
            <div className="flex space-x-4 justify-end">
              <button
                onClick={() => handleGenerateReport('EXCEL')}
                disabled={generatingExcelReport}
                className={`px-4 py-2 rounded-md text-white ${
                  generatingExcelReport ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                } flex items-center justify-center`}
              >
                {generatingExcelReport ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" /> Generating...
                  </>
                ) : (
                  <>
                    <FaFileExcel className="mr-2" /> Download Excel
                  </>
                )}
              </button>
              <button
                onClick={() => handleGenerateReport('CSV')}
                disabled={generatingCsvReport}
                className={`px-4 py-2 rounded-md text-white ${
                  generatingCsvReport ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } flex items-center justify-center`}
              >
                {generatingCsvReport ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" /> Generating...
                  </>
                ) : (
                  <>
                    <FaFileCsv className="mr-2" /> Download CSV
                  </>
                )}
              </button>
            </div>
          </div>

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
                  Current Class Record
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


