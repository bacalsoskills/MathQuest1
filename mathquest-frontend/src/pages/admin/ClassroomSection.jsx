import React, { useState, useEffect, useRef } from 'react';
import { useClassroom } from '../../context/ClassroomContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from "../../ui/button"
import { Header } from "../../ui/heading"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { AiOutlinePlusCircle } from "react-icons/ai";
import { CiSearch } from "react-icons/ci";
import { HiDotsVertical, HiPencil, HiTrash, HiUserAdd } from "react-icons/hi";
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
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const menuRef = useRef();
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActionMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
      header: 'Classroom Name',
      accessor: 'name',
    },
    {
      header: 'Classroom Description',
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
        <div className="flex justify-start">
          <div className="relative inline-block text-left" ref={actionMenuOpen === row.id ? menuRef : null}>
            <button
              onClick={() => setActionMenuOpen(actionMenuOpen === row.id ? null : row.id)}
              className="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition duration-150"
            >
              <HiDotsVertical size={20} />
            </button>
            {actionMenuOpen === row.id && (
         <div className="absolute right-0 bottom-[0%] mb-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  <button
                    onClick={() => { 
                      setSelectedClassroom(row);
                      setShowEditModal(true);
                      setActionMenuOpen(null);
                    }}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    role="menuitem"
                  >
                    <HiPencil className="mr-3 h-5 w-5 text-gray-400" />
                    Edit
                  </button>
                  <button
                    onClick={() => { 
                      setSelectedClassroom(row);
                      setShowAddStudentModal(true);
                      setActionMenuOpen(null);
                    }}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    role="menuitem"
                  >
                    <HiUserAdd className="mr-3 h-5 w-5 text-gray-400" />
                    Add Students
                  </button>
                  <button
                    onClick={() => { 
                      handleDeleteClassroom(row.id);
                      setActionMenuOpen(null);
                    }}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                    role="menuitem"
                  >
                    <HiTrash className="mr-3 h-5 w-5 text-red-400" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
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

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 lg:py-8">
      <div className="max-w-6xl mx-auto">
        <Header type="h1" fontSize="5xl" weight="bold" className="mb-6 text-primary dark:text-white">Classroom Management</Header>
        <div className="h-[1px] w-full bg-gradient-to-r from-[#18C8FF] via-[#4B8CFF] to-[#6D6DFF] mb-5 md:mb-8"></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto order-2 sm:order-1">
            <div className="relative flex-1 sm:flex-none">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none dark:!text-gray-300 !text-gray-700">
                <CiSearch className="dark:!text-gray-300 !text-gray-700" />
              </div>
              <Input
                type="search"
                name="search"
                id="search"
                className="block w-full sm:w-96 pl-10 pr-3 py-2 sm:text-sm border-gray-700 dark:border-gray-300 text-gray-500 dark:text-gray-300"
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
            className="flex items-center gap-2 order-1 sm:order-2  !px-0 md:px-6 dark:text-blue-300 text-secondary font-semibold"
          >
            <AiOutlinePlusCircle className="w-5 h-5" />
            Create New Classroom
          </Button>
        </div>

        <div className="">
          {error ? (
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
            <p className="text-center py-10 text-gray-500">No classrooms found.</p>
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
                <Label htmlFor="name" className="block mb-2 text-sm font-medium dark:text-gray-300 text-gray-700">Name</Label>
                <Input
                  id="name"
                  className="dark:text-gray-300 text-gray-700 dark:border-gray-300 border-gray-700"
                  value={newClassroom.name}
                  onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })}
                  placeholder="Enter classroom name"
                />
              </div>
              <div>
                <Label htmlFor="description" className="block mb-2 text-sm font-medium dark:text-gray-300 text-gray-700">Description</Label>
                <textarea
                  id="description"
                  value={newClassroom.description}
                  onChange={(e) => setNewClassroom({ ...newClassroom, description: e.target.value })}
                  placeholder="Enter classroom description"
                    className="mt-2 py-1 px-2 block w-full border border-gray-700 dark:border-gray-300 shadow-sm min-h-[100px] dark:text-gray-300 text-gray-700 !bg-transparent focus:border-blue-500 focus:ring-blue-500 rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="shortCode" className="block mb-2 text-sm font-medium dark:text-gray-300 text-gray-700">Short Code</Label>
                <Input
                  id="shortCode"
                  className="dark:text-gray-300 text-gray-700 dark:border-gray-300 border-gray-700"
                  value={newClassroom.shortCode}
                  onChange={(e) => setNewClassroom({ ...newClassroom, shortCode: e.target.value })}
                  placeholder="Enter short code"
                />
              </div>
              <div>
                <Label htmlFor="teacher" className="block mb-2 text-sm font-medium dark:text-gray-300 text-gray-700">Teacher</Label>
                <select
                  id="teacher"
                  value={newClassroom.teacherId}
                  onChange={(e) => setNewClassroom({ ...newClassroom, teacherId: e.target.value })}
                  className="py-1 px-2 block w-full border border-gray-700 dark:border-gray-300 shadow-sm dark:text-gray-300 text-gray-700 !bg-transparent focus:border-blue-500 focus:ring-blue-500 rounded-none"
                >
                    <option value="" className="bg-gray-300 text-gray-700 hover:text-blue-600">Select a teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id} className="bg-gray-300 text-gray-700 hover:text-blue-600">
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
                  variant="cancel"
                  rounded="full"
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateClassroom} variant="default" rounded="full">
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
                <Label htmlFor="edit-name" className="block mb-2 text-sm font-medium dark:text-gray-300 text-gray-700">Name</Label>
                <Input
                  id="edit-name"
                  className="dark:text-gray-300 text-gray-700 dark:border-gray-300 border-gray-700"
                  value={selectedClassroom.name}
                  onChange={(e) => setSelectedClassroom({ ...selectedClassroom, name: e.target.value })}
                  placeholder="Enter classroom name"
                />
              </div>
              <div>
                <Label htmlFor="edit-description" className="block mb-2 text-sm font-medium dark:text-gray-300 text-gray-700">Description</Label>
                <textarea
                  id="edit-description"
                  value={selectedClassroom.description}
                  onChange={(e) => setSelectedClassroom({ ...selectedClassroom, description: e.target.value })}
                  placeholder="Enter classroom description"
                  className="mt-2 py-1 px-2 block w-full border border-gray-700 dark:border-gray-300 shadow-sm min-h-[100px] dark:text-gray-300 text-gray-700 !bg-transparent focus:border-blue-500 focus:ring-blue-500 rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="edit-shortCode" className="block mb-2 text-sm font-medium dark:text-gray-300 text-gray-700">Short Code</Label>
                <Input
                  id="edit-shortCode"
                  className="dark:text-gray-300 text-gray-700 dark:border-gray-300 border-gray-700"
                  value={selectedClassroom.shortCode}
                  onChange={(e) => setSelectedClassroom({ ...selectedClassroom, shortCode: e.target.value })}
                  placeholder="Enter short code"
                />
              </div>
              <div>
                <Label htmlFor="edit-teacher" className="block mb-2 text-sm font-medium dark:text-gray-300 text-gray-700">Teacher</Label>
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
              className="py-1 px-2 block w-full border border-gray-700 dark:border-gray-300 shadow-sm dark:text-gray-300 text-gray-700 !bg-transparent focus:border-blue-500 focus:ring-blue-500 rounded-none"
                >
                  <option value="" className="bg-gray-300 text-gray-700 hover:text-blue-600">Select a teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id} className="bg-gray-300 text-gray-700 hover:text-blue-600">
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
                  variant="cancel"
                  rounded="full"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
          
                    // Check if teacherId exists either directly or through the teacher object
                    const teacherId = selectedClassroom.teacherId || (selectedClassroom.teacher && selectedClassroom.teacher.id);
                    
                    if (!selectedClassroom.name || !selectedClassroom.description || !teacherId) {
                    
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
                  rounded="full"
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
                <Label htmlFor="studentSearch" className="block mb-2 text-sm font-medium dark:text-gray-300 text-gray-700">Search Students</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none dark:!text-gray-300 !text-gray-700">
                    <CiSearch className="dark:!text-gray-300 !text-gray-700" />
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
                    className="pl-10 dark:text-gray-300 text-gray-700 dark:border-gray-300 border-gray-700"
                  />
                </div>
              </div>

              {searchingStudents ? (
                <div className="flex justify-center items-center h-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
                </div>
              ) : studentSearchTerm && studentSearchResults.length === 0 ? (
                <div className="text-center py-2 text-sm dark:text-gray-300 text-gray-500">
                  No students found matching '{studentSearchTerm}'
                </div>
              ) : !studentSearchTerm ? (
                <div className="text-center py-2 text-sm dark:text-gray-300 text-gray-500">
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
                        <p className="font-medium dark:text-gray-300 text-gray-800">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-sm dark:text-gray-400 text-gray-500">@{student.username}</p>
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
                          rounded="full"
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