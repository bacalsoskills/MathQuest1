import React, { useState } from 'react';
import { useUserProgress } from '../../context/UserProgressContext';
import { Header } from "../../ui/heading"

const StudentProgressSection = () => {
  const { userProgress, leaderboard } = useUserProgress();
  const [selectedStudent, setSelectedStudent] = useState(null);

  return (
    // <div className="space-y-6">
    //   <h2 className="text-2xl font-bold text-gray-800">Student Progress</h2>
    //   <div className="space-y-4">
    //     {Object.entries(userProgress).map(([studentId, progress]) => (
    //       <div key={studentId} className="border p-4 rounded">
    //         <div className="flex justify-between items-start">
    //           <div>
    //             <h4 className="font-medium">Student ID: {studentId}</h4>
    //             <p className="text-sm text-gray-500">Points: {progress.points || 0}</p>
    //             <p className="text-sm text-gray-500">Badges: {progress.badges?.join(', ') || 'None'}</p>
    //             <p className="text-sm text-gray-500">
    //               Completed Challenges: {progress.completedChallenges?.length || 0}
    //             </p>
    //           </div>
    //           <button
    //             onClick={() => setSelectedStudent(studentId)}
    //             className="text-blue-600 hover:text-blue-800"
    //           >
    //             View Details
    //           </button>
    //         </div>
    //       </div>
    //     ))}
    //   </div>

    //   {/* Student Details Modal */}
    //   {selectedStudent && (
    //     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    //       <div className="bg-white p-6 rounded-lg w-96">
    //         <h3 className="text-xl font-semibold mb-4">Student Details</h3>
    //         <div className="space-y-4">
    //           <p><strong>Student ID:</strong> {selectedStudent}</p>
    //           <p><strong>Points:</strong> {userProgress[selectedStudent]?.points || 0}</p>
    //           <p><strong>Badges:</strong> {userProgress[selectedStudent]?.badges?.join(', ') || 'None'}</p>
    //           <p><strong>Completed Challenges:</strong> {userProgress[selectedStudent]?.completedChallenges?.length || 0}</p>
    //         </div>
    //         <div className="mt-4 flex justify-end">
    //           <button
    //             onClick={() => setSelectedStudent(null)}
    //             className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
    //           >
    //             Close
    //           </button>
    //         </div>
    //       </div>
    //     </div>
    //   )}
    // </div>
    <div className="bg-[#E7EFFC] min-h-screen px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      <div className="max-w-5xl mx-auto">
        <Header type="h1" fontSize="3xl" weight="bold" className="mb-6 text-center">Not yet available</Header>
      </div>
    </div>  
  );
};

export default StudentProgressSection; 