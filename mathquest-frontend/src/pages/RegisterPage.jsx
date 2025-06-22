import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaGoogle, FaFacebookF, FaRegEyeSlash, FaRegEye } from 'react-icons/fa';
import { Button } from "../ui/button"
import { Header } from "../ui/heading"
import { Input } from "../ui/input"


const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'STUDENT'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    setGeneralError('');
    setSuccessMessage('');
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(prev => !prev);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
        newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      // Simple format check (has @ and .)
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address format';
      }
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setSuccessMessage('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create the registration data object with the exact field names expected by the backend
      const registrationData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role // This will be formatted to array in authService.js
      };
      
      // Call the register function from AuthContext
      const result = await register(registrationData); 
      
      if (result && result.message) {
        
        if (result.message.startsWith("Error:")) {
          setGeneralError(result.message);
        } else {
        
          setSuccessMessage(result.message);
         
          setFormData({
            username: '', email: '', password: '', confirmPassword: '',
            firstName: '', lastName: '', role: 'STUDENT'
          });
          setErrors({});
        }
      } else {
        setGeneralError('Failed to create account. Please check the details.');
      }
    } catch (err) {
      console.error("Registration error:", err);
      
      setGeneralError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="md:py-28 flex items-center justify-center">
      <div className="w-full max-w-5xl mx-4 2xl:mx-auto flex flex-col md:flex-row items-center justify-center rounded-2xl shadow-xl py-12 2xl:py-28 px-8 border border-white/10 dark:border-gray-700 backdrop-blur-md bg-gray-100 dark:bg-transparent">
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Success!</strong>
              <span className="block sm:inline"> {successMessage}</span>
            </div>
          )}
          <Link to="/">
            <img
              src="/images/new-logo.png"
              alt="MathQuest Logo"
              className="w-40 h-40 md:w-72 md:h-72 object-contain mb-2 drop-shadow-xl"
              draggable="false"
            />
          </Link>
          <Header type="h1" fontSize="5xl" weight="thin" className=" text-primary/80 dark:text-white/80 mb-2 text-center drop-shadow-lg">
            Create Account
          </Header>
        </div>
        <div className="w-full lg:w-1/2 flex flex-col justify-center mt-5 lg:mt-0">
          {/* Registration Form */}
          <div className="w-full md:max-w-xs mx-auto">
          
          
        
            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {generalError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{generalError}</span>
                </div>
              )}
             
              <div className="">
                <div className="grid grid-cols-1 gap-y-4 gap-x-3 sm:grid-cols-2 mb-3">
                  <div>
                    <label htmlFor="firstName" className="sr-only">
                      First Name
                    </label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      variant="form"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="sr-only">
                      Last Name
                    </label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required      
                      variant="form"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="username" className="sr-only">
                    Username
                  </label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    variant="form"
                          
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                  )}
                </div>

                <div className="mb-3">
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
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      variant="form"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-8 flex items-center text-gray-500 z-10 bg-transparent"
                      aria-label="Toggle password visibility"
                      style={{ background: 'none', border: 'none', padding: 0 }}
                    >
                      {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                  )}
                </div>

                <div className="mb-3">
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
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute inset-y-0 right-8 flex items-center text-gray-500 z-10 bg-transparent"
                      aria-label="Toggle confirm password visibility"
                      style={{ background: 'none', border: 'none', padding: 0 }}
                    >
                      {showConfirmPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="role" className="sr-only">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    required
                    className="appearance-none rounded-md relative block w-full py-4 px-4 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-gray-200 dark:bg-white/80"

                    value={formData.role}
                    onChange={handleChange}
                    style={
                      isDark
                        ? {
                            backgroundColor: "white",
                          }
                        : {}
                    }

                  >
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher</option>
                  </select>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  rounded="full"
                  className="w-full"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </Button>
              </div>
            </form>
            <div className="flex justify-center mt-6">
              <span className="text-sm text-gray-600 dark:text-gray-300">Already have an account?</span>
              <Link to="/login" className="ml-2 -mt-[0.5px] text-blue-600 dark:text-blue-400 hover:underline">Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 