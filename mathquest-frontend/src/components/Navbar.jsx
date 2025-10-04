import React, { useState, useEffect, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { Button } from "../ui/button"
import { CgProfile } from "react-icons/cg";
import { BiGroup } from "react-icons/bi";
import { RiLogoutCircleRLine } from "react-icons/ri";
import { IoMdNotificationsOutline } from "react-icons/io";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import UserService from '../services/userService';
import { LiaSchoolSolid } from "react-icons/lia";
import ClassroomService from '../services/classroomService';
import { LuNotebookPen } from "react-icons/lu";
import { BsPersonFillCheck } from "react-icons/bs";
import { MdOutlineFeedback } from "react-icons/md";
import { FaMoon, FaSun, FaBars, FaQuestionCircle } from "react-icons/fa";
import { HiMenuAlt1 } from "react-icons/hi";
import { MdOutlineDashboard } from "react-icons/md";
import { useSidebar } from '../context/SidebarContext';
import { GrAnnounce } from "react-icons/gr";
import { MdOutlineGames } from "react-icons/md";

// Helper function to get initials
const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
};

// Helper function to create image source from base64 data
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

// Define a single icon size for all sidebar icons
const ICON_SIZE = "text-3xl";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [profileImageSrc, setProfileImageSrc] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  const { currentUser, logout, isAdmin, isTeacher, isStudent } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const { darkMode, setDarkMode, isInitialized } = useTheme();
  const { notifications, markAsRead } = useNotifications();
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Remove the local dark mode effect since it's now handled by ThemeContext

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

  // Function to fetch classrooms
  const fetchClassrooms = async () => {
    try {
      let classroomData;
      if (isTeacher()) {
        classroomData = await ClassroomService.getTeacherClassrooms();
      } else if (isStudent()) {
        classroomData = await ClassroomService.getStudentClassrooms();
      }
      setClassrooms(classroomData || []);
    } catch (err) {

      setClassrooms([]);
    }
  };

  useEffect(() => {
    if (currentUser) {
      if (currentUser.profileImage) {
        const imageSrc = createImageSource(currentUser.profileImage, currentUser.profileImageName);
        setProfileImageSrc(imageSrc);
      } else {
        fetchProfileImage();
      }
      
      // Fetch classrooms when component mounts
      fetchClassrooms();
    }
  }, [currentUser, isTeacher, isStudent]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageLoaded(false);
    fetchProfileImage();
  };

  const isActive = (path) => {
    // Check if the path is exactly matched or if it's a subpath
    if (location.pathname === path || location.pathname.startsWith(`${path}/`)) {
      return true;
    }
    // Check for active subLinks
    const link = linksToShow.find(link => link.path === path);
    if (link && link.subLinks) {
      return link.subLinks.some(subLink => location.pathname === subLink.path || location.pathname.startsWith(`${subLink.path}/`));
    }

    return false;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMobileLinkClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Helper function to get notification count for a link
  const getNotificationCount = (linkName, linkPath) => {
    // Map link names to notification types
    const notificationMap = {
      'Dashboard': 'dashboard',
      'Classrooms': 'classrooms',
      'Profile': 'profile',
      'Help': 'help'
    };

    // Check for specific paths that might have notifications
    if (linkPath.includes('/activities') || linkPath.includes('/games')) {
      return notifications.activities;
    }
    if (linkPath.includes('/leaderboard')) {
      return notifications.leaderboard;
    }

    const notificationType = notificationMap[linkName];
    return notificationType ? notifications[notificationType] : 0;
  };

  // Helper function to handle link click and mark notifications as read
  const handleLinkClick = (linkName, linkPath) => {
    handleMobileLinkClick();
    
    // Mark notifications as read when navigating to a section
    const notificationMap = {
      'Dashboard': 'dashboard',
      'Classrooms': 'classrooms',
      'Profile': 'profile',
      'Help': 'help'
    };

    if (linkPath.includes('/activities') || linkPath.includes('/games')) {
      markAsRead('activities');
    } else if (linkPath.includes('/leaderboard')) {
      markAsRead('leaderboard');
    } else {
      const notificationType = notificationMap[linkName];
      if (notificationType) {
        markAsRead(notificationType);
      }
    }
  };



  if (!currentUser) {
    return (
      <>
        {/* Mobile Sticky Navbar for non-authenticated users */}
        {isMobile && (
          <nav className={`fixed top-0 left-0 right-0 z-30 border-b md:hidden shadow-lg transition-colors duration-300 ${
            darkMode 
              ? 'bg-[#0b1022] border-yellow-700/40' 
              : 'bg-[#f5ecd2] border-yellow-300'
          }`}>
            <div className="flex items-center justify-between px-4 py-3">
              {/* Logo on the left */}
              <Link to="/" className="flex items-center">
                <img
                  src="/images/new-logo.png"
                  alt="MathQuest Logo"
                  className="h-10 w-10 object-contain"
                />
              </Link>
              
              {/* Login and Sign Up buttons on the right */}
              <div className="flex items-center space-x-2">
                <Button asChild variant="outlineWhite" size="sm" className="!rounded-md text-xs px-3 py-1">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild variant="default" size="sm" className="!rounded-md text-xs px-3 py-1">
                  <Link to="/register">Sign Up</Link>
                </Button>
              </div>
            </div>
          </nav>
        )}

        {/* Desktop navbar for non-authenticated users */}
        <nav className={`py-5 absolute w-full z-10 md:block hidden transition-colors duration-300 ${
          darkMode 
            ? 'bg-[#0b1022]/90 backdrop-blur-sm' 
            : 'bg-[#f5ecd2]/90 backdrop-blur-sm'
        }`}>
          <div className="max-w-[1280px] container mx-auto px-4">
            <div className="flex justify-between items-center h-28 ">
              <div className="flex space-x-4">
                <Link
                  to="/"
                  className="flex items-center px-3 py-2 rounded-md transition-colors"
                >
                  <img
                    src="images/new-logo.png"
                    alt="MathQuest Logo"
                    className="h-[70px] w-[70px] md:h-[135px] md:w-[135px] py-2"
                  />
                </Link>
              </div>
              <div className="flex space-x-4">
                <Button asChild variant="outlineWhite" className=" !rounded-md " size="sm">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild variant="default" size="sm">
                  <Link to="/register">Sign Up</Link>
                </Button>
              </div>
            </div>
          </div>
        </nav>
      </>
    );
  }

  const studentLinks = [
    { path: '/student/profile', icon: <CgProfile className="mr-3 text-xl" />, name: 'Profile' },
    { 
      path: '/student/classrooms', 
      icon: <BiGroup className="mr-3 text-xl" />, 
      name: 'Classrooms',
      subLinks: classrooms.map(classroom => ({
        icon: <LuNotebookPen className="mr-3 text-xl" />,
        path: `/student/classrooms/${classroom.id}`,
        name: classroom.name
      }))
    },
    {
      path: '/student/learning-multiplication',
      // icon: <span className="mr-3 text-xl font-bold">×</span>,
      icon: <MdOutlineGames className="mr-3 text-xl" />,
      name: 'Learning Multiplication',
    },
  ];

  const teacherLinks = [
    { path: '/teacher/profile', icon: <CgProfile className="mr-3 text-xl" />, name: 'Profile' },
    { 
      path: '/teacher/classrooms', 
      icon: <BiGroup className="mr-3 text-xl" />, 
      name: 'Classrooms',
      subLinks: classrooms.map(classroom => ({
        icon: <LuNotebookPen className="mr-3 text-xl" />,
        path: `/teacher/classrooms/${classroom.id}`,
        name: classroom.name
      }))
    },
  ];

  const adminLinks = [
    { path: '/admin/profile', icon: <CgProfile className="mr-3 text-xl" />, name: 'Profile' },
    { path: '/admin/users', icon: <BiGroup className="mr-3 text-xl" />, name: 'User Management',
      subLinks: [
        { path: '/admin/users/teachers', icon: <BsPersonFillCheck className="mr-3 text-xl" />, name: 'Teachers' },
        { path: '/admin/users/students', icon: <BsPersonFillCheck className="mr-3 text-xl" />, name: 'Students' },
      ]
    },
    { path: '/admin/classrooms', icon: <LiaSchoolSolid className="mr-3 text-xl" />, name: 'Classrooms' },
    { path: '/admin/feedback', icon: <MdOutlineFeedback className="mr-3 text-xl" />, name: 'Feedback Management' },
    { path: '/admin/announcements', icon: <GrAnnounce className="mr-3 text-xl" />, name: 'System Announcements' },
  ];

  // Use role-specific dashboard for all roles
  const dashboardLink = { 
    path: isAdmin() ? '/admin/dashboard' : isTeacher() ? '/teacher/dashboard' : '/student/dashboard', 
    icon: <MdOutlineDashboard className="mr-3 text-xl" />, 
    name: 'Dashboard' 
  };

  const addDashboard = (links) => {
    const profileIdx = links.findIndex(l => l.name === 'Profile');
    if (profileIdx !== -1) {
      return [
        ...links.slice(0, profileIdx),
        dashboardLink,
        ...links.slice(profileIdx)
      ];
    }
    return [dashboardLink, ...links];
  };

  let linksToShow = [];
  if (isAdmin()) {
    linksToShow = addDashboard(adminLinks);
  } else if (isTeacher()) {
    linksToShow = addDashboard(teacherLinks);
  } else if (isStudent()) {
    linksToShow = addDashboard(studentLinks);
  }

  // Mobile sidebar overlay
  const MobileOverlay = () => (
    <>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Mobile sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 ease-in-out ${
        isMobile 
          ? `w-80 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
          : `${sidebarOpen ? 'w-80' : 'w-28 px-2'}`
      } flex flex-col justify-between shadow-lg ${
        darkMode 
          ? 'bg-[#0b1022] text-yellow-200' 
          : 'bg-[#f5ecd2] text-yellow-800'
      }`}>
        {/* Top: Logo and App Name + Toggle */}
        <div>
          <div className={`flex items-center gap-3 mb-5 ${sidebarOpen ? 'px-6' : 'px-0'} pt-6 pb-2 ${sidebarOpen ? '' : 'justify-center'}`}>
            {sidebarOpen && (
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-yellow-500' : 'bg-yellow-600'
              }`}>
                <img src="/images/new-logo.png" alt="MathQuest Logo" className="w-16 h-16 object-contain" />
              </div>
            )}
            {sidebarOpen && <span className={`font-semibold text-lg tracking-wide ${
              darkMode ? 'text-yellow-200' : 'text-yellow-800'
            }`}>MathQuest</span>}
            <button
              className={`flex items-center justify-center ${sidebarOpen ? 'ml-auto' : ''} focus:outline-none h-12 w-12 rounded-lg transition-colors duration-150 ${!sidebarOpen ? 'mx-auto' : ''} ${
                darkMode ? 'text-yellow-200 hover:text-yellow-100' : 'text-yellow-800 hover:text-yellow-700'
              }`}
              style={{ minWidth: '48px', minHeight: '48px' }}
              onClick={handleSidebarToggle}
              aria-label="Toggle Sidebar"
            >
              <HiMenuAlt1 className={ICON_SIZE} />
            </button>
          </div>
          {/* Search Bar */}
          {/* {sidebarOpen && (
            <div className="px-6 pt-2 pb-4">
              <div className="flex items-center bg-[#101233] dark:bg-[#101233] rounded-lg px-3 py-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"/></svg>
                <input type="text" placeholder="Search" className="bg-transparent outline-none ml-2 text-sm w-full text-white placeholder-gray-400" />
              </div>
            </div>
          )} */}
          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-2">
            {linksToShow.map((link) => (
              <div key={link.path + link.name}>
                <Link
                  to={link.path}
                  onClick={() => handleLinkClick(link.name, link.path)}
                  className={`flex items-center ${sidebarOpen ? 'px-6 py-3' : 'justify-center py-3'} rounded-lg text-sm font-medium transition-colors duration-150 group relative ${
                    isActive(link.path)
                      ? (darkMode ? 'bg-yellow-500 text-[#0b1022]' : 'bg-yellow-600 text-white')
                      : (darkMode ? 'text-yellow-200 hover:bg-[#0f1428]' : 'text-yellow-800 hover:bg-[#fbf4de]')
                  }`}
                  style={{ minHeight: '48px', minWidth: sidebarOpen ? undefined : '48px' }}
                >
                  <span className={`inline-block ${ICON_SIZE} ${sidebarOpen ? 'mr-3' : ''} flex items-center justify-center w-8 h-8`}>{link.icon}</span>
                  {sidebarOpen && <span>{link.name}</span>}
                  {/* Dynamic notification dot */}
                  {getNotificationCount(link.name, link.path) > 0 && (
                    <span className={`absolute right-4 w-2 h-2 bg-red-500 rounded-full ${isActive(link.path) ? 'top-1/2 -translate-y-1/2' : ''}`}></span>
                  )}
                </Link>
                {/* Sublinks: active = text-white, no bg; hover = bg-white/50 */}
                {link.subLinks && sidebarOpen && (
                  <div className="ml-8 mt-1">
                    {link.subLinks.map((subLink) => (
                      <Link
                        key={subLink.path + subLink.name}
                        to={subLink.path}
                        onClick={() => handleLinkClick(subLink.name, subLink.path)}
                        className={`block px-6 py-2 text-sm font-medium rounded-lg transition-colors duration-150 relative ${
                          location.pathname === subLink.path || location.pathname.startsWith(subLink.path + '/')
                            ? (darkMode ? 'text-yellow-200' : 'text-yellow-800')
                            : (darkMode ? 'text-yellow-300 hover:bg-[#0f1428]' : 'text-yellow-700 hover:bg-[#fbf4de]')
                        }`}
                        style={{ minHeight: '40px' }}
                      >
                        <span className={`inline-block ${ICON_SIZE} mr-3 align-middle`}>{subLink.icon}</span>
                        {subLink.name}
                        {/* Notification dot for sublinks */}
                        {getNotificationCount(subLink.name, subLink.path) > 0 && (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {/* Join/Create Classroom as a nav link */}
            {(isStudent() || isTeacher()) && (
              <Link
                to={isStudent() ? '/student/join-classroom' : '/teacher/add-classroom'}
                onClick={() => handleLinkClick('Classrooms', isStudent() ? '/student/join-classroom' : '/teacher/add-classroom')}
                className={`flex items-center ${sidebarOpen ? 'px-4 py-3' : 'mr-4 justify-center py-3'} rounded-lg text-sm font-medium transition-colors duration-150 group relative ${
                  (isStudent() && isActive('/student/join-classroom')) || (isTeacher() && isActive('/teacher/add-classroom'))
                    ? (darkMode ? 'bg-yellow-500 text-[#0b1022]' : 'bg-yellow-600 text-white')
                    : (darkMode ? 'text-yellow-200 hover:bg-[#0f1428]' : 'text-yellow-800 hover:bg-[#fbf4de]')
                }`}
                style={{ minHeight: '48px', minWidth: sidebarOpen ? undefined : '48px' }}
              >
                <span className={`inline-block text-2xl ${sidebarOpen ? 'mr-3' : ''} flex items-center justify-center w-8 h-8`}>
                  <AiOutlinePlusCircle />
                </span>
                {sidebarOpen && (isStudent() ? 'Join Classroom' : 'Create Classroom')}
                {/* Notification dot for classroom actions */}
                {notifications.classrooms > 0 && (
                  <span className="absolute right-4 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </Link>
            )}
            {/* Help link at the end */}
            {!isAdmin() && (
              <Link
                to={isTeacher() ? '/teacher/help' : '/student/help'}
                onClick={() => handleLinkClick('Help', isTeacher() ? '/teacher/help' : '/student/help')}
                className={`flex items-center ${sidebarOpen ? 'px-4 py-3' : 'mr-4 justify-center py-3'} rounded-lg text-sm font-medium transition-colors duration-150 group relative ${
                  isActive(isTeacher() ? '/teacher/help' : '/student/help')
                    ? (darkMode ? 'bg-yellow-500 text-[#0b1022]' : 'bg-yellow-600 text-white')
                    : (darkMode ? 'text-yellow-200 hover:bg-[#0f1428]' : 'text-yellow-800 hover:bg-[#fbf4de]')
                }`}
                style={{ minHeight: '48px', minWidth: sidebarOpen ? undefined : '48px' }}
              >
                <span className={`inline-block text-2xl ${sidebarOpen ? 'mr-3' : ''} flex items-center justify-center w-8 h-8`}>
                  <FaQuestionCircle />
                </span>
                {sidebarOpen && <span>Help</span>}
                {/* Notification dot for help */}
                {notifications.help > 0 && (
                  <span className="absolute right-4 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </Link>
            )}
          </nav>
        </div>
        {/* Bottom: Dark/Light Toggle & User Profile & Logout */}
        <div className={`px-3 pb-6 pt-2 ${sidebarOpen ? '' : 'px-0'}`}>
          {/* Dark/Light Mode Toggle */}
          {isInitialized && (
            <div className={`flex items-center justify-center mb-4 rounded-lg p-1 ${sidebarOpen ? '' : 'justify-center'} ${
              darkMode ? 'bg-[#0f1428]' : 'bg-[#fbf4de]'
            }`}>
              <button
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors duration-150 flex items-center justify-center ${
                  darkMode 
                    ? 'bg-yellow-500 text-[#0b1022]' 
                    : 'text-yellow-700'
                }`}
                onClick={() => setDarkMode(true)}
              >
                <FaMoon className="mr-2" />
                {sidebarOpen && 'Dark'}
              </button>
              <button
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors duration-150 flex items-center justify-center ${
                  !darkMode 
                    ? 'bg-yellow-500 text-[#0b1022]' 
                    : 'text-yellow-700'
                }`}
                onClick={() => setDarkMode(false)}
              >
                <FaSun className="mr-2" />
                {sidebarOpen && 'Light'}
              </button>
            </div>
          )}
          {/* User Profile & Logout */}
          <div className={`flex items-center ${sidebarOpen ? 'gap-3 rounded-xl p-3' : 'justify-center'} relative ${
            darkMode ? 'bg-[#0f1428]' : 'bg-[#fbf4de]'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold overflow-hidden ${
              darkMode ? 'bg-yellow-500 text-[#0b1022]' : 'bg-yellow-600 text-white'
            }`}>
              {profileImageSrc ? (
                <img
                  src={profileImageSrc}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              ) : (
                <span>{getInitials(currentUser.firstName, currentUser.lastName)}</span>
              )}
            </div>
            {sidebarOpen && (
              <div className="flex flex-col flex-1">
                <span className={`font-semibold text-sm ${
                  darkMode ? 'text-yellow-200' : 'text-yellow-800'
                }`}>{`${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.username}</span>
                <span className={`text-xs ${
                  darkMode ? 'text-yellow-300' : 'text-yellow-700'
                }`}>{isAdmin() ? 'Admin' : isTeacher() ? 'Teacher' : 'Student'}</span>
              </div>
            )}
            <button
              className={`ml-2 transition-colors duration-150 ${
                darkMode ? 'text-yellow-200 hover:text-red-400' : 'text-yellow-800 hover:text-red-600'
              }`}
              onClick={handleLogout}
              title="Logout"
            >
              <RiLogoutCircleRLine className="text-2xl" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );

  return (
    <>
      {/* Mobile Sticky Navbar */}
      {isMobile && (
        <nav className={`fixed top-0 left-0 right-0 z-30 border-b md:hidden shadow-lg transition-colors duration-300 ${
          darkMode 
            ? 'bg-[#0b1022] border-yellow-700/40' 
            : 'bg-[#f5ecd2] border-yellow-300'
        }`}>
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo on the left */}
            <Link to="/" className="flex items-center">
              <img
                src="/images/new-logo.png"
                alt="MathQuest Logo"
                className="h-10 w-10 object-contain"
              />
            </Link>
            
            {/* Menu button on the right */}
            <button
              className={`p-3 rounded-lg transition-colors shadow-md ${
                darkMode 
                  ? 'text-yellow-200 hover:text-yellow-100' 
                  : 'text-yellow-800 hover:text-yellow-700'
              }`}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Menu"
            >
              <HiMenuAlt1 className="text-xl" />
            </button>
          </div>
        </nav>
      )}
      
      
      
      {/* Render sidebar with overlay */}
      <MobileOverlay />
    </>
  );
};

export default memo(Navbar); 