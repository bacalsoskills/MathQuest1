import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthService from '../services/authService';

const VerificationPage = () => {
  // Extract token from URL query parameter instead of path parameter
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  
  const [message, setMessage] = useState('Verifying your email...');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();




  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setError('Verification token not found. Please check your verification link.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      setMessage('Verifying your email...');

      try {
        // Add a small delay to ensure backend is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const response = await AuthService.verifyEmail(token);
        setMessage(response.message || 'Email verified successfully!');
       
        setTimeout(() => {
          navigate('/login', { state: { message: 'Email verified successfully! You can now log in.' } });
        }, 2000);
      } catch (err) {
        console.error('Verification error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to verify email. The link might be invalid or expired.');
        
        // If there was an error, retry once after a delay
        if (!err.retried) {
          setTimeout(() => {
            verify({ retried: true });
          }, 1000);
        }
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token, navigate]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col">
      {/* Logo/Header section */}
      <div className="w-full p-4 bg-white shadow-md">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="text-2xl font-bold text-blue-600">MathQuest</Link>
        </div>
      </div>
      
      {/* Content section */}
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl text-center">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Verification
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
              <span className="block sm:inline"> {message} Redirecting to login...</span>
            </div>
          )}
          {!loading && (
            <p className="mt-4 text-sm text-gray-600">
              Go back to{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Login
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationPage; 