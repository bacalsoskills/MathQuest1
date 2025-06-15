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

const StudentsSection = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
        <div className="flex space-x-2">
          <Button onClick={() => handleEditStudent(student)} variant="secondary">
            Edit
          </Button>
          <Button onClick={() => handleDeleteStudent(student.id)} variant="danger">
            Delete
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const filteredStudents = filterStudents(students);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Header type="h1" fontSize="3xl" weight="bold" className="mb-6">Students</Header>
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
          className="flex items-center gap-2"
        >
          <AiOutlinePlusCircle className="w-5 h-5" />
          Add Student
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
        <Table columns={columns} data={filteredStudents} />
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={selectedStudent ? "Edit Student" : "Add Student"}
      >
        <form onSubmit={handleUpdateStudent} className="space-y-4">
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
              {selectedStudent ? 'New Password (optional)' : 'Password (required)'}
            </label>
            <Input
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              required={!selectedStudent}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {selectedStudent ? 'Save Changes' : 'Add Student'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentsSection; 