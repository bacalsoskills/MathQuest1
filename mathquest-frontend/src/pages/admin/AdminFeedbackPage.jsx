import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Table } from '../../ui/table';
import { Header } from "../../ui/heading"
import { CiSearch } from "react-icons/ci";
import { Input } from "../../ui/input";

const AdminFeedbackPage = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || !isAdmin()) {
      navigate('/');
      return;
    }
    fetchFeedback();
  }, [currentUser, isAdmin, navigate]);

  const fetchFeedback = async () => {
    try {
      const response = await api.get('/admin/feedback');
      setFeedback(response.data);
      setLoading(false);
      // Log the feedback data for debugging
      console.log('Fetched feedback:', response.data);
      if (response.data && response.data.length > 0) {
        response.data.forEach(item => {
          console.log('User object:', item.user);
          console.log('User role:', item.user && item.user.role);
        });
      }
    } catch (error) {
      setError('Failed to fetch feedback');
      setLoading(false);
      console.error('Error fetching feedback:', error);
    }
  };

  const getRoleLabel = (user) => {
    if (!user) return '';
    let role = '';
    if (Array.isArray(user.roles) && user.roles.length > 0) {
      role = user.roles[0].name;
    } else if (typeof user.role === 'string') {
      role = user.role;
    }
    if (role === 'ROLE_STUDENT' || role === 'student' || role === 'STUDENT') return 'Student';
    if (role === 'ROLE_TEACHER' || role === 'teacher' || role === 'TEACHER') return 'Teacher';
    if (role === 'ROLE_ADMIN' || role === 'admin' || role === 'ADMIN') return 'Admin';
    return role || '';
  };

  const columns = [
    {
      header: 'Ticket Number',
      accessor: 'ticketNumber',
      render: (row) => (
        <span className="font-mono cursor-pointer text-blue-700 hover:underline" onClick={() => navigate(`/admin/feedback/${row.ticketNumber}`)}>{row.ticketNumber}</span>
      ),
    },
    {
      header: 'Full Name',
      render: (row) => {
        const user = row.user;
        if (!user) return '';
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        return fullName || user.username;
      },
    },
    {
      header: 'User Role',
      render: (row) => getRoleLabel(row.user),
    },
    {
      header: 'Email',
      render: (row) => row.user && row.user.email,
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          row.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
          row.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
          row.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.status}
        </span>
      ),
    },
  ];

  const filteredFeedback = feedback.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = item.user ? `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim().toLowerCase() : '';
    const email = item.user?.email?.toLowerCase() || '';
    const ticketNumber = item.ticketNumber?.toString().toLowerCase() || '';
    const status = item.status?.toLowerCase() || '';
    
    return fullName.includes(searchLower) ||
           email.includes(searchLower) ||
           ticketNumber.includes(searchLower) ||
           status.includes(searchLower);
  });

  return (
    <div className="bg-[#E7EFFC] min-h-screen px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      <div className="max-w-7xl mx-auto">
        <div className='mb-5'>
          <Header type="h1" fontSize="3xl" weight="bold" className="mb-6">Feedbacks</Header>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !text-gray-800">
              <CiSearch />
            </div>
            <Input
              type="search"
              name="search"
              id="search"
              className="block w-full sm:w-64 pl-10 pr-3 py-2 sm:text-sm !text-gray-800"
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Table columns={columns} data={filteredFeedback} />
      </div>
    </div>
  );
};

export default AdminFeedbackPage;