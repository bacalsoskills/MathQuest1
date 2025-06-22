import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaRegEyeSlash, FaRegEye } from 'react-icons/fa';
import { Button } from "../ui/button";
import { Header } from "../ui/heading";
import { Input } from "../ui/input";

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Only clear error and success when submitting
    setError('');
    setSuccess('');
    setLoading(true);
    if (!identifier.trim() || !password) {
      setError('Username/Email and password are required');
      setLoading(false);
      return;
    }
    try {
      console.log("Attempting login with:", identifier);
      const result = await login(identifier, password);
      
      if (result.success) {
        setSuccess('Login successful');
        navigate('/');
      } else {
        // This block will be entered if login() catches an error internally and returns {success: false}
        setError(result.error || 'Failed to login. Please check credentials.');
      }
    } catch (err) {
      // This block will be entered if login() throws an error
      console.error("Login error:", err);
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="md:py-28 flex items-center justify-center">
      <div className="w-full max-w-5xl mx-4 2xl:mx-auto flex flex-col md:flex-row items-center justify-center rounded-2xl shadow-xl py-12 2xl:py-28 px-8 border border-white/10 dark:border-gray-700 backdrop-blur-md bg-gray-100 dark:bg-transparent">
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
          <Link to="/">
            <img
              src="/images/new-logo.png"
              alt="MathQuest Logo"
              className="w-40 h-40 md:w-72 md:h-72 object-contain mb-2 drop-shadow-xl"
              draggable="false"
            />
          </Link>
          <Header type="h1" fontSize="5xl" weight="thin" className=" text-primary/80 dark:text-white/80 mb-2 text-center drop-shadow-lg">
            Welcome to MathQuest!
          </Header>
        </div>
        {/* Right: Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center mt-5 lg:mt-0">
          <form className="w-full md:max-w-xs mx-auto" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{success}</span>
              </div>
            )}
            <div className="mb-4">
              <Input
                id="identifier"
                name="identifier"
                type="text"
                required
                variant="form"
                placeholder="Email or Username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="mb-4 relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                variant="form"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-8 flex items-center text-gray-500 z-10 bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label="Toggle password visibility"
                style={{ background: 'none', border: 'none', padding: 0 }}
              >
                {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
              </button>
            </div>
            <div className="flex justify-end mb-6">
              <Link to="/forgot-password" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="flex justify-end mb-6">
              <Button
                type="submit"
                disabled={loading}
                variant="default"
                size="sm"
                rounded="full"
                className="w-full transition-all duration-200"
              >
                {loading ? 'Signing in...' : 'Log In'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;