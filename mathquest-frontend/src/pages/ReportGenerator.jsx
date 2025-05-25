import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserProgress } from '../context/UserProgressContext';
import { useContent } from '../context/ContentContext';
import { Header } from "../ui/heading"

const ReportGenerator = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { userProgress, leaderboard } = useUserProgress();
  const { challengeQuestions } = useContent();
  
  const [reportType, setReportType] = useState('overall');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const generateReport = () => {
    let data = null;

    switch (reportType) {
      case 'overall':
        data = {
          totalStudents: Object.keys(userProgress || {}).length,
          averagePoints: calculateAveragePoints(),
          topStudents: getTopStudents()
        };
        break;
      case 'student':
        if (selectedStudent) {
          data = {
            student: selectedStudent,
            progress: userProgress?.[selectedStudent] || {},
            completedChallenges: userProgress?.[selectedStudent]?.completedChallenges || [],
            badges: userProgress?.[selectedStudent]?.badges || []
          };
        }
        break;
      case 'challenges':
        data = {
          totalChallenges: (challengeQuestions || []).length,
          averageCompletionRate: calculateCompletionRate()
        };
        break;
    }

    setReportData(data);
  };

  const calculateAveragePoints = () => {
    if (!leaderboard?.length) return 0;
    const total = leaderboard.reduce((sum, student) => sum + (student.points || 0), 0);
    return (total / leaderboard.length).toFixed(2);
  };

  const getTopStudents = () => {
    return (leaderboard || [])
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 5);
  };

  const calculateCompletionRate = () => {
    if (!challengeQuestions?.length || !Object.keys(userProgress || {}).length) return 0;
    const totalAttempts = Object.values(userProgress).reduce((sum, student) => 
      sum + (student.completedChallenges?.length || 0), 0);
    return ((totalAttempts / (challengeQuestions.length * Object.keys(userProgress).length)) * 100).toFixed(2);
  };

  return (
    // <div className="space-y-6">
    //   <h2 className="text-2xl font-bold text-gray-800 mb-6">Reports & Analytics</h2>

    //   <div className="bg-white rounded-lg shadow p-6">
    //     {/* Report Type Selection */}
    //     <div className="mb-6">
    //       <label className="block text-sm font-medium text-gray-700 mb-2">
    //         Select Report Type
    //       </label>
    //       <select
    //         className="w-full p-2 border rounded-md"
    //         value={reportType}
    //         onChange={(e) => {
    //           setReportType(e.target.value);
    //           setReportData(null);
    //         }}
    //       >
    //         <option value="overall">Overall Progress</option>
    //         <option value="student">Student Performance</option>
    //         <option value="challenges">Challenge Analytics</option>
    //       </select>
    //     </div>

    //     {/* Student Selection */}
    //     {reportType === 'student' && (
    //       <div className="mb-6">
    //         <label className="block text-sm font-medium text-gray-700 mb-2">
    //           Select Student
    //         </label>
    //         <select
    //           className="w-full p-2 border rounded-md"
    //           value={selectedStudent}
    //           onChange={(e) => setSelectedStudent(e.target.value)}
    //         >
    //           <option value="">Select a student</option>
    //           {Object.keys(userProgress || {}).map((studentId) => (
    //             <option key={studentId} value={studentId}>
    //               {studentId}
    //             </option>
    //           ))}
    //         </select>
    //       </div>
    //     )}

    //     {/* Generate Report Button */}
    //     <button
    //       onClick={generateReport}
    //       className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
    //     >
    //       Generate Report
    //     </button>

    //     {/* Report Display */}
    //     {reportData && (
    //       <div className="mt-6 bg-gray-50 rounded-lg p-6">
    //         {reportType === 'overall' && (
    //           <div className="space-y-4">
    //             <h3 className="text-xl font-semibold mb-4">Overall Progress Report</h3>
    //             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    //               <div className="p-4 bg-white rounded-lg shadow">
    //                 <p className="font-semibold">Total Students</p>
    //                 <p className="text-2xl">{reportData.totalStudents}</p>
    //               </div>
    //               <div className="p-4 bg-white rounded-lg shadow">
    //                 <p className="font-semibold">Average Points</p>
    //                 <p className="text-2xl">{reportData.averagePoints}</p>
    //               </div>
    //             </div>
    //             {reportData.topStudents.length > 0 && (
    //               <div className="mt-4">
    //                 <h4 className="font-semibold mb-2">Top Students</h4>
    //                 <div className="bg-white rounded-lg shadow overflow-hidden">
    //                   <table className="min-w-full">
    //                     <thead className="bg-gray-50">
    //                       <tr>
    //                         <th className="px-4 py-2 text-left">Student</th>
    //                         <th className="px-4 py-2 text-left">Points</th>
    //                       </tr>
    //                     </thead>
    //                     <tbody>
    //                       {reportData.topStudents.map((student, index) => (
    //                         <tr key={index} className="border-t">
    //                           <td className="px-4 py-2">{student.userId}</td>
    //                           <td className="px-4 py-2">{student.points}</td>
    //                         </tr>
    //                       ))}
    //                     </tbody>
    //                   </table>
    //                 </div>
    //               </div>
    //             )}
    //           </div>
    //         )}

    //         {reportType === 'student' && (
    //           <div className="space-y-4">
    //             <h3 className="text-xl font-semibold mb-4">Student Performance Report</h3>
    //             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    //               <div className="p-4 bg-white rounded-lg shadow">
    //                 <p className="font-semibold">Student ID</p>
    //                 <p>{reportData.student}</p>
    //               </div>
    //               <div className="p-4 bg-white rounded-lg shadow">
    //                 <p className="font-semibold">Points</p>
    //                 <p>{reportData.progress.points || 0}</p>
    //               </div>
    //               <div className="p-4 bg-white rounded-lg shadow">
    //                 <p className="font-semibold">Completed Challenges</p>
    //                 <p>{reportData.completedChallenges.length}</p>
    //               </div>
    //               <div className="p-4 bg-white rounded-lg shadow">
    //                 <p className="font-semibold">Badges Earned</p>
    //                 <div className="flex flex-wrap gap-2 mt-2">
    //                   {reportData.badges.map((badge, index) => (
    //                     <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
    //                       {badge}
    //                     </span>
    //                   ))}
    //                 </div>
    //               </div>
    //             </div>
    //           </div>
    //         )}

    //         {reportType === 'challenges' && (
    //           <div className="space-y-4">
    //             <h3 className="text-xl font-semibold mb-4">Challenge Analytics</h3>
    //             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    //               <div className="p-4 bg-white rounded-lg shadow">
    //                 <p className="font-semibold">Total Challenges</p>
    //                 <p className="text-2xl">{reportData.totalChallenges}</p>
    //               </div>
    //               <div className="p-4 bg-white rounded-lg shadow">
    //                 <p className="font-semibold">Average Completion Rate</p>
    //                 <p className="text-2xl">{reportData.averageCompletionRate}%</p>
    //               </div>
    //             </div>
    //           </div>
    //         )}
    //       </div>
    //     )}
    //   </div>
    // </div>

    <div className="bg-[#E7EFFC] min-h-screen px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
    <div className="max-w-5xl mx-auto">
    <Header type="h1" fontSize="3xl" weight="bold" className="mb-6 text-center">Not yet available</Header>
</div>
</div>  
  );
};

export default ReportGenerator; 