import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

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
    <div className="min-h-screen bg-blue-50 py-10 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg p-8 relative">
        <div className="flex justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">FEEDBACK TICKET#: <span className="font-mono">{feedback.ticketNumber}</span></h2>
          <div className="text-right text-gray-700 text-sm">Date Submitted: {new Date(feedback.dateSubmission).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">User Information</h3>
            <div className="text-gray-800 text-sm space-y-1">
              <div><span className="font-semibold">Name:</span> {fullName}</div>
              <div><span className="font-semibold">Role:</span> {getRoleLabel(user)}</div>
              <div><span className="font-semibold">Email:</span> {user.email}</div>
              {user.id && <div><span className="font-semibold">Student ID:</span> {user.id}</div>}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Feedback Information</h3>
            <div className="text-gray-800 text-sm space-y-1">
              <div><span className="font-semibold">Subject:</span> {feedback.subject}</div>
              <div><span className="font-semibold">Message:</span> <span className="whitespace-pre-line">{feedback.info}</span></div>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">Status:</span>
              <select
                className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="PENDING">PENDING</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="IN_REVIEW">IN REVIEW</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>
          <textarea
            className="w-full min-h-[150px] border border-gray-300 rounded p-3 mb-4 text-gray-800 bg-blue-50"
            placeholder="Enter your response..."
            value={adminResponse}
            onChange={e => setAdminResponse(e.target.value)}
          />
          <button
            type="submit"
            className="bg-purple-600 text-white px-6 py-2 rounded shadow hover:bg-purple-700 transition"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Response'}
          </button>
          {success && <div className="mt-3 text-green-700">Response submitted successfully!</div>}
        </form>
      </div>
    </div>
  );
};

export default FeedbackTicketPage; 