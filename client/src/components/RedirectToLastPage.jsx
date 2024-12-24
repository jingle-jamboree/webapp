import React from 'react';
import { Navigate } from 'react-router-dom';

export default function RedirectToLastPage() {
  // Attempt to get the last route from localStorage
  const lastPage = localStorage.getItem('lastRoute') || '/cat-spotter';
  return <Navigate to={lastPage} replace />;
}
