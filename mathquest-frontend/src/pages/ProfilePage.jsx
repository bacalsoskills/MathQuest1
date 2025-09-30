import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserService from '../services/userService';
import api from '../services/api';
import { Button } from "../ui/button"
import { Header } from "../ui/heading"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import AuthService from '../services/authService';
import { FaRegEyeSlash, FaRegEye, FaSkullCrossbones, FaCompass, FaAnchor, FaShip } from "react-icons/fa";
import { useTheme } from '../context/ThemeContext';

const ProfilePage = () => {
  const { currentUser, logout, refreshCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('edit');
  const [pendingEmailVerification, setPendingEmailVerification] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now()); // Used to force re-render of avatar
  const [imageLoaded, setImageLoaded] = useState(false);
  const [profileImageSrc, setProfileImageSrc] = useState('');
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [photoUploadLoading, setPhotoUploadLoading] = useState(false);
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
  
  
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    username: '',
    email: '',
  });

  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fileInputRef = useRef(null);
  const { darkMode } = useTheme();

  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName ? firstName[0] : '';
    const lastInitial = lastName ? lastName[0] : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  // Function to create image source from base64 data
  const createImageSource = (base64Data, imageName) => {
    if (!base64Data) return '';
    
    // Determine mime type based on filename or default to jpeg
    let mimeType = 'image/jpeg';
    if (imageName) {
      if (imageName.endsWith('.png')) mimeType = 'image/png';
      else if (imageName.endsWith('.gif')) mimeType = 'image/gif';
      else if (imageName.endsWith('.webp')) mimeType = 'image/webp';
    }
    
    // Create data URL
    return `data:${mimeType};base64,${base64Data}`;
  };

  // Function to fetch the profile image directly
  const fetchProfileImage = async () => {
    try {
      const imageUrl = await UserService.getProfileImage();
      if (imageUrl) {

        setProfileImageSrc(imageUrl);
        return true;
      }
      return false;
    } catch (err) {

      return false;
    }
  };

  // Function to process the profile data and set up the image
  const processProfileData = (userData) => {

    
    if (userData.profileImage) {
      const imageSrc = createImageSource(userData.profileImage, userData.profileImageName);
    
      setProfileImageSrc(imageSrc);
    } else {
  
      setProfileImageSrc('');
    }
    
    setProfile(userData);
    
    setEditFormData({
      fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
      username: userData.username || '',
      email: userData.email || '',
    });
    
    // Only set pendingEmailVerification if there's a pending email that's different from current email
    setPendingEmailVerification(!!userData.pendingEmail && userData.pendingEmail !== userData.email);
    setImageLoaded(false);
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const userData = await UserService.getUserProfile();
        // Process the profile data
        processProfileData(userData);
        
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser, navigate]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {

    setImageLoaded(false);
    fetchProfileImage();
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setProfileUpdateLoading(true);

    const nameParts = editFormData.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    try {
      const updateData = {
        firstName: firstName,
        lastName: lastName,
        email: editFormData.email,
        username: editFormData.username
      };

      // First update the profile
      const updatedUser = await UserService.updateUserProfile(updateData);
      
      // Check if email was changed
      if (profile.email !== editFormData.email) {
        setPendingEmailVerification(true);
        setSuccess('A verification email has been sent to your new email address. Please check your inbox and verify to complete the update. You will be logged out after verification.');
      } else {
        setSuccess('Profile updated successfully');
      }

      // Refresh the auth token and current user data
      await refreshCurrentUser();
      
      // Process the updated profile data
      processProfileData(updatedUser);
      
      setProfileUpdateLoading(false);
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.message || 'Failed to update profile');
      setProfileUpdateLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordLoading(true);

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordError("New passwords do not match.");
      setPasswordLoading(false);
      return;
    }
    if (passwordFormData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      setPasswordLoading(false);
      return;
    }

    try {
      const result = await AuthService.changePassword(
        passwordFormData.currentPassword, 
        passwordFormData.newPassword, 
        passwordFormData.confirmPassword
      );
      
      setPasswordSuccess(result.message || "Password changed successfully.");
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error("Password change error:", err);
      setPasswordError(err.message || "Failed to change password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone and all associated data will be removed.')) {
      try {
        await UserService.deleteAccount();
        logout();
        navigate('/login', { replace: true });
      } catch (err) {
        console.error("Delete account error:", err);
        setError(err.message || 'Failed to delete account. Please try again.');
      }
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setPhotoUploadLoading(true);

    try {

      const response = await UserService.uploadProfilePicture(file);
    
      setSuccess("Profile picture updated successfully.");
      

      const userData = await UserService.getUserProfile();

      processProfileData(userData);
     
      await refreshCurrentUser();

      setAvatarKey(Date.now());

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
    
      setError(err.message || "Failed to upload photo.");
    } finally {
      setPhotoUploadLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatRoleDisplay = (roles) => {
    if (!roles || !Array.isArray(roles) || roles.length === 0) return 'N/A';
    const roleName = typeof roles[0] === 'string' ? roles[0] : roles[0]?.name;
    return roleName ? roleName.replace('ROLE_', '').charAt(0).toUpperCase() + roleName.replace('ROLE_', '').slice(1).toLowerCase() : 'N/A';
  };

  const pageTitle = `${formatRoleDisplay(profile?.roles)} Profile`;

  // Add new function to handle resending verification email
  const handleResendVerification = async () => {
    try {
      setResendLoading(true);
      await UserService.resendVerificationEmail();
      setSuccess('Verification email has been resent. Please check your inbox.');
      setShowResendVerification(false);
      const userData = await UserService.getUserProfile();
      processProfileData(userData);
    } catch (err) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  // Add new function to handle email verification
  const handleEmailVerification = async (token) => {
    try {
      const response = await api.get(`/auth/verify?token=${token}`);
      
      // Log out the user after successful verification
      await logout();
      navigate('/login', { 
        state: { 
          message: 'Email verified successfully! Please log in with your new email address.' 
        }
      });
    } catch (err) {
      console.error("Email verification error:", err);
      setError(err.message || 'Failed to verify email. Please try again.');
    }
  };

  // Add useEffect to check for verification token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      handleEmailVerification(token);
    }
  }, []);

  if (loading && !profile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] lg:min-h-[85vh]"
           style={{
             backgroundImage: darkMode
               ? "linear-gradient(180deg, rgba(2,6,23,1) 0%, rgba(3,7,18,1) 100%)"
            : "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)",
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
           }}
      >
      <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] lg:min-h-[85vh]"
           style={{
             backgroundImage: darkMode
               ? "linear-gradient(180deg, rgba(2,6,23,1) 0%, rgba(3,7,18,1) 100%)"
            : "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)",
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
           }}
      >
        <div className="text-base sm:text-lg md:text-xl font-semibold text-red-600">{error || "Could not load profile."}</div>
      </div>
    );
  }

  return (
    <div
      className="px-4 sm:px-6 lg:py-10 py-6"
      style={{
        backgroundImage: darkMode
          ? "linear-gradient(180deg, rgba(2,6,23,1) 0%, rgba(3,7,18,1) 100%)"
            : "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)",
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <FaCompass className={(darkMode ? 'text-yellow-400' : 'text-yellow-700') + ' text-lg sm:text-xl'} />
          <Header type="h1" fontSize="5xl" weight="bold" className={(darkMode ? 'text-yellow-300' : 'text-primary') + ' mb-1 text-3xl sm:text-4xl lg:text-5xl'}> {pageTitle} </Header>
          <FaSkullCrossbones className={(darkMode ? 'text-yellow-400' : 'text-yellow-700') + ' text-lg sm:text-xl'} />
        </div>
      </div>
      <div className="h-[2px] w-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 mb-4 sm:mb-6 md:mb-8 opacity-80"></div>


        {/* Add verification reminders */}
        {profile?.createdByAdmin && !profile?.emailVerified && profile?.emailVerificationRequired && (
          <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative text-sm sm:text-base" role="alert">
            <strong>Email Verification Required:</strong> Please verify your email address to access all features.
            {!showResendVerification ? (
              <button 
                onClick={() => setShowResendVerification(true)}
                className="ml-2 text-yellow-700 underline"
                disabled={resendLoading}
              >
                {resendLoading ? 'Sending...' : 'Resend verification email'}
              </button>
            ) : (
              <button 
                onClick={handleResendVerification}
                className="ml-2 text-yellow-700 underline"
                disabled={resendLoading}
              >
                {resendLoading ? 'Sending...' : 'Click to resend'}
              </button>
            )}
          </div>
        )}

        {profile?.temporaryPassword && (
          <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative text-sm sm:text-base" role="alert">
            <strong>Password Update Required:</strong> You are using a temporary password. Please update your password for security.
            <p className="text-xs sm:text-sm mt-1">Your temporary password will expire in 7 days.</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
  
          <div
            className="w-full md:w-1/3 flex flex-col items-center space-y-4 mt-6 md:mt-12 px-6 sm:px-10 rounded-2xl border border-white/10 dark:border-yellow-600/40 shadow-xl"
            style={{
              background: darkMode ? 'rgba(10, 13, 26, 0.85)' : '#f5ecd2',
              boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.1)'
            }}
          >
            <Avatar className="h-40 w-40 sm:h-48 sm:w-48 md:h-52 md:w-52 shadow-sm rounded-md overflow-hidden mt-6">
              {profileImageSrc ? (
                <AvatarImage 
                  src={profileImageSrc} 
                  alt={editFormData.fullName} 
                  key={avatarKey}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  style={{objectFit: 'cover'}}
                />
              ) : (
                <AvatarFallback className="text-3xl sm:text-4xl bg-yellow-500 text-white">
                  {getInitials(profile?.firstName, profile?.lastName)}
                </AvatarFallback>
              )}
            </Avatar>
           
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <Button 
              type="button" 
              onClick={triggerFileInput} 
              variant="link"
              size="sm"
              className="w-full"
              rounded="full"
              disabled={photoUploadLoading}
            >
              {photoUploadLoading ? 'Hoisting Portrait...' : profile?.profileImage ? 'Change Portrait' : 'Upload a Portrait'}
            </Button>
            <div className="flex items-center gap-2 mb-6 opacity-80">
              <FaShip className={(darkMode ? 'text-gray-400' : 'text-gray-600') + ' text-base sm:text-lg'} />
              <span className={(darkMode ? 'text-gray-300' : 'text-gray-700') + ' text-sm sm:text-base'}>Captain {editFormData.fullName || currentUser?.username}</span>
            </div>
          </div>

      
          <div
            className="w-full md:w-2/3 rounded-2xl border border-white/10 dark:border-yellow-600/40 shadow-xl"
            style={{
              background: darkMode ? 'rgba(10, 13, 26, 0.85)' : '#f5ecd2',
              boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.1)'
            }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4 sm:mb-6 !font-montserrat tracking-wide bg-transparent p-3 sm:p-4 flex gap-4 sm:gap-6 border-b border-yellow-600/30 overflow-x-auto">
                <TabsTrigger value="edit" className={`py-2 !rounded-none !px-0 text-base sm:text-lg !text-left !bg-transparent mr-3 ${activeTab === 'edit' ? 'dark:text-yellow-300 text-yellow-800 font-bold border-b-2 border-yellow-500' : 'dark:text-gray-300 text-yellow-900/80'}`}>
                  Edit Info
                </TabsTrigger>
                <TabsTrigger value="password" className={`!px-0 sm:!px-2 rounded-none py-2 text-base sm:text-lg !bg-transparent ${activeTab === 'password' ? 'dark:text-yellow-300 text-yellow-800 font-bold border-b-2 border-yellow-500 ' : 'dark:text-gray-300 text-yellow-900/80 '}`}>
                  Change Password
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="edit" className="px-4 sm:px-6 pb-6 sm:pb-8">
                <div>
                  {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm sm:text-base" role="alert">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-sm sm:text-base" role="alert">
                      {success}
                    </div>
                  )}
                  {/* {pendingEmailVerification && (
                    <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                      <strong>Email verification pending:</strong> We've sent a verification link to your new email address. 
                      Please check your inbox and verify to complete the email update.
                    </div>
                  )} */}
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="fullName" className={"block mb-1 " + (darkMode ? 'text-yellow-200' : 'text-gray-800') + ' text-sm sm:text-base'}>Full Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        className={"mt-1 block w-full " + (darkMode ? '!bg-[#0f1428] !text-gray-100' : '!bg-[#fbf4de] !text-gray-900')}
                        value={editFormData.fullName}
                        onChange={handleEditChange}
                        disabled={profileUpdateLoading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="username" className={"block mb-1 " + (darkMode ? 'text-yellow-200' : 'text-gray-800') + ' text-sm sm:text-base'}>Username</Label>
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        required
                        className={"mt-1 block w-full " + (darkMode ? '!bg-[#0f1428] !text-gray-100' : '!bg-[#fbf4de] !text-gray-900')}
                        value={editFormData.username}
                        onChange={handleEditChange}
                        disabled={profileUpdateLoading}
                      />
                      <p className={"text-xs mt-1 " + (darkMode ? 'text-yellow-300/80' : 'text-yellow-700')}>Username can be changed if not already taken by another user.</p>
                    </div>
                    <div>
                      <Label htmlFor="email" className={"block mb-1 " + (darkMode ? 'text-yellow-200' : 'text-gray-800') + ' text-sm sm:text-base'}>Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className={"mt-1 block w-full " + (darkMode ? '!bg-[#0f1428] !text-gray-100' : '!bg-[#fbf4de] !text-gray-900')}
                        value={editFormData.email}
                        onChange={handleEditChange}
                        disabled={profileUpdateLoading}
                      />
                      {profile?.createdByAdmin && !profile?.emailVerified && profile?.emailVerificationRequired && (
                        <div className="mt-2 text-sm text-yellow-600">
                          Email verification required for admin-created account.
                          <button 
                            onClick={handleResendVerification}
                            className="ml-2 text-blue-600 hover:text-blue-800 underline"
                            disabled={resendLoading}
                          >
                            {resendLoading ? 'Sending...' : 'Resend verification email'}
                          </button>
                        </div>
                      )}
                      {pendingEmailVerification && (
                        <div className={"mt-2 text-sm " + (darkMode ? 'text-yellow-300' : 'text-yellow-700')}>
                          A verification email has been sent to your new email address. Please check your inbox and verify to complete the update.
                        </div>
                      )}
                      {!pendingEmailVerification && !profile?.createdByAdmin && (
                        <p className={"text-xs mt-1 " + (darkMode ? 'text-yellow-300/80' : 'text-yellow-700')}>
                          Changing your email will require verification of the new address.
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="role" className={"block mb-1 " + (darkMode ? 'text-yellow-200' : 'text-gray-800') + ' text-sm sm:text-base'}>Account Role</Label>
                      <Input
                        id="role"
                        name="role"
                        type="text"
                        readOnly
                        className="mt-1 block w-full !bg-[#D9D9D9] !text-[#464545] !border-none !rounded-none   cursor-not-allowed"
                        value={formatRoleDisplay(profile?.roles)}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row justify-start gap-3 pt-4">
                      <Button 
                        type="submit" 
                        disabled={profileUpdateLoading} 
                        variant="default" 
                        size="sm" 
                        rounded="full"
                        className="w-full sm:w-1/2 lg:w-1/4"
                      >
                        {profileUpdateLoading ? 'Saving Booty...' : 'Save Changes'}
                      </Button> 
                      <Button 
                        type="button" 
                        variant="cancel" 
                        size="sm" 
                        rounded="full"
                        onClick={() => navigate(-1)} 
                        disabled={profileUpdateLoading} 
                        className="w-full sm:w-1/2 lg:w-1/4"
                      >
                        Cancel
                      </Button>
                    </div>

                  {/* < div className=''>  
                    <div className="border-t border-gray-200 pt-6 mt-8 ">
                        <h3 className="text-md font-semibold text-red-600">Delete Account</h3>
                        <p className="text-sm text-gray-600 mt-1 mb-3">
                          Permanently remove your account and all associated data. This action cannot be undone.
                        </p>
                        <Button
                          type="button"
                          variant="destructive"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={handleDeleteAccount}
                        disabled={profileUpdateLoading}
                      >
                        Delete Account
                      </Button>
                    </div>
                    </div> */}
                  
                  </form>
                </div>
              </TabsContent>

              <TabsContent value="password" className="px-4 sm:px-6 pb-6 sm:pb-8">
                <div className="">
                 
                  {passwordError && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm sm:text-base" role="alert">
                      {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-sm sm:text-base" role="alert">
                      {passwordSuccess}
                    </div>
                  )}
                  <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword" className={"block mb-1 " + (darkMode ? 'text-yellow-200' : 'text-gray-800') + ' text-sm sm:text-base'}>Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          required
                         className={"mt-1 block w-full " + (darkMode ? '!bg-[#0f1428] !text-gray-100' : '!bg-[#fbf4de] !text-gray-900')}
                          value={passwordFormData.currentPassword}
                          onChange={handlePasswordChange}
                          disabled={passwordLoading}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-3 flex items-center text-gray-500 z-10 bg-transparent"
                          onClick={() => setShowCurrentPassword((prev) => !prev)}
                          tabIndex={-1}
                          aria-label="Toggle current password visibility"
                          style={{ background: 'none', border: 'none', padding: 0 }}
                        >
                          {showCurrentPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="newPassword" className={"block mb-1 " + (darkMode ? 'text-yellow-200' : 'text-gray-800') + ' text-sm sm:text-base'}>New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          required
                        className={"mt-1 block w-full " + (darkMode ? '!bg-[#0f1428] !text-gray-100' : '!bg-[#fbf4de] !text-gray-900')}
                          value={passwordFormData.newPassword}
                          onChange={handlePasswordChange}
                          disabled={passwordLoading}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-3 flex items-center text-gray-500 z-10 bg-transparent"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          tabIndex={-1}
                          aria-label="Toggle new password visibility"
                          style={{ background: 'none', border: 'none', padding: 0 }}
                        >
                          {showNewPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                        </button>
                      </div>
                      <p className={"text-xs mt-1 " + (darkMode ? 'text-yellow-300/80' : 'text-yellow-700')}>Must be at least 6 characters long.</p>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className={"block mb-1 " + (darkMode ? 'text-yellow-200' : 'text-gray-800') + ' text-sm sm:text-base'}>Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                         className={"mt-1 block w-full " + (darkMode ? '!bg-[#0f1428] !text-gray-100' : '!bg-[#fbf4de] !text-gray-900')}
                          value={passwordFormData.confirmPassword}
                          onChange={handlePasswordChange}
                          disabled={passwordLoading}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-3 flex items-center text-gray-500 z-10 bg-transparent"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          tabIndex={-1}
                          aria-label="Toggle confirm password visibility"
                          style={{ background: 'none', border: 'none', padding: 0 }}
                        >
                          {showConfirmPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-start gap-3 pt-4">
                    
                      <Button type="submit" disabled={passwordLoading} variant="default" size="sm" className="w-full sm:w-1/2 lg:w-1/4" rounded="full">
                        {passwordLoading ? 'Saving Booty...' : 'Save Changes'}
                      </Button>
                      <Button type="button"  variant="cancel" size="sm" className="w-full sm:w-1/2 lg:w-1/4" rounded="full" onClick={() => setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })} disabled={passwordLoading}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 