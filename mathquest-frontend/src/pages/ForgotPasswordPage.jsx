import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';
import { Button } from "../ui/button";
import { Header } from "../ui/heading";
import { MdKeyboardBackspace } from "react-icons/md";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    try {
      const result = await AuthService.forgotPassword(email);
      setSuccess(result.message);
      // After 3 seconds, redirect to login
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Please check your email for password reset instructions.' }
        });
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
        <div className="text-center">
          <Header type="h1" fontSize="3xl" weight="bold" className="mb-6">
            Forgot Password
          </Header>
          <p className="text-gray-600 mb-8">
            Enter your email address and we'll send you instructions to reset your password.
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

          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              variant="default"
              size="sm"
              className="w-full"
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </Button>
          </div>

          <div className="text-center">
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate('/login')}
            className="text-primary flex items-center justify-center group"
          >
            <span className="flex items-center gap-1 group-hover:underline">
              <MdKeyboardBackspace />
              Back to Login
            </span>
          </Button>
        </div>


        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 