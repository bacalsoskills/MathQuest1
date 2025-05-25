import React, { useState, useEffect } from 'react';
import { useClassroom } from '../../context/ClassroomContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from "../../ui/button"
import { Header } from "../../ui/heading"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { AiOutlinePlusCircle } from "react-icons/ai";
import ClassroomService from '../../services/classroomService';
import Table from '../../components/Table';


const ClassroomSection = () => {
  const { currentUser } = useAuth();
  const { 
    getAllClassrooms, 
    createClassroom, 
    updateClassroom, 
    deleteClassroom,
    addContent,
    removeContent
  } = useClassroom();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [studentCounts, setStudentCounts] = useState({});
  const [newClassroom, setNewClassroom] = useState({
    name: '',
    description: '',
    type: 'lessons',
    schedule: '',
    maxStudents: 30,
    instructor: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const classroomList = await ClassroomService.getAllClassrooms();
      setClassrooms(classroomList);
      
      // Fetch student counts for each classroom
      fetchStudentCounts(classroomList);
      
      setError(null);
    } catch (error) {
      console.error('Failed to fetch classrooms:', error);
      setError('Failed to fetch classrooms. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentCounts = async (classroomList) => {
    try {
      const countsObj = {};
      
      for (const classroom of classroomList) {
        try {
          const count = await ClassroomService.getStudentCountInClassroom(classroom.id);
          countsObj[classroom.id] = count;
        } catch (error) {
          console.error(`Failed to fetch student count for classroom ${classroom.id}:`, error);
          countsObj[classroom.id] = 0;
        }
      }
      
      setStudentCounts(countsObj);
    } catch (error) {
      console.error('Failed to fetch student counts:', error);
    }
  };

  const handleCreateClassroom = async () => {
    if (newClassroom.name && newClassroom.description) {
      try {
        const createdClassroom = await createClassroom(newClassroom.name, currentUser?.uid, {
          ...newClassroom,
          students: 0
        });
        
        // Update the list of classrooms
        setClassrooms(prevClassrooms => [...prevClassrooms, createdClassroom]);
        
        // Update student counts
        setStudentCounts(prevCounts => ({
          ...prevCounts,
          [createdClassroom.id]: 0
        }));
        
        setShowCreateModal(false);
        setNewClassroom({
          name: '',
          description: '',
          type: 'lessons',
          schedule: '',
          maxStudents: 30,
          instructor: ''
        });
      } catch (error) {
        console.error('Failed to create classroom:', error);
        alert('Failed to create classroom. Please try again later.');
      }
    }
  };

  const handleUpdateClassroom = (classroomId) => {
    // Implement update classroom logic
  };

  const handleDeleteClassroom = async (classroomId) => {
    if (window.confirm(`Are you sure you want to delete classroom "${classrooms.find(c => c.id === classroomId)?.name}"?`)) {
      try {
        await ClassroomService.deleteClassroomById(classroomId);
        
        // Update the list of classrooms
        setClassrooms(classrooms.filter(c => c.id !== classroomId));
        
        // Update student counts
        setStudentCounts(prevCounts => {
          const newCounts = { ...prevCounts };
          delete newCounts[classroomId];
          return newCounts;
        });
      } catch (error) {
        console.error('Failed to delete classroom:', error);
        alert('Failed to delete classroom. Please try again later.');
      }
    }
  };

  const handleAddContent = (classroomId, contentType, content) => {
    addContent(classroomId, contentType, content);
  };

  const handleRemoveContent = (classroomId, contentType, contentId) => {
    if (window.confirm('Are you sure you want to remove this content?')) {
      removeContent(classroomId, contentType, contentId);
    }
  };

  const columns = [
    {
      header: 'ID',
      accessor: 'id',
    },
    {
      header: 'Class Code',
      accessor: 'shortCode',
    },
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Description',
      accessor: 'description',
    },
    {
      header: 'Join Code',
      accessor: 'classCode',
    },
    
    {
      header: 'Teacher',
      render: (row) => {
        const teacher = row.teacher;
        return teacher ? 
          `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.username : 
          'N/A';
      },
    },
    {
      header: 'Students',
      render: (row) => studentCounts[row.id] !== undefined ? studentCounts[row.id] : (row.students ? row.students.length : 0),
    }
  ];

  return (
    <div className="bg-[#E7EFFC] min-h-screen px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      <div className="max-w-7xl mx-auto">

      <div className="flex justify-between items-center mb-6">
        <Header type="h1" fontSize="3xl" weight="bold" className="mb-6">Classrooms</Header>
          <Button
            onClick={() => setShowCreateModal(true)}
           variant="secondary"
           size="sm"
           className="flex items-center gap-2"
          >
            <AiOutlinePlusCircle className="w-5 h-5" />
            Create New Classroom
          </Button>
        </div>

        <div className="w-full">
          {loading ? (
            <p>Loading classrooms...</p>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : classrooms.length > 0 ? (
            <Table 
              columns={columns} 
              data={classrooms} 
              onEdit={(classroom) => {
                setSelectedClassroom(classroom);
                setShowEditModal(true);
              }} 
              onDelete={handleDeleteClassroom}
              className="w-full" 
            />
          ) : (
            <p>No classrooms found.</p>
          )}
        </div>

        {/* Create Classroom Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-xl font-semibold mb-4">Create New Classroom</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={newClassroom.name}
                    onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newClassroom.description}
                    onChange={(e) => setNewClassroom({ ...newClassroom, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={newClassroom.type}
                    onChange={(e) => setNewClassroom({ ...newClassroom, type: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="lessons">Lessons</option>
                    <option value="quizzes">Quizzes</option>
                    <option value="activities">Activities</option>
                    <option value="exams">Exams</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Schedule</label>
                  <input
                    type="text"
                    value={newClassroom.schedule}
                    onChange={(e) => setNewClassroom({ ...newClassroom, schedule: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., Monday, Wednesday 10:00 AM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Students</label>
                  <input
                    type="number"
                    value={newClassroom.maxStudents}
                    onChange={(e) => setNewClassroom({ ...newClassroom, maxStudents: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Instructor</label>
                  <input
                    type="text"
                    value={newClassroom.instructor}
                    onChange={(e) => setNewClassroom({ ...newClassroom, instructor: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateClassroom}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Classroom Modal */}
        {showEditModal && selectedClassroom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-xl font-semibold mb-4">Edit Classroom</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={selectedClassroom.name}
                    onChange={(e) => setSelectedClassroom({ ...selectedClassroom, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={selectedClassroom.description}
                    onChange={(e) => setSelectedClassroom({ ...selectedClassroom, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={selectedClassroom.type}
                    onChange={(e) => setSelectedClassroom({ ...selectedClassroom, type: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="lessons">Lessons</option>
                    <option value="quizzes">Quizzes</option>
                    <option value="activities">Activities</option>
                    <option value="exams">Exams</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Schedule</label>
                  <input
                    type="text"
                    value={selectedClassroom.schedule}
                    onChange={(e) => setSelectedClassroom({ ...selectedClassroom, schedule: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Students</label>
                  <input
                    type="number"
                    value={selectedClassroom.maxStudents}
                    onChange={(e) => setSelectedClassroom({ ...selectedClassroom, maxStudents: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Class Code</label>
                  <input
                    type="text"
                    value={selectedClassroom.classCode}
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Short Code</label>
                  <input
                    type="text"
                    value={selectedClassroom.shortCode}
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await updateClassroom(selectedClassroom.id, selectedClassroom);
                      setShowEditModal(false);
                      
                      // Refresh classrooms and student counts
                      fetchClassrooms();
                    } catch (error) {
                      console.error('Failed to update classroom:', error);
                      alert('Failed to update classroom. Please try again later.');
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomSection; 