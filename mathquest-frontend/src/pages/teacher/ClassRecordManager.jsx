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



const ClassRecordManager = ({ classroomId }) => {
  const { currentUser, token } = useAuth();
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
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
      setGeneratingReport(true);
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

      // Create student records with validated data
      const studentRecordsForExcel = quizAttempts.students.map(student => {
        const studentAttempts = organizedAttempts[student.id] || {};
        const quizScores = {};
        let totalPoints = 0;
        let validScoresCount = 0;
        
        quizData.quizzes.forEach(quiz => {
          const attempt = studentAttempts[quiz.id];
          const highestScore = attempt?.score ?? 0;
          quizScores[`quiz_${quiz.id}`] = highestScore;
          
          if (highestScore > 0) {
            totalPoints += highestScore;
            validScoresCount++;
          }
        });
        
        const averageScore = validScoresCount > 0 
          ? (totalPoints / validScoresCount).toFixed(2)
          : "0.00";
        
        return {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          username: student.username,
          ...quizScores,
          totalPoints: totalPoints,
          averageScore: parseFloat(averageScore)
        };
      });

      // Create headers for Excel/CSV
      const headers = [
        { key: "studentName", label: "Student Name" },
        { key: "username", label: "Username" },
        ...quizData.quizzes.map(quiz => ({ 
          key: `quiz_${quiz.id}`, 
          label: `${quiz.quizName} (Total: ${quiz.totalItems}, Passing: ${quiz.passingScore})`
        })),
        { key: "totalPoints", label: "Total Points" },
        { key: "averageScore", label: "Average Score (%)" }
      ];

      const reportName = `${classroom.name || 'Class'} Record`;
      const reportDescription = JSON.stringify({
        classroomId: classroom.id,
        classroomName: classroom.name,
        totalStudents: quizAttempts.students.length,
        totalQuizzes: quizData.quizzes.length,
        quizzes: quizData.quizzes.map(quiz => ({
          id: quiz.id,
          quizName: quiz.quizName,
          totalItems: quiz.totalItems,
          passingScore: quiz.passingScore
        })),
        students: studentRecordsForExcel,
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
      setGeneratingReport(false);
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
      // Check and log any potential prop name mismatches
      if (!attempt.studentId && attempt.user_id) {
        console.log("Found attempt using user_id instead of studentId");
        attempt.studentId = attempt.user_id;
      }
      if (!attempt.quizId && attempt.quiz_id) {
        console.log("Found attempt using quiz_id instead of quizId");
        attempt.quizId = attempt.quiz_id;
      }

      if (!attemptsByStudent[attempt.studentId]) {
        attemptsByStudent[attempt.studentId] = {};
      }
      // Keep only the highest score attempt for each quiz
      if (!attemptsByStudent[attempt.studentId][attempt.quizId] || 
          attemptsByStudent[attempt.studentId][attempt.quizId].score < attempt.score) {
        attemptsByStudent[attempt.studentId][attempt.quizId] = attempt;
      }
    });

    console.log("Organized attempts by student:", attemptsByStudent);

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student Name
              </th>
              {quizzes.map(quiz => (
                <th key={quiz.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {quiz.quizName}
                  <div className="text-xxs font-normal normal-case text-gray-400">
                    Total: {quiz.totalItems} | Passing: {quiz.passingScore}
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Average Score
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map(student => {
              const studentAttempts = attemptsByStudent[student.id] || {};
              const scores = quizzes.map(quiz => studentAttempts[quiz.id]?.score || null);
              const validScores = scores.filter(score => score !== null);
              const averageScore = validScores.length > 0 
                ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2)
                : 'N/A';

              return (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {student.firstName} {student.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{student.username}</div>
                  </td>
                  {quizzes.map(quiz => {
                    const attempt = studentAttempts[quiz.id];
                    return (
                      <td key={quiz.id} className="px-6 py-4 whitespace-nowrap">
                        {attempt ? (
                          <button
                            onClick={() => handleAttemptClick(attempt)}
                            className={`text-sm flex items-center ${
                              attempt.passed ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {attempt.score}%
                            <FaInfoCircle className="ml-1" />
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      averageScore !== 'N/A' 
                        ? parseFloat(averageScore) >= 60 
                          ? 'text-green-600' 
                          : 'text-red-600'
                        : 'text-gray-400'
                    }`}>
                      {averageScore !== 'N/A' ? `${averageScore}%` : averageScore}
                    </span>
                  </td>
                </tr>
              );
            })}
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
      labels: ['Total Students', 'Total Quizzes Taken'],
      datasets: [
        {
          label: 'Classroom Statistics',
          data: [analytics.totalStudents, analytics.totalQuizzesTaken],
          backgroundColor: ['#2196F3', '#FF9800'],
        },
      ],
    };

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Students</h3>
            <p className="text-3xl font-bold text-blue-600">{analytics.totalStudents}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Average Score</h3>
            <p className="text-3xl font-bold text-green-600">{analytics.averageScore?.toFixed(2)}%</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Quizzes Taken</h3>
            <p className="text-3xl font-bold text-orange-600">{analytics.totalQuizzesTaken}</p>
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

        {analytics.topPerformers && analytics.topPerformers.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Points</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.topPerformers.map((student, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{student.studentName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{student.averageQuizScore?.toFixed(2)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">{student.totalPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                disabled={generatingReport}
                className={`px-4 py-2 rounded-md text-white ${
                  generatingReport ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                } flex items-center justify-center`}
              >
                {generatingReport ? (
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
                disabled={generatingReport}
                className={`px-4 py-2 rounded-md text-white ${
                  generatingReport ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } flex items-center justify-center`}
              >
                {generatingReport ? (
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

