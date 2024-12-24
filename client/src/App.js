// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';
import RootLayout from './components/RootLayout';
import RedirectToLastPage from './components/RedirectToLastPage';

import Login from './pages/Login';
import DeliverOrder from './pages/DeliverOrder';
import CatSpotter from './pages/CatSpotter';
import PayForProject from './pages/PayForProject';
import LostFound from './pages/LostFound';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public: Login */}
        <Route path="/login" element={<Login />} />

        {/* Protected area */}
        <Route path="/" element={<RequireAuth />}>
          {/* If user is logged in and visits '/', redirect to last page */}
          <Route index element={<RedirectToLastPage />} />

          {/* Root layout with top and bottom navbars */}
          <Route element={<RootLayout />}>
            <Route path="deliver-order" element={<DeliverOrder />} />
            <Route path="cat-spotter" element={<CatSpotter />} />
            <Route path="pay-for-project" element={<PayForProject />} />
            <Route path="lost-found" element={<LostFound />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
