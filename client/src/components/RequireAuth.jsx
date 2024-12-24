import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function RequireAuth() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (!isLoggedIn) {
    // If the user is not logged in, redirect to /login
    return <Navigate to="/login" replace />;
  }

  // Otherwise, show the protected layout/routes
  return <Outlet />;
}
