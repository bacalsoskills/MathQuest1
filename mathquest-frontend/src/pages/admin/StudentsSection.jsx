import React, { useEffect, useState } from 'react';
import { Header } from '../../ui/heading';
import UserService from '../../services/userService';
import Table from '../../components/Table';
import { AiOutlinePlusCircle } from 'react-icons/ai';
import { Button } from '../../ui/button';

const StudentsSection = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const allUsers = await UserService.getAllUsers();
      const studentList = allUsers.filter(user => 
        user.roles && 
        (Array.isArray(user.roles) 
          ? user.roles.some(role => typeof role === 'string' ? role === 'ROLE_STUDENT' : role.name === 'ROLE_STUDENT')
          : (typeof user.roles === 'string' ? user.roles === 'ROLE_STUDENT' : user.roles.name === 'ROLE_STUDENT'))
      );
      setStudents(studentList);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setError('Failed to fetch students. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = () => {
    // TODO: Implement add student logic
    console.log('Add new student');
  };

  const handleEditStudent = (student) => {
    // TODO: Implement edit student logic
    console.log('Edit student:', student);
  };

  const handleDeleteStudent = async (student) => {
    if (window.confirm(`Are you sure you want to delete ${student.firstName || ''} ${student.lastName || ''}? This action cannot be undone.`)) {
      try {
        await UserService.deleteUser(student.id);
        setStudents(prevStudents => prevStudents.filter(s => s.id !== student.id));
      } catch (err) {
        console.error('Failed to delete student:', err);
        setError(err.message || 'Failed to delete student. Please try again.');
      }
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Username', accessor: 'username' },
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'N/A',
    },
    { header: 'Email', accessor: 'email' },
  ];

  return (
    <div className="bg-[#E7EFFC] min-h-screen px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <Header type="h1" fontSize="3xl" weight="bold">Students</Header>
            <Button 
                onClick={handleAddStudent}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
            >
                <AiOutlinePlusCircle className="w-5 h-5" />
                Add Student
            </Button>
        </div>
        
        {loading && <p className="text-center py-4">Loading students...</p>}
        {error && 
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
            <button onClick={fetchStudents} className="mt-2 text-sm text-red-700 underline">Try again</button>
          </div>
        }
        {!loading && (
          <Table 
            columns={columns} 
            data={students} 
            onEdit={handleEditStudent} 
            onDelete={handleDeleteStudent} 
            onAdd={handleAddStudent}
            addLabel="Add New Student"
          />
        )}
      </div>
    </div>
  );
};

export default StudentsSection; 