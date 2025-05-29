import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserService from '../services/userService';
import { Button } from "../ui/button"
import { Header } from "../ui/heading"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import AuthService from '../services/authService';
import { FaRegEyeSlash, FaRegEye } from "react-icons/fa";

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
        console.log("Fetched profile image directly");
        setProfileImageSrc(imageUrl);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error fetching profile image directly:", err);
      return false;
    }
  };

  // Function to process the profile data and set up the image
  const processProfileData = (userData) => {
    console.log("Processing profile data:", userData);
    
    // Create image source from profile data if available
    if (userData.profileImage) {
      const imageSrc = createImageSource(userData.profileImage, userData.profileImageName);
      console.log("Created image source from profile data");
      setProfileImageSrc(imageSrc);
    } else {
      console.log("No profile image data available");
      setProfileImageSrc('');
    }
    
    // Set profile data
    setProfile(userData);
    
    // Set form data
    setEditFormData({
      fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
      username: userData.username || '',
      email: userData.email || '',
    });
    
    // Check for pending email verification
    setPendingEmailVerification(!!userData.pendingEmail);
    
    // Reset image loaded state
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
        console.log("Profile data fetched:", userData);
        
        // Process the profile data
        processProfileData(userData);
        
        setLoading(false);
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err.message || 'Failed to load profile data');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser, navigate]);

  const handleImageLoad = () => {
    console.log("Profile image loaded successfully");
    setImageLoaded(true);
  };

  const handleImageError = () => {
    console.error("Error loading profile image");
    setImageLoaded(false);
    // Try to fetch the image directly as a fallback
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
    setLoading(true);

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

      await UserService.updateUserProfile(updateData);
      
      // Check if email was changed
      if (profile.email !== editFormData.email) {
        setPendingEmailVerification(true);
        setSuccess('A verification email has been sent to your new email address. Please check your inbox and verify to complete the update.');
      } else {
        setSuccess('Profile updated successfully');
      }
      
      const updatedUserData = await UserService.getUserProfile();
      console.log("Updated profile data:", updatedUserData);
      
      // Process the updated profile data
      processProfileData(updatedUserData);
      
      await refreshCurrentUser();
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
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
    setLoading(true);

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
      setLoading(false);
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

  
  if (loading && !profile) {
    return (
      <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold text-red-600">{error || "Could not load profile."}</div>
      </div>
    );
  }

  return (
    <div className="bg-[#E7EFFC] min-h-screen px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      <div className="max-w-5xl mx-auto">
      <Header type="h1" fontSize="3xl" weight="bold" className="mb-6"> {pageTitle} </Header>
        <hr className="border-t border-[1px] border-dark mb-8"></hr>

        <div className="flex flex-col md:flex-row gap-8">
   
          <div className="w-full md:w-1/3 flex flex-col items-center space-y-4 mt-20 px-10">
            <Avatar className="h-52 w-52 shadow-sm rounded-md overflow-hidden">
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
                <AvatarFallback className="text-4xl bg-blue-500 text-white">
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
              variant="secondary" 
              size="sm"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Uploading...' : profile?.profileImage ? 'Change Photo' : 'Upload a Photo'}
            </Button>
          </div>

       
          <div className="w-full md:w-2/3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6 border-b border-gray-200">
                <TabsTrigger value="edit" className={`py-2 !rounded-none !px-0 text-lg !text-left !bg-transparent ${activeTab === 'edit' ? 'text-primary font-bold border-b-2 border-primary' : 'text-black border-b-2 border-black'}`}>
                  Edit Info
                </TabsTrigger>
                <TabsTrigger value="password" className={`!px-2 rounded-none py-2 text-lg !bg-transparent ${activeTab === 'password' ? 'text-primary font-bold border-b-2 border-primary ' : 'text-black border-b-2 border-black'}`}>
                  Change Password
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="edit">
                <div>
                  {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
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
                      <Label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        className="mt-1 block w-full "
                        value={editFormData.fullName}
                        onChange={handleEditChange}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        required
                        className="mt-1 block w-full "
                        value={editFormData.username}
                        onChange={handleEditChange}
                        disabled={loading}
                      />
                      <p className="text-xs text-gray-500 mt-1">Username can be changed if not already taken by another user.</p>
                    </div>
                    <div>
                      <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="mt-1 block w-full"
                        value={editFormData.email}
                        onChange={handleEditChange}
                        disabled={loading || pendingEmailVerification}
                      />
                      {!pendingEmailVerification && (
                        <p className="text-xs text-gray-500 mt-1">
                          Changing your email will require verification of the new address.
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Account Role</Label>
                      <Input
                        id="role"
                        name="role"
                        type="text"
                        readOnly
                        className="mt-1 block w-full !bg-[#D9D9D9] !text-[#464545] !border-none !rounded-none   cursor-not-allowed"
                        value={formatRoleDisplay(profile?.roles)}
                      />
                    </div>

                    <div className="flex justify-start space-x-3 pt-4">
                      <Button type="submit" disabled={loading || pendingEmailVerification} variant="default" size="sm" className="w-1/4">
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button> 
                      <Button type="button" variant="cancel" size="sm" onClick={() => navigate(-1)} disabled={loading} className="w-1/4">
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
                        disabled={loading}
                      >
                        Delete Account
                      </Button>
                    </div>
                    </div> */}
                  
                  </form>
                </div>
              </TabsContent>

              <TabsContent value="password">
                <div className="">
                 
                  {passwordError && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                      {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                      {passwordSuccess}
                    </div>
                  )}
                  <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          required
                          className="!rounded-none !bg-transparent border-[#464545] border pr-12"
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
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          className="!rounded-none !bg-transparent border-[#464545] border pr-12"
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
                      <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long.</p>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          className="!rounded-none !bg-transparent border-[#464545] border pr-12"
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
                    <div className="flex justify-start space-x-3 pt-4">
                    
                      <Button type="submit" disabled={passwordLoading} variant="default" size="sm" className="w-1/4">
                        {passwordLoading ? 'Saving...' : 'Save Changes'}
                      </Button>  
                      <Button type="button"  variant="cancel" size="sm" className="w-1/4" onClick={() => setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })} disabled={passwordLoading}>
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