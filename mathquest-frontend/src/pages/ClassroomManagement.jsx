import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClassroom } from '../context/ClassroomContext';

const ClassroomManagement = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const { classrooms, createClassroom, joinClassroom } = useClassroom();
  const [newClassroomName, setNewClassroomName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    if (!currentUser || !isAdmin()) {
      navigate('/');
    }
  }, [currentUser, isAdmin, navigate]);

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    if (newClassroomName.trim()) {
      await createClassroom(newClassroomName);
      setNewClassroomName('');
    }
  };

  const handleJoinClassroom = async (e) => {
    e.preventDefault();
    if (joinCode.trim()) {
      await joinClassroom(joinCode);
      setJoinCode('');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Classroom Management</h2>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="max-w-md mx-auto">
          <div className="divide-y divide-gray-200">
            <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
              {/* Create Classroom Form */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Create New Classroom</h3>
                <form onSubmit={handleCreateClassroom} className="space-y-4">
                  <div>
                    <label htmlFor="classroomName" className="block text-sm font-medium text-gray-700">
                      Classroom Name
                    </label>
                    <input
                      type="text"
                      id="classroomName"
                      value={newClassroomName}
                      onChange={(e) => setNewClassroomName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Create Classroom
                  </button>
                </form>
              </div>

              {/* Join Classroom Form */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Join Classroom</h3>
                <form onSubmit={handleJoinClassroom} className="space-y-4">
                  <div>
                    <label htmlFor="joinCode" className="block text-sm font-medium text-gray-700">
                      Classroom Code
                    </label>
                    <input
                      type="text"
                      id="joinCode"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Join Classroom
                  </button>
                </form>
              </div>

              {/* List of Classrooms */}
              {classrooms.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Your Classrooms</h3>
                  <div className="space-y-4">
                    {classrooms.map((classroom) => (
                      <div
                        key={classroom.id}
                        className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <h4 className="font-medium">{classroom.name}</h4>
                        <p className="text-sm text-gray-500">Code: {classroom.code}</p>
                        <p className="text-sm text-gray-500">
                          Students: {classroom.students.length}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassroomManagement; 