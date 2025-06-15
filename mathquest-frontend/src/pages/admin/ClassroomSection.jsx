import React, { useState, useEffect } from 'react';
import { useClassroom } from '../../context/ClassroomContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from "../../ui/button"
import { Header } from "../../ui/heading"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { AiOutlinePlusCircle } from "react-icons/ai";
import { CiSearch } from "react-icons/ci";
import ClassroomService from '../../services/classroomService';
import UserService from '../../services/userService';
import { Table } from '../../ui/table';
import Modal from '../../ui/modal';
import toast from 'react-hot-toast';

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
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [studentCounts, setStudentCounts] = useState({});
  const [teachers, setTeachers] = useState([]);
  const [newClassroom, setNewClassroom] = useState({
    name: '',
    description: '',
    shortCode: '',
    teacherId: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClassrooms();
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const allUsers = await UserService.getAllUsers();
      const teacherList = allUsers
        .filter(user => 
          !user.isDeleted && !user.deleted &&
          user.roles && 
          (Array.isArray(user.roles) 
            ? user.roles.some(role => typeof role === 'string' ? role === 'ROLE_TEACHER' : role.name === 'ROLE_TEACHER')
            : (typeof user.roles === 'string' ? user.roles === 'ROLE_TEACHER' : user.roles.name === 'ROLE_TEACHER'))
        )
        .sort((a, b) => a.id - b.id);
      setTeachers(teacherList);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      toast.error('Failed to fetch teachers');
    }
  };

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
    if (!newClassroom.name || !newClassroom.description || !newClassroom.teacherId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', newClassroom.name);
      formData.append('description', newClassroom.description);
      formData.append('shortCode', newClassroom.shortCode);
      formData.append('teacherId', newClassroom.teacherId);

      const createdClassroom = await ClassroomService.createClassroomAsAdmin(formData);
      
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
        shortCode: '',
        teacherId: ''
      });
      toast.success('Classroom created successfully');
    } catch (error) {
      console.error('Failed to create classroom:', error);
      toast.error(error.message || 'Failed to create classroom');
    }
  };

  const handleUpdateClassroom = async (classroomData) => {
    try {
      // Ensure teacherId is a number
      const teacherId = parseInt(classroomData.teacherId);
      
      const updateData = {
        name: classroomData.name,
        description: classroomData.description,
        shortCode: classroomData.shortCode,
        teacherId: teacherId
      };

      console.log('Updating classroom with data:', updateData);

      const updatedClassroom = await ClassroomService.updateClassroomAsAdmin(classroomData.id, updateData);
      
      // Update the list of classrooms with the new teacher information
      setClassrooms(prevClassrooms => 
        prevClassrooms.map(c => {
          if (c.id === updatedClassroom.id) {
            return {
              ...updatedClassroom,
              teacher: teachers.find(t => t.id === teacherId) || null
            };
          }
          return c;
        })
      );
      
      setShowEditModal(false);
      toast.success('Classroom updated successfully');
    } catch (error) {
      console.error('Failed to update classroom:', error);
      toast.error(error.message || 'Failed to update classroom');
    }
  };

  const handleDeleteClassroom = async (classroomId) => {
    if (window.confirm('Are you sure you want to delete this classroom?')) {
      try {
        await ClassroomService.deleteClassroomById(classroomId);
        
        // Update the list of classrooms
        setClassrooms(prevClassrooms => prevClassrooms.filter(c => c.id !== classroomId));
        
        // Update student counts
        setStudentCounts(prevCounts => {
          const newCounts = { ...prevCounts };
          delete newCounts[classroomId];
          return newCounts;
        });
        
        toast.success('Classroom deleted successfully');
      } catch (error) {
        console.error('Failed to delete classroom:', error);
        toast.error(error.message || 'Failed to delete classroom');
      }
    }
  };

  const handleSearchStudents = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setStudentSearchResults([]);
      return;
    }

    try {
      setSearchingStudents(true);
      const results = await ClassroomService.searchStudents(searchTerm, selectedClassroom?.id);
      setStudentSearchResults(results);
    } catch (error) {
      console.error('Failed to search students:', error);
      toast.error('Failed to search students');
    } finally {
      setSearchingStudents(false);
    }
  };

  const handleAddStudent = async (studentId) => {
    try {
      await ClassroomService.addStudentToClassroomAsAdmin(selectedClassroom.id, studentId);
      
      // Update student count
      setStudentCounts(prevCounts => ({
        ...prevCounts,
        [selectedClassroom.id]: (prevCounts[selectedClassroom.id] || 0) + 1
      }));
      
      // Update search results
      setStudentSearchResults(prevResults => 
        prevResults.map(student => 
          student.id === studentId ? { ...student, inClassroom: true } : student
        )
      );
      
      toast.success('Student added successfully');
    } catch (error) {
      console.error('Failed to add student:', error);
      toast.error(error.message || 'Failed to add student');
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
      header: 'Teacher',
      render: (row) => {
        const teacher = row.teacher;
        return teacher ? 
          `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.username : 
          'N/A';
      },
    },
    {
      header: 'Join Code',
      accessor: 'classCode',
    },
    {
      header: 'Students',
      render: (row) => studentCounts[row.id] !== undefined ? studentCounts[row.id] : (row.students ? row.students.length : 0),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <Button 
            onClick={() => {
              setSelectedClassroom(row);
              setShowEditModal(true);
            }} 
            variant="secondary"
            size="sm"
          >
            Edit
          </Button>
          <Button 
            onClick={() => {
              setSelectedClassroom(row);
              setShowAddStudentModal(true);
            }} 
            variant="default"
            size="sm"
          >
            Add Students
          </Button>
          <Button 
            onClick={() => handleDeleteClassroom(row.id)} 
            variant="danger"
            size="sm"
          >
            Delete
          </Button>
        </div>
      ),
    }
  ];

  const filteredClassrooms = classrooms.filter(classroom => {
    const searchLower = searchTerm.toLowerCase();
    return (
      classroom.name.toLowerCase().includes(searchLower) ||
      classroom.shortCode.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="bg-[#E7EFFC] min-h-screen px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1">
            <Header type="h1" fontSize="3xl" weight="bold" className="mb-6">Classrooms</Header>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !text-gray-800">
                <CiSearch />
              </div>
              <Input
                type="search"
                name="search"
                id="search"
                className="block w-full sm:w-64 pl-10 pr-3 py-2 sm:text-sm !text-gray-800"
                placeholder="Search classrooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
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
            <div className="flex justify-center items-center h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : filteredClassrooms.length > 0 ? (
            <Table 
              columns={columns} 
              data={filteredClassrooms} 
              className="w-full" 
            />
          ) : (
            <p>No classrooms found.</p>
          )}
        </div>

        {/* Create Classroom Modal */}
        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              setNewClassroom({
                name: '',
                description: '',
                shortCode: '',
                teacherId: ''
              });
            }}
            title="Create New Classroom"
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newClassroom.name}
                  onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })}
                  placeholder="Enter classroom name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={newClassroom.description}
                  onChange={(e) => setNewClassroom({ ...newClassroom, description: e.target.value })}
                  placeholder="Enter classroom description"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                />
              </div>
              <div>
                <Label htmlFor="shortCode">Short Code</Label>
                <Input
                  id="shortCode"
                  value={newClassroom.shortCode}
                  onChange={(e) => setNewClassroom({ ...newClassroom, shortCode: e.target.value })}
                  placeholder="Enter short code"
                />
              </div>
              <div>
                <Label htmlFor="teacher">Teacher</Label>
                <select
                  id="teacher"
                  value={newClassroom.teacherId}
                  onChange={(e) => setNewClassroom({ ...newClassroom, teacherId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {`${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.username}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewClassroom({
                      name: '',
                      description: '',
                      shortCode: '',
                      teacherId: ''
                    });
                  }}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateClassroom} variant="default">
                  Create
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Edit Classroom Modal */}
        {showEditModal && selectedClassroom && (
          <Modal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedClassroom(null);
            }}
            title="Edit Classroom"
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={selectedClassroom.name}
                  onChange={(e) => setSelectedClassroom({ ...selectedClassroom, name: e.target.value })}
                  placeholder="Enter classroom name"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <textarea
                  id="edit-description"
                  value={selectedClassroom.description}
                  onChange={(e) => setSelectedClassroom({ ...selectedClassroom, description: e.target.value })}
                  placeholder="Enter classroom description"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                />
              </div>
              <div>
                <Label htmlFor="edit-shortCode">Short Code</Label>
                <Input
                  id="edit-shortCode"
                  value={selectedClassroom.shortCode}
                  onChange={(e) => setSelectedClassroom({ ...selectedClassroom, shortCode: e.target.value })}
                  placeholder="Enter short code"
                />
              </div>
              <div>
                <Label htmlFor="edit-teacher">Teacher</Label>
                <select
                  id="edit-teacher"
                  value={selectedClassroom.teacherId || (selectedClassroom.teacher && selectedClassroom.teacher.id) || ''}
                  onChange={(e) => {
                    const teacherId = e.target.value;
                    setSelectedClassroom(prev => ({
                      ...prev,
                      teacherId: teacherId,
                      teacher: teachers.find(t => t.id === parseInt(teacherId)) || null
                    }));
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {`${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.username}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedClassroom(null);
                  }}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    console.log('Selected Classroom:', selectedClassroom);
                    // Check if teacherId exists either directly or through the teacher object
                    const teacherId = selectedClassroom.teacherId || (selectedClassroom.teacher && selectedClassroom.teacher.id);
                    
                    if (!selectedClassroom.name || !selectedClassroom.description || !teacherId) {
                      console.log('Validation failed:', {
                        name: selectedClassroom.name,
                        description: selectedClassroom.description,
                        teacherId: teacherId
                      });
                      toast.error('Please fill in all required fields');
                      return;
                    }
                    
                    // Create a copy of selectedClassroom with the correct teacherId
                    const updatedClassroom = {
                      ...selectedClassroom,
                      teacherId: teacherId
                    };
                    
                    handleUpdateClassroom(updatedClassroom);
                  }} 
                  variant="default"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Add Student Modal */}
        {showAddStudentModal && selectedClassroom && (
          <Modal
            isOpen={showAddStudentModal}
            onClose={() => {
              setShowAddStudentModal(false);
              setSelectedClassroom(null);
              setStudentSearchTerm('');
              setStudentSearchResults([]);
            }}
            title={`Add Students to ${selectedClassroom.name}`}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="studentSearch">Search Students</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CiSearch className="text-gray-400" />
                  </div>
                  <Input
                    id="studentSearch"
                    type="text"
                    value={studentSearchTerm}
                    onChange={(e) => {
                      setStudentSearchTerm(e.target.value);
                      handleSearchStudents(e.target.value);
                    }}
                    placeholder="Search by name or username"
                    className="pl-10"
                  />
                </div>
              </div>

              {searchingStudents ? (
                <div className="text-center py-2 text-sm text-gray-500">Searching...</div>
              ) : studentSearchTerm && studentSearchResults.length === 0 ? (
                <div className="text-center py-2 text-sm text-gray-500">
                  No students found matching '{studentSearchTerm}'
                </div>
              ) : !studentSearchTerm ? (
                <div className="text-center py-2 text-sm text-gray-500">
                  Type to search for students
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
                    >
                      <div className="flex-grow">
                        <p className="font-medium text-gray-800">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-sm text-gray-500">@{student.username}</p>
                      </div>
                      {student.inClassroom ? (
                        <span className="text-sm text-green-600 font-medium">
                          Already in classroom
                        </span>
                      ) : (
                        <Button
                          onClick={() => handleAddStudent(student.id)}
                          variant="default"
                          size="sm"
                        >
                          Add
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default ClassroomSection; 