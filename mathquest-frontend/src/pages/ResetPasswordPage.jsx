import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthService from '../services/authService';
import { Button } from "../ui/button";
import { Header } from "../ui/heading";
import { FaRegEyeSlash, FaRegEye } from "react-icons/fa";

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get token from URL query parameters
  const token = new URLSearchParams(location.search).get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!token) {
      setError('Invalid or missing reset token');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const result = await AuthService.resetPassword(token, newPassword, confirmPassword);
      setSuccess(result.message);
      // After 3 seconds, redirect to login
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Password has been reset successfully. Please login with your new password.' }
        });
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(prev => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(prev => !prev);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center">
            <Header type="h1" fontSize="3xl" weight="bold" className="text-red-600 mb-6">
              Invalid Reset Link
            </Header>
            <p className="text-gray-600 mb-8">
              The password reset link is invalid or has expired. Please request a new password reset.
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/forgot-password')}
            >
              Request New Reset Link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
        <div className="text-center">
          <Header type="h1" fontSize="3xl" weight="bold" className="mb-6">
            Reset Password
          </Header>
          <p className="text-gray-600 mb-8">
            Please enter your new password.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="sr-only">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  className="appearance-none rounded relative block w-full px-3 py-2 pr-12 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={toggleNewPasswordVisibility}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 z-10 bg-transparent"
                  aria-label="Toggle new password visibility"
                  style={{ background: 'none', border: 'none', padding: 0 }}
                >
                  {showNewPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="appearance-none rounded relative block w-full px-3 py-2 pr-12 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 z-10 bg-transparent"
                  aria-label="Toggle confirm password visibility"
                  style={{ background: 'none', border: 'none', padding: 0 }}
                >
                  {showConfirmPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              variant="default"
              size="sm"
              className="w-full"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate('/login')}
              className="text-primary hover:underline"
            >
              Back to Login
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 