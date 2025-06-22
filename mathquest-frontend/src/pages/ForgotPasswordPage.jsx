import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';
import { Button } from "../ui/button";
import { Header } from "../ui/heading";
import { MdKeyboardBackspace } from "react-icons/md";
import { Input } from "../ui/input";

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
    <div className="md:py-28 flex items-center justify-center">
      <div className="w-full max-w-xl mx-4 flex flex-col items-center justify-center rounded-2xl shadow-xl py-12 px-8 border border-white/10 dark:border-gray-700 backdrop-blur-md bg-gray-100 dark:bg-transparent">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center">
            <Header type="h1" fontSize="3xl" weight="bold" className="mb-6 text-gray-900 dark:text-white">
              Forgot Password
            </Header>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
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
              <Input
                id="email"
                name="email"
                type="email"
                required
                variant="form"
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
                rounded="full"
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
    </div>
  );
};

export default ForgotPasswordPage; 