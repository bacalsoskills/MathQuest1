import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import UserService from '../services/userService';
import { useAuth } from '../context/AuthContext';

const EmailUpdateVerification = () => {
  // Extract token from URL query parameter
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  
  const [message, setMessage] = useState('Verifying your email update...');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { refreshCurrentUser } = useAuth();

  useEffect(() => {
    const verifyEmailUpdate = async () => {
      if (!token) {
        setError('Verification token not found. Please check your verification link.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      setMessage('');

      try {
        const response = await UserService.verifyEmailUpdate(token);
        setMessage(response.message || 'Email updated successfully!');
        // Refresh the user context to get the updated email
        await refreshCurrentUser();
        setTimeout(() => {
          navigate('/profile', { state: { message: 'Email updated successfully!' } });
        }, 3000);
      } catch (err) {
        setError(err.message || 'Failed to verify email update. The link might be invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    verifyEmailUpdate();
  }, [token, navigate, refreshCurrentUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl text-center">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Email Update Verification
        </h2>
        {loading && (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <p className="ml-3 text-gray-700">{message || 'Verifying...'}</p>
          </div>
        )}
        {!loading && error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        {!loading && !error && message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline"> {message} Redirecting to profile...</span>
          </div>
        )}
        {!loading && (
          <p className="mt-4 text-sm text-gray-600">
            Go to your{' '}
            <Link to="/profile" className="font-medium text-blue-600 hover:text-blue-500">
              Profile
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default EmailUpdateVerification; 