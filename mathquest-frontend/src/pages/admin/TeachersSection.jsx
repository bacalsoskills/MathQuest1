import React, { useEffect, useState } from 'react';
import { Header } from '../../ui/heading';
import UserService from '../../services/userService';
import { Table } from '../../ui/table';
import { Button } from '../../ui/button';
import Modal from '../../ui/modal';
import { Input } from '../../ui/input';
import { CiSearch } from 'react-icons/ci';
import { AiOutlinePlusCircle } from 'react-icons/ai';
import toast from 'react-hot-toast';

const TeachersSection = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const allUsers = await UserService.getAllUsers();
      console.log('Fetched all users for teachers section:', {
        total: allUsers.length,
        deleted: allUsers.filter(user => user.isDeleted || user.deleted).length,
        active: allUsers.filter(user => !user.isDeleted && !user.deleted).length
      });
      
      const teacherList = allUsers
        .filter(user => 
          !user.isDeleted && !user.deleted &&
          user.roles && 
          (Array.isArray(user.roles) 
            ? user.roles.some(role => typeof role === 'string' ? role === 'ROLE_TEACHER' : role.name === 'ROLE_TEACHER')
            : (typeof user.roles === 'string' ? user.roles === 'ROLE_TEACHER' : user.roles.name === 'ROLE_TEACHER'))
        )
        .sort((a, b) => a.id - b.id);

      console.log('Filtered teachers:', {
        total: teacherList.length,
        active: teacherList.filter(teacher => !teacher.isDeleted && !teacher.deleted).length,
        deleted: teacherList.filter(teacher => teacher.isDeleted || teacher.deleted).length,
        teacherIds: teacherList.map(t => t.id)
      });

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
        console.log('Attempting to delete teacher:', {
          id: teacherId,
          name: `${teacherToDelete?.firstName || ''} ${teacherToDelete?.lastName || ''}`.trim(),
          email: teacherToDelete?.email,
          username: teacherToDelete?.username,
          isDeleted: teacherToDelete?.isDeleted
        });
        
        const response = await UserService.deleteUserByAdmin(teacherId);
        console.log('Delete API Response:', response);
        
        // Verify deletion in the current list
        const deletedTeacher = teachers.find(teacher => teacher.id === teacherId);
        console.log('Verification after deletion:', {
          teacherId,
          stillExists: !!deletedTeacher,
          isDeleted: deletedTeacher?.isDeleted
        });
        
        console.log('Successfully deleted teacher with ID:', teacherId);
        toast.success('Teacher deleted successfully');
        await fetchTeachers(); // Wait for the fetch to complete
        
        // Verify after refresh
        const allUsers = await UserService.getAllUsers();
        const deletedUser = allUsers.find(user => user.id === teacherId);
        console.log('Verification after refresh:', {
          teacherId,
          stillExists: !!deletedUser,
          isDeleted: deletedUser?.isDeleted
        });
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
        <div className="flex space-x-2">
          <Button onClick={() => handleEditTeacher(teacher)} variant="secondary">
            Edit
          </Button>
          <Button onClick={() => handleDeleteTeacher(teacher.id)} variant="danger">
            Delete
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const filteredTeachers = filterTeachers(teachers);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
      <Header type="h1" fontSize="3xl" weight="bold" className="mb-6">Teachers</Header>
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
          className="flex items-center gap-2"
        >
          <AiOutlinePlusCircle className="w-5 h-5" />
          Add Teacher
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !text-gray-800">
            <CiSearch />
          </div>
          <Input
            type="search"
            name="search"
            id="search"
            className="block w-full sm:w-64 pl-10 pr-3 py-2 sm:text-sm !text-gray-800"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <Table columns={columns} data={filteredTeachers} />
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={selectedTeacher ? "Edit Teacher" : "Add Teacher"}
      >
        <form onSubmit={handleUpdateTeacher} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <Input
              type="text"
              value={editForm.firstName}
              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <Input
              type="text"
              value={editForm.lastName}
              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <Input
              type="text"
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <Input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {selectedTeacher ? 'New Password (optional)' : 'Password (required)'}
            </label>
            <Input
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              required={!selectedTeacher}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {selectedTeacher ? 'Save Changes' : 'Add Teacher'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeachersSection; 