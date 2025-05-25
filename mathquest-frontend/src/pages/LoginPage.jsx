import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaGoogle, FaFacebookF } from 'react-icons/fa';
import { Button } from "../ui/button"
import { Header } from "../ui/heading"

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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
      
      // Call the login function with the identifier (username/email) and password
      const result = await login(identifier, password);
      
      console.log("Login result:", result);
      
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
  <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div className="flex w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden">
      <div className="w-1/3 bg-primary flex flex-col items-center justify-center p-8 text-white">
      <Header type="h2" fontSize="2xl" weight="bold" className=" mb-4 text-center text-white">No Account Yet?</Header>
        <Button
              to="/register"
              variant="outline"
              size="sm"
            >
          Sign Up
        </Button>
      </div>
        <div className="w-2/3 p-8">
            <div className="max-w-md mx-auto">
            <Header type="h1" fontSize="3xl" weight="bold"  className="text-dark text-center mb-6">
            Sign Up
          </Header>
      <div className="flex justify-center space-x-4 mb-6">
        <button className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors">
          <FaGoogle className="!text-primary text-base" />
        </button>
        <button className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors">
          <FaFacebookF className="text-primary text-base" />
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or use your email account</span>
        </div>
      </div>
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
          
          <div className="">
            <div className='mb-3'>
              <label htmlFor="identifier" className="sr-only">
                Username or Email address
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                className={`appearance-none rounded relative block w-full px-3 py-2 border  placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Username or Email address"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
                <div className="flex justify-end mt-1 mb-5">
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>

          <div>
              
            </div>

          </div>
        
          <Button type="submit" disabled={loading} 
              variant="default"
              size="sm"
              className="w-full"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
          </form>
        </div>
   
  </div>
</div>


  );
};

export default LoginPage;