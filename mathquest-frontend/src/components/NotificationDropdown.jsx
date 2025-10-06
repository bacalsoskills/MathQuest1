import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import SystemSettingsService from '../services/systemSettingsService';
import { IoMdNotificationsOutline, IoMdClose } from 'react-icons/io';
import { FaBullhorn } from 'react-icons/fa';
import { BiTime } from 'react-icons/bi';
import { MdVisibility } from 'react-icons/md';

const NotificationDropdown = ({ showText = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  
  const { currentUser, isAdmin, isTeacher, isStudent } = useAuth();
  const { darkMode } = useTheme();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Load announcements when dropdown opens
  useEffect(() => {
    if (isOpen && currentUser && !isAdmin()) {
      loadAnnouncements();
    }
  }, [isOpen, currentUser, isAdmin]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      let userRole = 'ROLE_STUDENT';
      if (isTeacher && typeof isTeacher === 'function' && isTeacher()) {
        userRole = 'ROLE_TEACHER';
      } else if (isStudent && typeof isStudent === 'function' && isStudent()) {
        userRole = 'ROLE_STUDENT';
      }
      
      console.log('🔔 Loading announcements for role:', userRole);
      
      // Try to fetch announcements for the user's role and everyone
      let roleAnnouncements = [];
      let everyoneAnnouncements = [];
      
      try {
        [roleAnnouncements, everyoneAnnouncements] = await Promise.all([
          SystemSettingsService.getActiveAnnouncements(userRole).catch((error) => {
            console.error('Failed to fetch role announcements:', error);
            return [];
          }),
          SystemSettingsService.getActiveAnnouncements('EVERYONE').catch((error) => {
            console.error('Failed to fetch everyone announcements:', error);
            return [];
          })
        ]);
      } catch (error) {
        console.error('Failed to fetch role-specific announcements, trying fallback:', error);
        
        // Fallback: try to get all active announcements
        try {
          const allAnnouncements = await SystemSettingsService.getAllActiveAnnouncements();
          console.log('📢 Fallback - All announcements:', allAnnouncements);
          
          // Filter announcements based on visibility
          const filteredAnnouncements = allAnnouncements.filter(announcement => {
            if (announcement.visibility === 'EVERYONE') return true;
            if (userRole === 'ROLE_TEACHER' && announcement.visibility === 'TEACHERS') return true;
            if (userRole === 'ROLE_STUDENT' && announcement.visibility === 'STUDENTS') return true;
            return false;
          });
          
          setAnnouncements(filteredAnnouncements);
          return;
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          setAnnouncements([]);
          return;
        }
      }
      
      console.log('📢 Role announcements:', roleAnnouncements);
      console.log('📢 Everyone announcements:', everyoneAnnouncements);
      
      // Combine and deduplicate announcements
      const allAnnouncements = [...roleAnnouncements, ...everyoneAnnouncements];
      const uniqueAnnouncements = allAnnouncements.filter((announcement, index, self) => 
        index === self.findIndex(a => a.id === announcement.id)
      );
      
      console.log('📢 Final unique announcements:', uniqueAnnouncements);
      
      setAnnouncements(uniqueAnnouncements);
    } catch (error) {
      console.error('Failed to load announcements:', error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getVisibilityIcon = (visibility) => {
    switch (visibility) {
      case 'EVERYONE':
        return '👥';
      case 'TEACHERS':
        return '👨‍🏫';
      case 'STUDENTS':
        return '🎓';
      default:
        return '👥';
    }
  };

  const getVisibilityText = (visibility) => {
    switch (visibility) {
      case 'EVERYONE':
        return 'Everyone';
      case 'TEACHERS':
        return 'Teachers Only';
      case 'STUDENTS':
        return 'Students Only';
      default:
        return 'Everyone';
    }
  };

  // Don't show notification bell for admins
  if (isAdmin()) {
    return null;
  }

  return (
    <>
      {/* Backdrop overlay when dropdown is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[90]"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className="relative" ref={dropdownRef}>
        {/* Notification Bell with Label */}
        <button
        onClick={() => {
          console.log('Notification button clicked, current state:', isOpen);
          setIsOpen(!isOpen);
        }}
        className={`w-full relative transition-colors duration-150 flex items-center ${
          showText ? 'gap-2' : 'justify-center'
        } ${
          isOpen 
            ? (darkMode ? 'text-yellow-300' : 'text-yellow-600')
            : (darkMode 
                ? 'text-yellow-200 hover:text-yellow-100' 
                : 'text-yellow-800 hover:text-yellow-700')
        }`}
        aria-label="Notifications"
        title="Announcements"
      >
        <span className="inline-block flex items-center justify-center flex-shrink-0" style={{ 
          fontSize: 'clamp(1.25rem, 2.5vw, 1.875rem)',
          width: 'clamp(24px, 3vw, 32px)',
          height: 'clamp(24px, 3vw, 32px)',
          marginRight: showText ? 'clamp(8px, 1vw, 12px)' : '0'
        }}>
          <IoMdNotificationsOutline />
        </span>
        {showText && (
          <span className="truncate" style={{ fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)' }}>
            Notification
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className={`fixed sm:absolute left-0 sm:left-full top-full sm:top-0 right-0 sm:right-auto mt-2 sm:mt-0 sm:ml-2 mx-2 sm:mx-0 rounded-lg sm:rounded-xl shadow-2xl border overflow-hidden transform transition-all duration-200 ease-out ${
            darkMode 
              ? 'bg-[#0b1022] border-yellow-700/40' 
              : 'bg-white border-gray-200'
          }`}
          style={{
            width: 'calc(100vw - 1rem)',
            maxWidth: 'min(95vw, 420px)',
            maxHeight: 'min(80vh, 500px)',
            zIndex: 100
          }}
        >
          {/* Header */}
          <div className={`px-3 sm:px-4 py-2 sm:py-3 border-b flex-shrink-0 ${
            darkMode 
              ? 'bg-[#0f1428] border-yellow-700/40' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FaBullhorn 
                  className={`flex-shrink-0 ${darkMode ? 'text-yellow-200' : 'text-yellow-600'}`} 
                  style={{ fontSize: 'clamp(0.875rem, 1.2vw, 1rem)' }}
                />
                <h3 
                  className={`font-semibold truncate ${darkMode ? 'text-yellow-200' : 'text-gray-900'}`}
                  style={{ fontSize: 'clamp(0.875rem, 1.2vw, 1rem)' }}
                >
                  Announcements
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-[#0b1022] transition-colors flex-shrink-0 ${
                  darkMode ? 'text-yellow-300' : 'text-gray-500'
                }`}
                style={{ fontSize: 'clamp(1rem, 1.4vw, 1.25rem)' }}
              >
                <IoMdClose />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(min(80vh, 500px) - 60px)' }}>
            {loading ? (
              <div className="px-3 sm:px-4 py-4 sm:py-6 text-center">
                <div className={`inline-block animate-spin rounded-full border-b-2 ${
                  darkMode ? 'border-yellow-200' : 'border-yellow-600'
                }`} style={{ 
                  width: 'clamp(20px, 3vw, 24px)', 
                  height: 'clamp(20px, 3vw, 24px)' 
                }}></div>
                <p 
                  className={`mt-2 ${darkMode ? 'text-yellow-300' : 'text-gray-500'}`}
                  style={{ fontSize: 'clamp(0.75rem, 1.1vw, 0.875rem)' }}
                >
                  Loading announcements...
                </p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="px-3 sm:px-4 py-4 sm:py-6 text-center">
                <FaBullhorn 
                  className={`mx-auto mb-2 ${darkMode ? 'text-yellow-400' : 'text-gray-400'}`} 
                  style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}
                />
                <p 
                  className={`${darkMode ? 'text-yellow-300' : 'text-gray-500'}`}
                  style={{ fontSize: 'clamp(0.75rem, 1.1vw, 0.875rem)' }}
                >
                  No announcements available
                </p>
                <p 
                  className={`mt-2 ${darkMode ? 'text-yellow-400' : 'text-gray-400'}`}
                  style={{ fontSize: 'clamp(0.625rem, 1vw, 0.75rem)' }}
                >
                  Check back later for updates
                </p>
              </div>
            ) : (
              <div className="py-1 sm:py-2">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`px-3 sm:px-4 py-2 sm:py-3 border-b hover:bg-gray-50 dark:hover:bg-[#0f1428] transition-colors ${
                      darkMode 
                        ? 'text-yellow-200 border-yellow-700/20' 
                        : 'text-gray-800 border-gray-100'
                    }`}
                  >
                    {/* Announcement content */}
                    <div 
                      className="mb-2 leading-relaxed break-words"
                      style={{ fontSize: 'clamp(0.75rem, 1.1vw, 0.875rem)' }}
                      dangerouslySetInnerHTML={{ __html: announcement.message }}
                    />
                    
                    {/* Announcement metadata */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-gray-500 dark:text-yellow-400">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-1">
                          <BiTime 
                            className="flex-shrink-0" 
                            style={{ fontSize: 'clamp(0.75rem, 1vw, 0.875rem)' }}
                          />
                          <span 
                            className="break-words"
                            style={{ fontSize: 'clamp(0.625rem, 0.9vw, 0.75rem)' }}
                          >
                            Until {formatDate(announcement.endDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MdVisibility 
                            className="flex-shrink-0" 
                            style={{ fontSize: 'clamp(0.75rem, 1vw, 0.875rem)' }}
                          />
                          <span 
                            className="break-words"
                            style={{ fontSize: 'clamp(0.625rem, 0.9vw, 0.75rem)' }}
                          >
                            {getVisibilityIcon(announcement.visibility)} {getVisibilityText(announcement.visibility)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default NotificationDropdown;
