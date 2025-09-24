import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthService from '../services/authService';
import { Button } from "../ui/button";
import { Header } from "../ui/heading";
import { FaRegEyeSlash, FaRegEye, FaSkullCrossbones, FaAnchor, FaCompass, FaSun, FaMoon } from "react-icons/fa";
import { Input } from "../ui/input";
import { MdKeyboardBackspace } from "react-icons/md";
import { useTheme } from '../context/ThemeContext';

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
  const { darkMode, setDarkMode, isInitialized } = useTheme();

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
      <div
        className="min-h-screen md:py-20 py-10 flex items-center justify-center px-4 sm:px-6"
        style={{
          backgroundImage: darkMode
            ? "linear-gradient(180deg, rgba(2,6,23,1) 0%, rgba(3,7,18,1) 100%)"
            : "url('/images/game-images/map.png')",
          backgroundSize: darkMode ? 'cover' : 'cover',
          backgroundRepeat: 'repeat',
        }}
      >
        <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl mx-auto flex flex-col items-center justify-center rounded-2xl shadow-2xl py-8 sm:py-10 px-5 sm:px-8 border border-white/10 dark:border-yellow-600/40 backdrop-blur-sm"
             style={{
               background: darkMode ? 'rgba(10, 13, 26, 0.85)' : '#f5ecd2',
               boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.1)'
             }}>
          <div className="w-full">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
              <FaCompass className={(darkMode ? 'text-yellow-400' : 'text-yellow-700') + ' text-lg sm:text-xl'} />
              <Header type="h1" fontSize="3xl" weight="bold" className={(darkMode ? 'text-yellow-300' : 'text-gray-900') + ' text-2xl sm:text-3xl'}>
                Invalid Reset Link
              </Header>
              <FaSkullCrossbones className={(darkMode ? 'text-yellow-400' : 'text-yellow-700') + ' text-lg sm:text-xl'} />
            </div>
            <p className={"text-center mb-6 " + (darkMode ? 'text-gray-300' : 'text-gray-700') + ' text-sm sm:text-base'}>
                The password reset link is invalid or has expired. Please request a new password reset.
              </p>
            <div className="flex items-center justify-center gap-3 mb-6">
              {isInitialized && (
                <Button
                  variant="outlineWhite"
                  size="sm"
                  onClick={() => setDarkMode(!darkMode)}
                  className="!rounded-full flex items-center gap-2"
                >
                  {darkMode ? <FaSun className="text-yellow-300" /> : <FaMoon className="text-blue-700" />}
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </Button>
              )}
            </div>
            <div className="flex items-center justify-center">
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/forgot-password')}
                className="!rounded-full w-full sm:w-auto"
              >
                Request New Reset Link
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-6 opacity-80">
              <FaAnchor className={(darkMode ? 'text-gray-400' : 'text-gray-500') + ' text-base sm:text-lg'} />
              <span className={(darkMode ? 'text-gray-400' : 'text-gray-600') + ' text-xs sm:text-sm'}>Set sail again from the login page</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen md:py-20 py-10 flex items-center justify-center px-4 sm:px-6"
      style={{
        backgroundImage: darkMode
          ? "linear-gradient(180deg, rgba(2,6,23,1) 0%, rgba(3,7,18,1) 100%)"
          : "url('/images/game-images/map.png')",
        backgroundSize: darkMode ? 'cover' : 'cover',
        backgroundRepeat: 'repeat',
      }}
    >
      <div
        className="w-full max-w-md sm:max-w-lg lg:max-w-xl mx-auto flex flex-col items-center justify-center rounded-2xl shadow-2xl py-8 sm:py-10 px-5 sm:px-8 border border-white/10 dark:border-yellow-600/40 backdrop-blur-sm"
        style={{
          background: darkMode ? 'rgba(10, 13, 26, 0.85)' : '#f5ecd2',
          boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.1)'
        }}
      >
        <div className="w-full">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <FaCompass className={(darkMode ? 'text-yellow-400' : 'text-yellow-700') + ' text-lg sm:text-xl'} />
            <Header type="h1" fontSize="3xl" weight="bold" className={(darkMode ? 'text-yellow-300' : 'text-gray-900') + ' text-2xl sm:text-3xl'}>
              Reset Password
            </Header>
            <FaSkullCrossbones className={(darkMode ? 'text-yellow-400' : 'text-yellow-700') + ' text-lg sm:text-xl'} />
          </div>
          <p className={"text-center mt-2 " + (darkMode ? 'text-gray-300' : 'text-gray-700') + ' text-sm sm:text-base'}>
            Enter a new secret code to unlock your treasure chest.
          </p>

          <div className="flex items-center justify-center gap-3 mt-5">
            {isInitialized && (
              <Button
                variant="outlineWhite"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className="!rounded-full flex items-center gap-2"
              >
                {darkMode ? <FaSun className="text-yellow-300" /> : <FaMoon className="text-blue-700" />}
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </Button>
            )}
          </div>

          <form className="mt-8 space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
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
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    variant="form"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={(darkMode ? '!bg-[#0f1428] !text-gray-100' : '!bg-[#fbf4de] !text-gray-900') + ' text-sm sm:text-base'}
                  />
                  <button
                    type="button"
                    onClick={toggleNewPasswordVisibility}
                    className="absolute inset-y-0 right-4 sm:right-8 flex items-center text-gray-500 z-10 bg-transparent"
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
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    variant="form"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={(darkMode ? '!bg-[#0f1428] !text-gray-100' : '!bg-[#fbf4de] !text-gray-900') + ' text-sm sm:text-base'}
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute inset-y-0 right-4 sm:right-8 flex items-center text-gray-500 z-10 bg-transparent"
                    aria-label="Toggle confirm password visibility"
                    style={{ background: 'none', border: 'none', padding: 0 }}
                  >
                    {showConfirmPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={loading}
                variant="default"
                size="sm"
                rounded="full"
                className="w-full"
              >
                {loading ? 'Hoisting Sails...' : 'Reset Password'}
              </Button>
            </div>

            <div className="text-center">
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate('/login')}
                className={"flex items-center justify-center group " + (darkMode ? 'text-yellow-300' : 'text-primary') + ' text-sm sm:text-base'}
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

export default ResetPasswordPage; 