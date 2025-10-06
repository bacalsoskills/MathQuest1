import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';

const MainLayout = () => {
  const { currentUser, isAdmin } = useAuth();
  const { sidebarOpen } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));



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

  // Calculate extra padding for the main content
  const getMainPadding = () => {
    if (isMobile) return 'pt-16'; // Reduced from pt-36 since no announcement banner
    return 'pt-4'; // Minimal padding for desktop since sidebar is fixed
  };

  return (
    <>
      <main 
        className={`${sidebarMargin} ${contentClass} min-h-screen transition-all duration-300 ${getMainPadding()}`}
        style={{
          position: 'relative',
          top: 0,
          left: 0,
          ...(isDark
            ? {
                backgroundImage: "url('/images/background-img.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
                backgroundRepeat: "no-repeat",
              }
            : {
                backgroundColor: "#f3f4f6", 
              })
        }}
      >
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </>
  );
};

export default MainLayout; 