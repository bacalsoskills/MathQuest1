import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const FeedbackForm = () => {
  const [subject, setSubject] = useState('');
  const [info, setInfo] = useState('');
  const [status, setStatus] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/feedback', {
        subject,
        info
      });
      setStatus('success');
      setTicketNumber(response.data.ticketNumber);
      setSubject('');
      setInfo('');
    } catch (error) {
      setStatus('error');
      console.error('Error submitting feedback:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Send Feedback</h2>
      
      {status === 'success' && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
          <p className="font-semibold mb-2">Feedback submitted successfully!</p>
          <p className="mb-2">Your ticket number is: <span className="font-bold">{ticketNumber}</span></p>
          <p>We've sent a confirmation email with your ticket details. We'll review your feedback and get back to you soon.</p>
        </div>
      )}
      
      {status === 'error' && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          Error submitting feedback. Please try again.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="info" className="block text-sm font-medium text-gray-700 mb-1">
            Feedback Details
          </label>
          <textarea
            id="info"
            value={info}
            onChange={(e) => setInfo(e.target.value)}
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Submit Feedback
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm; 