import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const FeedbackList = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const response = await api.get('/api/feedback/my-feedback');
      setFeedback(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch feedback');
      setLoading(false);
      console.error('Error fetching feedback:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">My Feedback History</h2>
      
      {feedback.length === 0 ? (
        <div className="text-center text-gray-600 py-8">
          You haven't submitted any feedback yet.
        </div>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <div
              key={item.id}
              className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{item.subject}</h3>
                  <p className="text-sm text-gray-500">Ticket: {item.ticketNumber}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  item.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  item.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                  item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status}
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-700 whitespace-pre-wrap">{item.info}</p>
              </div>
              
              {item.adminResponse && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Admin Response:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{item.adminResponse}</p>
                </div>
              )}
              
              <div className="mt-4 text-sm text-gray-500">
                Submitted on: {new Date(item.dateSubmission).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackList; 