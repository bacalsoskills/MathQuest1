import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from "../ui/button"
import { CgProfile } from "react-icons/cg";
import { BiGroup } from "react-icons/bi";
import { MdOutlineGames } from "react-icons/md";
import { PiRanking } from "react-icons/pi";
import { GiProgression } from "react-icons/gi";
import { RiLogoutCircleRLine } from "react-icons/ri";
import { IoMdNotificationsOutline } from "react-icons/io";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import UserService from '../services/userService';
import { LiaSchoolSolid } from "react-icons/lia";
import ClassroomService from '../services/classroomService';
import { LuNotebookPen } from "react-icons/lu";

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

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [profileImageSrc, setProfileImageSrc] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  
  const { currentUser, logout, isAdmin, isTeacher, isStudent } = useAuth();

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
      console.error("Error fetching profile image directly:", err);
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
      console.error("Error fetching classrooms:", err);
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

  // If user is not logged in, show basic navbar
  if (!currentUser) {
    return (
      <nav className="bg-white shadow-lg">
        <div className="max-w-[1280px] container mx-auto px-4">
          <div className="flex justify-between items-center h-28 ">
            <div className="flex space-x-4">
              <Link
                to="/"
                className="flex items-center px-3 py-2 rounded-md transition-colors"
              >
                <img
                  src="images/mathquest-logo.png"
                  alt="MathQuest Logo"
                  className="h-[180px] w-[180px] py-2"
                />
              </Link>
            </div>
            <div className="flex space-x-4">
              <Button asChild variant="default" size="sm">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link to="/register">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
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
    }
  ];

  const adminLinks = [
    { path: '/admin/profile', icon: <CgProfile className="mr-3 text-xl" />, name: 'Profile' },
    { path: '/admin/reports', icon: <BiGroup className="mr-3 text-xl" />, name: 'Profile Management',
      subLinks: [
        { path: '/admin/teachers', name: 'Teachers' },
        { path: '/admin/students', name: 'Students' },
      ]
    },
    { path: '/admin/classrooms', icon: <LiaSchoolSolid className="mr-3 text-xl" />, name: 'Classrooms' },
    { path: '/admin/controls', icon: <MdOutlineAdminPanelSettings className="mr-3 text-xl" />, name: 'Controls' },
  ];

  let linksToShow = [];
  if (isAdmin()) {
    linksToShow = adminLinks;
  } else if (isTeacher()) {
    linksToShow = teacherLinks;
  } else if (isStudent()) {
    linksToShow = studentLinks;
  }

  return (
    <nav>
      <div className="bg-white text-black w-64 fixed h-full z-30 shadow-lg flex flex-col justify-between">
        <div>
          <div className="p-4 flex flex-col items-center border-b border-gray-200 mb-4">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-semibold mb-2 overflow-hidden">
              {profileImageSrc ? (
                <img 
                  src={profileImageSrc} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              ) : (
                <span>{getInitials(currentUser.firstName, currentUser.lastName)}</span>
              )}
            </div>
            <h2 className="text-md font-semibold text-center">{`${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.username}</h2>
            <p className="text-sm text-gray-500 text-center">{currentUser.email}</p>
          </div>

          <nav className="mt-4 flex-grow">
            {linksToShow.map((link) => (
              <div key={link.path + link.name}>
                <Link
                  to={link.path}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors duration-150 group ${
                    isActive(link.path)
                      ? 'bg-primary hover:text-white text-white' 
                      : 'text-black hover:bg-primary hover:text-white' 
                  }`}
                >
                  <span className={`inline-block ${isActive(link.path) ? 'text-white' : 'text-primary'} group-hover:text-white`}> 
                    {link.icon}
                  </span>
                  <span>{link.name}</span>
                </Link>
                {link.subLinks && (
                  <div className="ml-6">
                    {link.subLinks.map((subLink) => (
                      <Link
                        key={subLink.path + subLink.name}
                        to={subLink.path}
                        className={`block px-6 py-2 text-sm font-medium transition-colors duration-150 ${
                          location.pathname === subLink.path || location.pathname.startsWith(subLink.path + '/')
                            ? 'text-primary font-semibold' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-black' 
                        }`}
                      >
                         <span className={`inline-block ${isActive(subLink.path) ? 'text-primary font-semibold' : 'text-gray-700 hover:bg-gray-100 hover:text-black'} group-hover:text-white `}> 
                        {subLink.icon}
                      </span>
                        {subLink.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={handleLogout}
              className="flex items-center px-6 py-3 text-sm font-medium w-full text-left text-black hover:bg-primary hover:text-white group transition-colors duration-150"
            >
              <span className="text-primary group-hover:text-white">
                <RiLogoutCircleRLine className="mr-3 text-xl" />
              </span>
              <span>Logout</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200 text-center text-xs text-gray-500">
          © 2025 MathQuest
        </div>
      </div>

      <div className="flex-1 flex flex-col ml-64">
        <div className="bg-white shadow-md p-4 flex justify-between items-center w-full z-20">
          <div className="text-gray-600"> 
            Welcome {currentUser?.firstName || currentUser?.username || currentUser?.email}!
          </div>

          <div className="flex items-center space-x-4">
            {isStudent() && (
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center gap-2 h-10"
                onClick={() => navigate('/student/join-classroom')}
              >
                <AiOutlinePlusCircle className="w-5 h-5" />
                Join Classroom
              </Button>
            )}

            {isTeacher() && (
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center gap-2 h-10"
                onClick={() => navigate('/teacher/add-classroom')}
              >
                <AiOutlinePlusCircle className="w-5 h-5" />
                Create Classroom
              </Button>
            )}

            {/* <div className="h-10 w-10 flex items-center justify-center ">
              <IoMdNotificationsOutline className="h-5 w-5 text-black" />
            </div> */}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 