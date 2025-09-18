import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Header } from '../../ui/heading';
import { Button } from '../../ui/button';
import { FaChevronLeft } from 'react-icons/fa';

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

const FeedbackTicketPage = () => {
  const { ticketNumber } = useParams();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchFeedback();
    // eslint-disable-next-line
  }, [ticketNumber]);

  const fetchFeedback = async () => {
    try {
      const response = await api.get(`/admin/feedback/ticket/${ticketNumber}`);
      setFeedback(response.data);
      setStatus(response.data.status);
      setAdminResponse(response.data.adminResponse || '');
      setLoading(false);
    } catch (err) {
      setError('Failed to load feedback ticket.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    try {
      await api.put(`/admin/feedback/${feedback.id}`, {
        status,
        adminResponse: adminResponse || '', // allow empty response
      });
      setSuccess(true);
      fetchFeedback();
    } catch (err) {
      setError('Failed to submit response.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }
  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  }
  if (!feedback) return null;

  const user = feedback.user || {};
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;

  return (
    <div className="px-4 sm:px-6 lg:px-8 lg:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <Link to="/admin/feedback" className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
            <FaChevronLeft className="mr-1" />
            <span>Back to Feedback List</span>
          </Link>
        </div>
        <Header type="h1" fontSize="5xl" weight="bold" className="mb-6 text-primary dark:text-white"> Feedback Ticket</Header>
        <div className="h-[1px] w-full bg-gradient-to-r from-[#18C8FF] via-[#4B8CFF] to-[#6D6DFF] mb-5 md:mb-8"></div>
        
        <div className="flex flex-col md:flex-row justify-start md:justify-between mb-8">
          <Header type='h1' fontSize='2xl' weight='bold' className="text-2xl font-bold dark:text-gray-300 text-gray-900">FEEDBACK TICKET#: <span className="font-mono text-blue-800 dark:text-blue-300">{feedback.ticketNumber}</span></Header>
          <div className="text-left md:text-right  mt-3 md:mt-0 text-gray-700 text-sm dark:text-gray-300">Date Submitted: {new Date(feedback.dateSubmission).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <Header type='h3' fontSize='lg' weight='semibold' className="text-lg font-semibold mb-2 dark:text-gray-300 text-gray-800">User Information</Header>
            <div className="text-gray-800 text-sm space-y-1 dark:text-gray-300">
              <div><span className="font-semibold">Name:</span> {fullName}</div>
              <div><span className="font-semibold">Role:</span> {getRoleLabel(user)}</div>
              <div><span className="font-semibold">Email:</span> {user.email}</div>
              {user.id && <div><span className="font-semibold">Student ID:</span> {user.id}</div>}
            </div>
          </div>
          <div>
            <Header type='h3' fontSize='lg' weight='semibold' className="text-lg font-semibold mb-2 dark:text-gray-300 text-gray-800">Feedback Information</Header>
            <div className="text-gray-800 text-sm space-y-1 dark:text-gray-300">
              <div><span className="font-semibold">Subject:</span> {feedback.subject}</div>
              <div><span className="font-semibold">Message:</span> <span className="whitespace-pre-line">{feedback.info}</span></div>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold dark:text-gray-300 text-gray-800">Status:</span>
              <select
                className="border border-gray-700 dark:text-gray-800 dark:border-gray-300 rounded px-2 py-1 text-sm bg-white  text-gray-800"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="PENDING" className="bg-gray-300 text-gray-700 hover:text-blue-600">PENDING</option>
                <option value="IN_PROGRESS" className="bg-gray-300 text-gray-700 hover:text-blue-600">IN PROGRESS</option>
                <option value="IN_REVIEW" className="bg-gray-300 text-gray-700 hover:text-blue-600">IN REVIEW</option>
                <option value="COMPLETED" className="bg-gray-300 text-gray-700 hover:text-blue-600">COMPLETED</option>
                <option value="REJECTED" className="bg-gray-300 text-gray-700 hover:text-blue-600">REJECTED</option>
              </select>
            </div>
          </div>
          <textarea
            className="w-full min-h-[150px] border border-gray-300 rounded p-3 mb-4 text-gray-800 bg-blue-50"
            placeholder="Enter your response..."
            value={adminResponse}
            onChange={e => setAdminResponse(e.target.value)}
          />
          <Button
            type="submit"
            rounded="full"
            variant="default"
            size="sm"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Response'}
          </Button>
          {success && <div className="mt-3 text-green-700">Response submitted successfully!</div>}
        </form>
      </div>
    </div>
  );
};

export default FeedbackTicketPage; 