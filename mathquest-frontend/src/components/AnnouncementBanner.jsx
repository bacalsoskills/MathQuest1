import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SystemSettingsService from '../services/systemSettingsService';
import { IoMdClose } from "react-icons/io";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";
import { FaBullhorn } from "react-icons/fa";

const AnnouncementBanner = ({ onVisibilityChange, onClose }) => {
  const { currentUser, isAdmin, isTeacher, isStudent } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip loading announcements for admin users
    if (isAdmin && isAdmin()) {
      setLoading(false);
      if (onVisibilityChange) {
        onVisibilityChange(false, 0);
      }
      return;
    }
   
    // Initialize with empty announcements
    setAnnouncements([]);
    
    // Try to load real announcements from API
    if (currentUser) {
      loadAnnouncements();
    } else {
      setLoading(false);
      if (onVisibilityChange) {
        onVisibilityChange(false, 0);
      }
    }
  }, [currentUser, isAdmin]);

  const loadAnnouncements = async () => {
    // Skip loading announcements for admin users
    if (isAdmin && isAdmin()) {
      return;
    }
    
    try {
      let userRole = 'STUDENTS';
      if (isTeacher && typeof isTeacher === 'function' && isTeacher()) {
        userRole = 'TEACHERS';
      } else if (isStudent && typeof isStudent === 'function' && isStudent()) {
        userRole = 'STUDENTS';
      }
      
      // Fetch announcements from API
      const activeAnnouncements = await SystemSettingsService.getActiveAnnouncements(userRole);
      
      if (activeAnnouncements && activeAnnouncements.length > 0) {
        setAnnouncements(activeAnnouncements);
        if (onVisibilityChange) {
          onVisibilityChange(true, activeAnnouncements.length);
        }
      } else {
        // No announcements found
        if (onVisibilityChange) {
          onVisibilityChange(false, 0);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load announcements:', error);
      setLoading(false);
      if (onVisibilityChange) {
        onVisibilityChange(false, 0);
      }
    }
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      (prevIndex + 1) % announcements.length
    );
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => 
      (prevIndex - 1 + announcements.length) % announcements.length
    );
  };

  if (loading || !currentUser || announcements.length === 0 || (isAdmin && isAdmin())) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div className="bg-blue-600 text-white dark:bg-blue-800 rounded-lg shadow-md overflow-hidden">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center flex-grow">
          <FaBullhorn className="text-white mr-3 flex-shrink-0 text-lg" />
          
          <div className="flex items-center flex-grow">
            {announcements.length > 1 && (
              <button 
                onClick={handlePrevious}
                className="mr-2 p-1 hover:bg-blue-700 dark:hover:bg-blue-900 rounded-full"
                aria-label="Previous announcement"
              >
                <IoChevronBackOutline />
              </button>
            )}
            
            <div 
              className="text-sm md:text-base font-medium flex-grow"
              dangerouslySetInnerHTML={{ __html: currentAnnouncement.message }}
            />
            
            {announcements.length > 1 && (
              <button 
                onClick={handleNext}
                className="ml-2 p-1 hover:bg-blue-700 dark:hover:bg-blue-900 rounded-full"
                aria-label="Next announcement"
              >
                <IoChevronForwardOutline />
              </button>
            )}
          </div>
        </div>
        
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 hover:bg-blue-700 dark:hover:bg-blue-900 rounded-full"
            aria-label="Close announcements"
            title="Hide announcements"
          >
            <IoMdClose className="text-lg" />
          </button>
        )}
      </div>
      
      {announcements.length > 1 && (
        <div className="flex justify-center pb-1 space-x-1">
          {announcements.map((_, idx) => (
            <span 
              key={idx} 
              className={`h-1 w-2 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementBanner; 