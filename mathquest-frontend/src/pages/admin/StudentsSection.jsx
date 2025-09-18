import React, { useEffect, useState, useRef } from 'react';
import { Header } from '../../ui/heading';
import UserService from '../../services/userService';
import { Table } from '../../ui/table';
import { Button } from '../../ui/button';
import Modal from '../../ui/modal';
import { Input } from '../../ui/input';
import { CiSearch } from 'react-icons/ci';
import { AiOutlinePlusCircle } from 'react-icons/ai';
import { HiDotsVertical, HiPencil, HiTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';

const StudentsSection = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const menuRef = useRef();
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    role: 'ROLE_STUDENT'
  });

  useEffect(() => {
    fetchStudents();
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

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const allUsers = await UserService.getAllUsers();
      const studentList = allUsers
        .filter(user => 
          !user.isDeleted && !user.deleted &&
          user.roles && 
          (Array.isArray(user.roles) 
            ? user.roles.some(role => typeof role === 'string' ? role === 'ROLE_STUDENT' : role.name === 'ROLE_STUDENT')
            : (typeof user.roles === 'string' ? user.roles === 'ROLE_STUDENT' : user.roles.name === 'ROLE_STUDENT'))
        )
        .sort((a, b) => a.id - b.id);
      setStudents(studentList);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setError('Failed to fetch students. Please try again later.');
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setEditForm({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      username: student.username || '',
      email: student.email || '',
      password: '',
      role: 'ROLE_STUDENT'
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await UserService.deleteUserByAdmin(studentId);
        toast.success('Student deleted successfully');
        fetchStudents();
      } catch (error) {
        console.error('Failed to delete student:', error);
        toast.error(error.message || 'Failed to delete student');
      }
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        ...editForm,
        createdByAdmin: true,
        temporaryPassword: editForm.password || undefined
      };

      if (selectedStudent) {
        await UserService.updateUserByAdmin(selectedStudent.id, userData);
        toast.success('Student updated successfully');
      } else {
        await UserService.createUserByAdmin(userData);
        toast.success('Student created successfully');
      }
      setIsEditModalOpen(false);
      fetchStudents();
    } catch (error) {
      console.error('Failed to update/create student:', error);
      toast.error(error.message || 'Failed to update/create student');
    }
  };

  const filterStudents = (students) => {
    return students.filter(student => {
      const matchesSearch = searchTerm === '' || 
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Name', accessor: (student) => `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'N/A' },
    { header: 'Username', accessor: 'username' },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Actions',
      accessor: (student) => (
        <div className="flex justify-start">
          <div className="relative inline-block text-left" ref={actionMenuOpen === student.id ? menuRef : null}>
            <button
              onClick={() => setActionMenuOpen(actionMenuOpen === student.id ? null : student.id)}
              className="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition duration-150"
            >
              <HiDotsVertical size={20} />
            </button>
            {actionMenuOpen === student.id && (
 <div className="absolute right-0 bottom-[5%] mb-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  <button
                    onClick={() => { handleEditStudent(student); setActionMenuOpen(null); }}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    role="menuitem"
                  >
                    <HiPencil className="mr-3 h-5 w-5 text-gray-400" />
                    Edit
                  </button>
                  <button
                    onClick={() => { handleDeleteStudent(student.id); setActionMenuOpen(null); }}
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
      )
    }
  ];

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (error) return <div>{error}</div>;

  const filteredStudents = filterStudents(students);

  return (
    <div className="px-4 sm:px-6 lg:px-8 lg:py-8">
      <div className="max-w-6xl mx-auto">
        <Header type="h1" fontSize="5xl" weight="bold" className="mb-6 text-primary dark:text-white">Student Management</Header>
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
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={() => {
              setSelectedStudent(null);
              setEditForm({
                firstName: '',
                lastName: '',
                username: '',
                email: '',
                password: '',
                role: 'ROLE_STUDENT'
              });
              setIsEditModalOpen(true);
            }}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2 order-1 sm:order-2 !px-0 md:px-6 dark:text-blue-300 text-secondary font-semibold"
          >
            <AiOutlinePlusCircle className="w-5 h-5" />
            Add Student
          </Button>
        </div>

        <div className="">
          <Table columns={columns} data={filteredStudents} />
        </div>

        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={selectedStudent ? "Edit Student" : "Add Student"}
        >
          <form onSubmit={handleUpdateStudent} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium dark:text-gray-300 text-gray-700">First Name</label>
              <Input
                type="text"
                className="dark:text-gray-300 text-gray-700 dark:border-gray-300 border-gray-700"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium dark:text-gray-300 text-gray-700">Last Name</label>
              <Input
                type="text"
                className="dark:text-gray-300 text-gray-700 dark:border-gray-300 border-gray-700"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium dark:text-gray-300 text-gray-700">Username</label>
              <Input
                type="text"
                className="dark:text-gray-300 text-gray-700 dark:border-gray-300 border-gray-700"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium dark:text-gray-300 text-gray-700">Email</label>
              <Input
                type="email"
                className="dark:text-gray-300 text-gray-700 dark:border-gray-300 border-gray-700"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium dark:text-gray-300 text-gray-700">
                {selectedStudent ? 'New Password (optional)' : 'Password (required)'}
              </label>
              <Input
                type="password"
                className="dark:text-gray-300 text-gray-700 dark:border-gray-300 border-gray-700"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                required={!selectedStudent}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="cancel" rounded="full" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" rounded="full">
                {selectedStudent ? 'Save Changes' : 'Add Student'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default StudentsSection; 