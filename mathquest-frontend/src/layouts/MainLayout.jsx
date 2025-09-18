import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import AnnouncementBanner from '../components/AnnouncementBanner';
import { FaBullhorn } from "react-icons/fa";

const MainLayout = () => {
  const { currentUser, isAdmin } = useAuth();
  const { sidebarOpen } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [hasAnnouncements, setHasAnnouncements] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(true);
  const [announcementCount, setAnnouncementCount] = useState(0);



  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Calculate sidebar margins and content width
  let contentClass = 'w-full';
  let sidebarMargin = '';
  if (currentUser && !isMobile) {
    if (sidebarOpen) {
      contentClass = 'w-[calc(100%-20rem)]'; // 20rem = 320px
      sidebarMargin = 'ml-80';
    } else {
      contentClass = 'w-[calc(100%-7rem)]'; // 7rem = 112px
      sidebarMargin = 'ml-28';
    }
  }

  // Handle announcement banner visibility and count
  const handleAnnouncementVisibility = (visible, count) => {
    setHasAnnouncements(visible);
    if (count !== undefined) {
      setAnnouncementCount(count);
    }
  };
  
  // Force announcement visibility for testing
  useEffect(() => {
    if (currentUser && (!isAdmin || !isAdmin())) {
      setHasAnnouncements(true);
      setAnnouncementCount(1);
    }
  }, [currentUser, isAdmin]);

  // Calculate extra padding for the main content if announcements are shown
  const getMainPadding = () => {
    if (isMobile) return 'pt-36';
    if (showAnnouncements && hasAnnouncements) return 'pt-24';
    return 'pt-16';
  };

  return (
    <>
      {/* Floating announcement button */}
      {currentUser && hasAnnouncements && !showAnnouncements && !isAdmin() && (
        <div className={`fixed   ${currentUser ? 'top-3 right-16' : 'top-2 right-2'} z-50`}>
          <button 
            onClick={() => setShowAnnouncements(true)}
            className="bg-blue-600 dark:bg-blue-800 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 dark:hover:bg-blue-900 transition-all"
            aria-label="Show announcements"
            title="Show announcements"
          >
            <FaBullhorn className="text-white text-md md:text-xl" />
            {announcementCount > 0 && (
              <span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center">
                {announcementCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Announcement Banner that adjusts with sidebar */}
      {currentUser && hasAnnouncements && showAnnouncements && !isAdmin() && (
        <div className={`fixed top-0 ${sidebarMargin} ${contentClass} z-40 transition-all duration-300`}>
          <div className="px-4 pt-2">
            <AnnouncementBanner 
              onVisibilityChange={handleAnnouncementVisibility} 
              onClose={() => setShowAnnouncements(false)}
            />
          </div>
        </div>
      )}

      <main 
        className={`${sidebarMargin} ${contentClass} min-h-screen transition-all duration-300 ${getMainPadding()}`}
        style={
          isDark
            ? {
                backgroundImage: "url('/images/background-img.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
                backgroundRepeat: "no-repeat",
              }
            : {
                backgroundColor: "#f3f4f6", 
              }
        }
      >
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </>
  );
};

export default MainLayout; 