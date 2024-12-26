import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import LostAndFound from './components/LostAndFound';
import PickMyParcel from './components/PickMyParcel';
import Layout from './components/Layout';
import ChatPage from './components/ChatPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<HomePage />} />
            <Route path="lost-and-found" element={<LostAndFound />} />
            <Route path='parcel' element={<PickMyParcel />} />
            <Route path="chat/:roomId" element={<ChatPage />} />
            {/* ...other routes... */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
