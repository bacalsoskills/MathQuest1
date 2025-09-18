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

const TeachersSection = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
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
    role: 'ROLE_TEACHER'
  });

  useEffect(() => {
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
      setLoading(true);
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
      setError(null);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      setError('Failed to fetch teachers. Please try again later.');
      toast.error('Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setEditForm({
      firstName: teacher.firstName || '',
      lastName: teacher.lastName || '',
      username: teacher.username || '',
      email: teacher.email || '',
      password: '',
      role: 'ROLE_TEACHER'
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        const teacherToDelete = teachers.find(teacher => teacher.id === teacherId);
        const response = await UserService.deleteUserByAdmin(teacherId);
        toast.success('Teacher deleted successfully');
        await fetchTeachers(); // Wait for the fetch to complete
        

      } catch (error) {
        console.error('Failed to delete teacher:', error);
        toast.error(error.message || 'Failed to delete teacher');
      }
    }
  };

  const handleUpdateTeacher = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        ...editForm,
        createdByAdmin: true,
        temporaryPassword: editForm.password || undefined
      };

      if (selectedTeacher) {
        await UserService.updateUserByAdmin(selectedTeacher.id, userData);
        toast.success('Teacher updated successfully');
      } else {
        await UserService.createUserByAdmin(userData);
        toast.success('Teacher created successfully');
      }
      setIsEditModalOpen(false);
      fetchTeachers();
    } catch (error) {
      console.error('Failed to update/create teacher:', error);
      toast.error(error.message || 'Failed to update/create teacher');
    }
  };

  const filterTeachers = (teachers) => {
    return teachers.filter(teacher => {
      const matchesSearch = searchTerm === '' || 
        teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${teacher.firstName || ''} ${teacher.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Name', accessor: (teacher) => `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'N/A' },
    { header: 'Username', accessor: 'username' },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Actions',
      accessor: (teacher) => (
        <div className="flex justify-start">
          <div className="relative inline-block text-left" ref={actionMenuOpen === teacher.id ? menuRef : null}>
            <button
              onClick={() => setActionMenuOpen(actionMenuOpen === teacher.id ? null : teacher.id)}
              className="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition duration-150"
            >
              <HiDotsVertical size={20} />
            </button>
            {actionMenuOpen === teacher.id && (
              <div className="absolute right-0 bottom-[5%] mb-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  <button
                    onClick={() => { handleEditTeacher(teacher); setActionMenuOpen(null); }}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    role="menuitem"
                  >
                    <HiPencil className="mr-3 h-5 w-5 text-gray-400" />
                    Edit
                  </button>
                  <button
                    onClick={() => { handleDeleteTeacher(teacher.id); setActionMenuOpen(null); }}
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

  const filteredTeachers = filterTeachers(teachers);

  return (
    <div className="px-4 sm:px-6 lg:px-8 lg:py-8">
      <div className="max-w-6xl mx-auto">
        <Header type="h1" fontSize="5xl" weight="bold" className="mb-6 text-primary dark:text-white">Teacher Management</Header>
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
              setSelectedTeacher(null);
              setEditForm({
                firstName: '',
                lastName: '',
                username: '',
                email: '',
                password: '',
                role: 'ROLE_TEACHER'
              });
              setIsEditModalOpen(true);
            }}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2 order-1 sm:order-2 !px-0 md:px-6 dark:text-blue-300 text-secondary font-semibold"
          >
            <AiOutlinePlusCircle className="w-5 h-5" />
            Add Teacher
          </Button>
        </div>

        <div className="">
          <Table columns={columns} data={filteredTeachers} />
        </div>

        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={selectedTeacher ? "Edit Teacher" : "Add Teacher"}
        >
          <form onSubmit={handleUpdateTeacher} className="space-y-4">
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
                {selectedTeacher ? 'New Password (optional)' : 'Password (required)'}
              </label>
              <Input
                type="password"
                className="dark:text-gray-300 text-gray-700 dark:border-gray-300 border-gray-700"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                required={!selectedTeacher}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="cancel" rounded="full" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" rounded="full">
                {selectedTeacher ? 'Save Changes' : 'Add Teacher'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default TeachersSection; 