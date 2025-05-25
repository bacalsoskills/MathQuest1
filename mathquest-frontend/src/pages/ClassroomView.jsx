import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ClassroomService from '../services/classroomService';

const ClassroomView = () => {
  const { classroomCode } = useParams();
  const { currentUser, isTeacher, isStudent } = useAuth();
  const navigate = useNavigate();
  
  const [classroom, setClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Redirect if not logged in
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchClassroomData = async () => {
      try {
        // Get classroom details
        const classroomData = await ClassroomService.getClassroomDetails(classroomCode);
        setClassroom(classroomData);

        // If teacher, also fetch students
        if (isTeacher()) {
          const studentsData = await ClassroomService.getClassroomStudents(classroomData.id);
          setStudents(studentsData || []);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load classroom data');
        setLoading(false);
      }
    };

    fetchClassroomData();
  }, [classroomCode, currentUser, isTeacher, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">Loading classroom...</div>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-red-800">Error</h3>
            <div className="mt-2 max-w-xl text-sm text-red-500">
              <p>{error || 'Classroom not found'}</p>
            </div>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => navigate(isTeacher() ? '/teacher/classrooms' : '/student/classrooms')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Return to My Classrooms
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">{classroom.name}</h1>
            <div className="text-sm text-gray-500">
              {isTeacher() ? 'Teacher View' : 'Student View'} • Code: {classroom.code}
            </div>
          </div>
          <p className="mt-2 text-gray-600">{classroom.description}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Overview
            </button>
            
            {isTeacher() && (
              <button
                onClick={() => setActiveTab('students')}
                className={`${
                  activeTab === 'students'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Students ({students.length})
              </button>
            )}
            
            <button
              onClick={() => setActiveTab('activities')}
              className={`${
                activeTab === 'activities'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Activities
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Classroom Information</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about this classroom.</p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Classroom name</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{classroom.name}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Grade level</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{classroom.gradeLevel}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Subject</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{classroom.subject}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Teacher</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{classroom.teacherName}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Created at</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {new Date(classroom.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {activeTab === 'students' && isTeacher() && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Students</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {students.length} student{students.length !== 1 ? 's' : ''} enrolled in this classroom.
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-200">
                {students.length === 0 ? (
                  <div className="px-4 py-5 sm:p-6 text-center">
                    <p className="text-gray-500">No students have joined this classroom yet.</p>
                    <p className="mt-2 text-sm text-gray-500">Share the classroom code with your students: <span className="font-medium">{classroom.code}</span></p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {students.map((student) => (
                      <li key={student.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Joined: {new Date(student.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Activities</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {isTeacher() ? 'Manage activities for your students.' : 'Activities assigned by your teacher.'}
                </p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                {isTeacher() ? (
                  <div>
                    <p className="text-gray-500">No activities have been created yet.</p>
                    <button
                      type="button"
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Create New Activity
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-500">No activities have been assigned yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassroomView; 