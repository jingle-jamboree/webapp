import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidenav from './Sidenav';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const [isSidenavOpen, setIsSidenavOpen] = useState(false);
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen relative">
            {/* Simple background */}
            <div className="fixed inset-0 bg-gradient-to-b from-[#0B0F1A] via-[#131B2E] to-[#0B0F1A]" />

            {/* Menu Button */}
            <button
                onClick={() => setIsSidenavOpen(true)}
                className="fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center
                    bg-gray-800/50 backdrop-blur-sm rounded-lg border border-white/10"
            >
                ☰
            </button>

            <Sidenav
                isOpen={isSidenavOpen}
                onClose={() => setIsSidenavOpen(false)}
                user={user}
                onLogout={logout}
            />

            <main className="relative z-10">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
