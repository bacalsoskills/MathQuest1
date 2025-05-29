import React, { useState, useEffect } from "react";
import { reportService } from "../../services/reportService";
import { Header } from '../../ui/heading';
import { FaDownload, FaSpinner, FaFileExcel, FaFileCsv, FaInfoCircle } from "react-icons/fa";
import { BiAnalyse } from "react-icons/bi";
import { toast } from "react-hot-toast";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { useAuth } from "../../context/AuthContext";
import Modal from "../../ui/modal.jsx";
import classroomService from "../../services/classroomService";

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Calculate student ranks based on average score
const calculateRanks = (students, quizzes) => {
  // Log quiz data for debugging
  console.log("Raw quiz data:", JSON.stringify(quizzes, null, 2));
  
  // Calculate total possible points across all quizzes
  const totalPossiblePoints = quizzes.reduce((sum, quiz) => {
    // Use overallScore instead of overall_score
    const quizPoints = Number(quiz.overallScore) || 0;
    console.log(`Quiz ${quiz.id} (${quiz.quizName}): overallScore = ${quiz.overallScore}, parsed as ${quizPoints}`);
    return sum + quizPoints;
  }, 0);
  
  console.log("Total possible points across all quizzes:", totalPossiblePoints);

  return students
    .map((student, index) => ({ ...student, index }))
    .map(student => {
      // Calculate total score and check completion status
      const totalScore = student.quizScores?.reduce((sum, score) => {
        const scoreValue = Number(score) || 0;
        console.log(`Adding score ${score} (parsed as ${scoreValue}) to total`);
        return sum + scoreValue;
      }, 0) || 0;
      
      console.log(`Student ${student.id} total score: ${totalScore}`);
      
      // Calculate average based on total possible points
      const averageScore = totalPossiblePoints > 0 
        ? ((totalScore / totalPossiblePoints) * 100).toFixed(2) 
        : 0;
      
      console.log(`Student ${student.id} average score: ${averageScore}% (${totalScore}/${totalPossiblePoints})`);
      
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

  // Organize attempts by student and quiz, keeping only highest scores
  const studentQuizScores = {};
  const studentQuizPassStatus = {}; // Track pass/fail status for highest attempts

  // Initialize student records
  students.forEach(student => {
    studentQuizScores[student.id] = {};
    studentQuizPassStatus[student.id] = {};
  });

  // First pass: organize attempts and find highest scores
  attempts.forEach(attempt => {
    const studentId = attempt.studentId || attempt.user_id;
    const quizId = attempt.quizId || attempt.quiz_id;
    const score = attempt.score || 0;
    const quiz = quizzes.find(q => q.id === quizId);
    
    if (!quiz) return; // Skip if quiz not found

    if (!studentQuizScores[studentId]) {
      studentQuizScores[studentId] = {};
      studentQuizPassStatus[studentId] = {};
    }

    // Only update if this is a higher score than previous attempts
    if (!studentQuizScores[studentId][quizId] || 
        studentQuizScores[studentId][quizId] < score) {
      studentQuizScores[studentId][quizId] = score;
      // Update pass status based on the highest score
      studentQuizPassStatus[studentId][quizId] = score >= quiz.passingScore;
    }
  });

  // Calculate pass/fail counts - only count one result per student-quiz pair
  let totalPassed = 0;
  let totalFailed = 0;

  // Count only one result per student-quiz pair
  Object.entries(studentQuizPassStatus).forEach(([studentId, quizStatuses]) => {
    Object.entries(quizStatuses).forEach(([quizId, passed]) => {
      // Only count if the student has attempted this quiz
      if (studentQuizScores[studentId][quizId] !== undefined) {
        if (passed) {
          totalPassed++;
        } else {
          totalFailed++;
        }
      }
    });
  });

  // Calculate quiz performance metrics
  const quizPerformance = quizzes.map(quiz => {
    let totalStudents = 0;
    let passedStudents = 0;
    let totalScore = 0;

    students.forEach(student => {
      const score = studentQuizScores[student.id]?.[quiz.id];
      if (score !== undefined) {
        totalStudents++;
        totalScore += score;
        if (score >= quiz.passingScore) {
          passedStudents++;
        }
      }
    });

    const passRate = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0;
    const failRate = totalStudents > 0 ? ((totalStudents - passedStudents) / totalStudents) * 100 : 0;
    const quizAverage = totalStudents > 0 ? totalScore / totalStudents : 0;

    return {
      quizName: quiz.quizName,
      passRate: parseFloat(passRate.toFixed(2)),
      failRate: parseFloat(failRate.toFixed(2)),
      averageScore: parseFloat(quizAverage.toFixed(2)),
      totalStudents,
      passedStudents
    };
  });

  // Calculate global average score
  let totalGlobalScore = 0;
  let totalGlobalAttempts = 0;

  Object.values(studentQuizScores).forEach(quizScores => {
    Object.values(quizScores).forEach(score => {
      totalGlobalScore += score;
      totalGlobalAttempts++;
    });
  });

  const globalAverageScore = totalGlobalAttempts > 0 
    ? (totalGlobalScore / totalGlobalAttempts) 
    : 0;

  // Calculate score distribution
  const scoreRanges = [
    { min: 90, max: 100, label: 'A', count: 0 },
    { min: 80, max: 89, label: 'B', count: 0 },
    { min: 70, max: 79, label: 'C', count: 0 },
    { min: 60, max: 69, label: 'D', count: 0 },
    { min: 0, max: 59, label: 'F', count: 0 }
  ];

  Object.values(studentQuizScores).forEach(quizScores => {
    Object.values(quizScores).forEach(score => {
      const range = scoreRanges.find(r => score >= r.min && score <= r.max);
      if (range) {
        range.count++;
      }
    });
  });

  // Calculate median score
  const allScores = [];
  Object.values(studentQuizScores).forEach(quizScores => {
    Object.values(quizScores).forEach(score => {
      allScores.push(score);
    });
  });
  
  allScores.sort((a, b) => a - b);
  const medianScore = allScores.length > 0
    ? allScores.length % 2 === 0
      ? (allScores[allScores.length / 2 - 1] + allScores[allScores.length / 2]) / 2
      : allScores[Math.floor(allScores.length / 2)]
    : 0;

  return {
    totalStudents: students.length,
    totalQuizzes: quizzes.length,
    uniqueQuizzesTaken: new Set(attempts.map(a => a.quizId || a.quiz_id)).size,
    averageScore: parseFloat(globalAverageScore.toFixed(2)),
    medianScore: parseFloat(medianScore.toFixed(2)),
    quizPerformance,
    scoreDistribution: scoreRanges.map(r => r.count),
    totalQuizzesPassed: totalPassed,
    totalQuizzesFailed: totalFailed
  };
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
      
      // Calculate analytics after fetching quiz data and attempts
      if (quizData && quizAttempts) {
        const calculatedAnalytics = calculateAnalytics(quizData, quizAttempts);
        setAnalytics(calculatedAnalytics);
      }

      setLoading(false);
      setAnalyticsLoading(false);
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
      const organizedAttempts = {};
      validAttempts.forEach(attempt => {
        const studentId = attempt.studentId || attempt.user_id;
        const quizId = attempt.quizId || attempt.quiz_id;
        
        if (!studentId || !quizId) {
          console.warn("Skipping attempt with missing IDs:", attempt);
          return;
        }

        if (!organizedAttempts[studentId]) {
          organizedAttempts[studentId] = {};
        }

        // Keep only the highest score attempt for each quiz
        if (!organizedAttempts[studentId][quizId] || 
            (attempt.score !== null && 
             attempt.score !== undefined && 
             (!organizedAttempts[studentId][quizId].score || 
              organizedAttempts[studentId][quizId].score < attempt.score))) {
          organizedAttempts[studentId][quizId] = {
            ...attempt,
            score: attempt.score || 0
          };
        }
      });

      // Update student records for Excel/CSV with new format
      const studentRecordsForExcel = quizAttempts.students.map(student => {
        const studentAttempts = organizedAttempts[student.id] || {};
        const quizScores = {};
        let totalPoints = 0;
        let completedQuizzes = 0;
        
        // Calculate total possible points
        const totalPossiblePoints = quizData.quizzes.reduce((sum, quiz) => {
          return sum + (Number(quiz.overallScore) || 0);
        }, 0);
        
        // Calculate scores for each quiz
        quizData.quizzes.forEach(quiz => {
          const attempt = studentAttempts[quiz.id];
          const score = attempt?.score ?? 0;
          quizScores[`quiz_${quiz.id}`] = score;
          totalPoints += score;
          if (attempt) completedQuizzes++;
        });
        
        // Calculate average score using total possible points
        const averageScore = totalPossiblePoints > 0 
          ? ((totalPoints / totalPossiblePoints) * 100).toFixed(2)
          : 0;
        
        const status = completedQuizzes === quizData.quizzes.length ? 'Complete' : 'Incomplete';
        
        // Create a single record with all fields
        return {
          rank: 0, // Will be set after sorting
          studentName: `${student.lastName} ${student.firstName}`, // Changed from comma to space
          ...quizScores,
          totalPoints,
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

      // Update headers to include status and format quiz names
      const headers = [
        { key: "rank", label: "Rank" },
        { key: "studentName", label: "Student Name" }, // Single column for full name
        ...quizData.quizzes.map(quiz => ({ 
          key: `quiz_${quiz.id}`, 
          label: `${quiz.quizName} (Quiz Items: ${quiz.totalItems} | Overall Score: ${quiz.overallScore} | Passing: ${quiz.passingScore})`
        })),
        { 
          key: "totalPoints", 
          label: `Total Points (Max: ${quizData.quizzes.reduce((sum, quiz) => sum + (Number(quiz.overallScore) || 0), 0)})`
        },
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
          overallScore: Number(quiz.overallScore) || 0 // Ensure overallScore is included
        })),
        students: studentRecordsForExcel.map(student => ({
          ...student,
          // Ensure averageScore is a number and properly formatted
          averageScore: Number(student.averageScore).toFixed(2)
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

  const handleAttemptClick = (attempt) => {
    setSelectedAttempt(attempt);
    setIsAttemptModalOpen(true);
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
              <p><strong>Score:</strong> {selectedAttempt.score}</p>
              <p><strong>Status:</strong> {selectedAttempt.passed ? 'Passed' : 'Failed'}</p>
              <p><strong>Attempt Number:</strong> {selectedAttempt.attemptNumber}</p>
              <p><strong>Time Spent:</strong> {selectedAttempt.timeSpent ? `${Math.floor(selectedAttempt.timeSpent / 60)}m ${selectedAttempt.timeSpent % 60}s` : 'N/A'}</p>
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
        attemptsByStudent[attempt.studentId] = {};
      }
      if (!attemptsByStudent[attempt.studentId][attempt.quizId] || 
          attemptsByStudent[attempt.studentId][attempt.quizId].score < attempt.score) {
        attemptsByStudent[attempt.studentId][attempt.quizId] = attempt;
      }
    });

    // Prepare student data with scores and status
    const studentData = students.map(student => {
      const studentAttempts = attemptsByStudent[student.id] || {};
      const quizScores = quizzes.map(quiz => {
        const attempt = studentAttempts[quiz.id];
        console.log(`Student ${student.id} attempt for quiz ${quiz.id}:`, {
          attempt,
          quiz,
          score: attempt?.score,
          overallScore: quiz.overallScore
        });
        return attempt?.score || null;
      });
      
      const totalScore = quizScores.reduce((sum, score) => {
        const scoreValue = Number(score) || 0;
        console.log(`Adding score ${score} (parsed as ${scoreValue}) to total`);
        return sum + scoreValue;
      }, 0);
      
      console.log(`Student ${student.id} total score: ${totalScore}`);
      
      const totalPossiblePoints = quizzes.reduce((sum, quiz) => {
        const quizTotalPoints = Number(quiz.overallScore) || 0;
        console.log(`Quiz ${quiz.id} (${quiz.quizName}): overallScore = ${quiz.overallScore}, parsed as ${quizTotalPoints}`);
        return sum + quizTotalPoints;
      }, 0);
      
      console.log(`Total possible points for student ${student.id}: ${totalPossiblePoints}`);
      
      const averageScore = totalPossiblePoints > 0 
        ? ((totalScore / totalPossiblePoints) * 100).toFixed(2) 
        : 0;
      
      console.log(`Student ${student.id} average score: ${averageScore}% (${totalScore}/${totalPossiblePoints})`);
      
      const isComplete = quizScores.every(score => score !== null && score !== undefined);

      return {
        ...student,
        quizScores,
        totalScore,
        averageScore: parseFloat(averageScore),
        status: isComplete ? 'Complete' : 'Incomplete'
      };
    });

    // Calculate ranks with the new function
    const rankedStudents = calculateRanks(studentData, quizzes);
    const sortedStudents = getSortedStudents(rankedStudents);

    return (
      <div className="overflow-x-auto">
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-2 border rounded-md flex items-center"
          >
            Sort: {sortOrder === 'desc' ? 'Highest Rank' : 'Lowest Rank'}
            {sortOrder === 'desc' ? ' ↓' : ' ↑'}
          </button>
        </div>
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
                    {student.lastName}, {student.firstName}
                  </div>
                </td>
                {quizzes.map(quiz => {
                  const attempt = attemptsByStudent[student.id]?.[quiz.id];
                  return (
                    <td key={quiz.id} className="px-6 py-4 whitespace-nowrap">
                      {attempt ? (
                        <button
                          onClick={() => handleAttemptClick(attempt)}
                          className={`text-sm flex items-center ${
                            attempt.passed ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {attempt.score}
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
                    {student.totalScore}
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

    // Prepare data for the charts
    const pieData = {
      labels: ['Passed', 'Failed'],
      datasets: [
        {
          data: [analytics.totalQuizzesPassed, analytics.totalQuizzesFailed],
          backgroundColor: ['#4CAF50', '#f44336'],
        },
      ],
    };

    const barData = {
      labels: ['Total Students', 'Total Quizzes', 'Quizzes Taken'],
      datasets: [
        {
          label: 'Classroom Statistics',
          data: [analytics.totalStudents, analytics.totalQuizzes, analytics.uniqueQuizzesTaken],
          backgroundColor: ['#2196F3', '#9C27B0', '#FF9800'],
        },
      ],
    };

    // Prepare quiz performance impact data
    const quizPerformanceData = {
      labels: analytics.quizPerformance?.map(q => q.quizName) || [],
      datasets: [
        {
          label: 'Pass Rate (%)',
          data: analytics.quizPerformance?.map(q => q.passRate) || [],
          backgroundColor: '#4CAF50',
        },
        {
          label: 'Fail Rate (%)',
          data: analytics.quizPerformance?.map(q => q.failRate) || [],
          backgroundColor: '#f44336',
        }
      ]
    };

    // Prepare score distribution data
    const scoreDistributionData = {
      labels: ['A (90-100)', 'B (80-89)', 'C (70-79)', 'D (60-69)', 'F (0-59)'],
      datasets: [
        {
          label: 'Number of Students',
          data: analytics.scoreDistribution || [0, 0, 0, 0, 0],
          backgroundColor: [
            '#4CAF50', // A - Green
            '#8BC34A', // B - Light Green
            '#FFC107', // C - Yellow
            '#FF9800', // D - Orange
            '#f44336'  // F - Red
          ],
        }
      ]
    };

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Students</h3>
            <p className="text-3xl font-bold text-blue-600">{analytics.totalStudents}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Average Score</h3>
            <p className="text-3xl font-bold text-green-600">{analytics.averageScore?.toFixed(2)}%</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Median Score</h3>
            <p className="text-3xl font-bold text-purple-600">{analytics.medianScore?.toFixed(2)}%</p>
            <p className="text-sm text-gray-500 mt-1">Central performance indicator</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Quizzes Taken</h3>
            <p className="text-3xl font-bold text-orange-600">{analytics.uniqueQuizzesTaken}</p>
            <p className="text-sm text-gray-500 mt-1">Unique quizzes attempted</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Quiz Pass/Fail Rate</h3>
            <div className="h-64">
              <Pie data={pieData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Classroom Overview</h3>
            <div className="h-64">
              <Bar 
                data={barData} 
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Quiz Performance Impact</h3>
            <div className="h-80">
              <Bar 
                data={quizPerformanceData}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Percentage (%)'
                      }
                    },
                    x: {
                      ticks: {
                        maxRotation: 45,
                        minRotation: 45
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top'
                    }
                  }
                }}
              />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Score Distribution</h3>
            <div className="h-80">
              <Bar 
                data={scoreDistributionData}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Number of Students'
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      display: false
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
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


