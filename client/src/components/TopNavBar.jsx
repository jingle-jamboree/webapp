// src/components/TopNavBar.jsx

import React from 'react';
import DarkModeToggle from './DarkModeToggle';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from './ui/dropdown-menu';

import { User } from 'lucide-react'

export default function TopNavBar() {
  const handleMyAccount = () => {
    // Example: Navigate to account details page, or open a modal
    alert('My Account clicked!');
  };

  const handleSignOut = () => {
    // Example sign-out logic
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/login';
  };

  if (!localStorage.getItem('userData')){ 
    handleSignOut();
  }
  const userData = JSON.parse(localStorage.getItem('userData'))

  return (
    <header
      className="
        sticky top-0 z-50
        flex items-center justify-between
        bg-white dark:bg-gray-900
        px-4 py-3 shadow
        border-b border-gray-300 dark:border-gray-700
      "
    >
      {/* Left side: App Name */}
      <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
        Hostel App
      </div>

      {/* Right side: Theme Toggle and Account Dropdown */}
      <div className="flex items-center space-x-4">
        <DarkModeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center justify-center p-2 transition-colors
                 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300
                 dark:hover:bg-gray-700 focus:outline-none">
              <div className='flex items-center justify-center'>
                <User />
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-44">
            <DropdownMenuLabel>{userData['user']}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleMyAccount}>
              My Account
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
