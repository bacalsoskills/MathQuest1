import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';

const MainLayout = () => {
  const { currentUser } = useAuth();
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
  
  // Only add margin when user is logged in and not on mobile
  let contentClass = 'w-full';
  if (currentUser && !isMobile) {
    if (sidebarOpen) {
      contentClass = 'ml-80 w-[calc(100%-20rem)]'; // 20rem = 320px
    } else {
      contentClass = 'ml-28 w-[calc(100%-7rem)]'; // 7rem = 112px
    }
  }

  return (
    <main 
      className={`${contentClass} min-h-screen transition-all duration-300 ${isMobile ? 'pt-36' : 'pt-16'}`}
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
  );
};

export default MainLayout; 