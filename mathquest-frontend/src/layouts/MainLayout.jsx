import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const { currentUser } = useAuth();
  
  // Only add margin when user is logged in
  const contentClass = currentUser 
    ? 'ml-64 w-[calc(100%-16rem)]' // 16rem = 64 in Tailwind (256px)
    : 'w-full';
  
  return (
    <main className={`${contentClass} transition-all duration-300`}>
      <div className="min-h-screen">
        <Outlet />
      </div>
    </main>
  );
};

export default MainLayout; 