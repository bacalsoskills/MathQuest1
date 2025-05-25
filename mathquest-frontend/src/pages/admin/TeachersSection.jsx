import React, { useEffect, useState } from 'react';
import { Header } from '../../ui/heading';
import UserService from '../../services/userService';
import Table from '../../components/Table';
import { AiOutlinePlusCircle } from 'react-icons/ai';
import { Button } from '../../ui/button';

const TeachersSection = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const allUsers = await UserService.getAllUsers();
      const teacherList = allUsers.filter(user => 
        user.roles && 
        (Array.isArray(user.roles) 
          ? user.roles.some(role => typeof role === 'string' ? role === 'ROLE_TEACHER' : role.name === 'ROLE_TEACHER')
          : (typeof user.roles === 'string' ? user.roles === 'ROLE_TEACHER' : user.roles.name === 'ROLE_TEACHER'))
      );
      setTeachers(teacherList);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      setError('Failed to fetch teachers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = () => {
    // TODO: Implement add teacher logic (e.g., show a modal)
    console.log('Add new teacher');
  };

  const handleEditTeacher = (teacher) => {
    // TODO: Implement edit teacher logic (e.g., show a modal with teacher data)
    console.log('Edit teacher:', teacher);
  };

  const handleDeleteTeacher = async (teacher) => {
    if (window.confirm(`Are you sure you want to delete ${teacher.firstName || ''} ${teacher.lastName || ''}? This action cannot be undone.`)) {
      try {
        await UserService.deleteUser(teacher.id);
        setTeachers(prevTeachers => prevTeachers.filter(t => t.id !== teacher.id));
        // Optionally, show a success message
      } catch (err) {
        console.error('Failed to delete teacher:', err);
        setError(err.message || 'Failed to delete teacher. Please try again.');
        // Optionally, show an error message to the user
      }
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Username', accessor: 'username' },
    {
      header: 'Name',
      accessor: 'name', // For sorting/filtering if needed, actual render is custom
      render: (row) => `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'N/A',
    },
    { header: 'Email', accessor: 'email' },
  ];

  return (
    <div className="bg-[#E7EFFC] min-h-screen px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <Header type="h1" fontSize="3xl" weight="bold">Teachers</Header>
            <Button 
                onClick={handleAddTeacher}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
            >
                <AiOutlinePlusCircle className="w-5 h-5" />
                Add Teacher
            </Button>
        </div>
        
        {loading && <p className="text-center py-4">Loading teachers...</p>}
        {error && 
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
            <button onClick={fetchTeachers} className="mt-2 text-sm text-red-700 underline">Try again</button>
          </div>
        }
        {!loading && (
          <Table 
            columns={columns} 
            data={teachers} 
            onEdit={handleEditTeacher} 
            onDelete={handleDeleteTeacher} 
            onAdd={handleAddTeacher} // Pass onAdd to Table for the "No data" case
            addLabel="Add New Teacher"
          />
        )}
      </div>
    </div>
  );
};

export default TeachersSection; 