// src/components/RootLayout.jsx
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopNavBar from './TopNavBar';
import BottomNavBar from './BottomNavBar';

export default function RootLayout() {
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('lastRoute', location.pathname);
  }, [location.pathname]);

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <TopNavBar />

      <main
        className="
          md:pb-0 
          pr-0 md:pl-24   /* 24px width? Actually the nav is w-24, so let's match that */
        "
      >
        <Outlet />
      </main>

      <BottomNavBar />
    </div>
  );
}
