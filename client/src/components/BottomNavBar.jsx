// src/components/BottomNavBar.jsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// Example icons from lucide-react
import { Package, Cat, CreditCard, Search } from 'lucide-react';

const navItems = [
  {
    name: 'Deliver',
    to: '/deliver-order',
    icon: Package,
  },
  {
    name: 'Cats',
    to: '/cat-spotter',
    icon: Cat,
  },
  {
    name: 'Payments',
    to: '/pay-for-project',
    icon: CreditCard,
  },
  {
    name: 'Lost & Found',
    to: '/lost-found',
    icon: Search,
  },
];

export default function BottomNavBar() {
  const location = useLocation();

  return (
    <>
      {/* Bottom navbar (small screens only) */}
      <nav
        className="
          fixed bottom-0 left-0 right-0
          bg-white dark:bg-gray-900
          border-t border-gray-300 dark:border-gray-700
          z-50
          flex md:hidden
        "
      >
        <ul className="grid grid-cols-4 w-full">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <Link to={item.to}>
                <li key={item.to} className="flex justify-center">
                  <div
                    className={`
                    flex flex-col items-center justify-center py-2
                    text-sm font-semibold
                    ${isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-200'
                      }
                    hover:text-blue-500 dark:hover:text-blue-400
                  `}
                  >
                    <IconComponent size={20} />
                    <span>{item.name}</span>
                  </div>
                </li>
              </Link>
            );
          })}
        </ul>
      </nav>

      {/* Left-side navbar (larger screens) */}
      <nav
        className="
          hidden md:flex
          flex-col
          items-center
          gap-4
          fixed top-16 left-0 bottom-0
          w-24
          bg-white dark:bg-gray-900
          border-r border-gray-300 dark:border-gray-700
          border-t
          pt-4
          z-50
        "
      >
        <ul className="flex flex-col space-y-4 w-full">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`
                    flex flex-col items-center justify-center
                    font-semibold
                    ${isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-200'
                    }
                    hover:text-blue-500 dark:hover:text-blue-400
                  `}
                >
                  <IconComponent size={24} />
                  <span className="text-xs mt-1">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
