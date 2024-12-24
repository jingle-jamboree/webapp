import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidenav from './Sidenav';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const [isSidenavOpen, setIsSidenavOpen] = useState(false);
    const { user, logout } = useAuth();

    return (
        <div className="page-wrapper">
            <div className="gradient-background" />
            <div className="noise-background" />

            {/* Glow Effects */}
            <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-[128px] opacity-10" />
            <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-[128px] opacity-10" />

            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsSidenavOpen(true)}
                className="fixed top-4 left-4 w-10 h-10 flex items-center justify-center text-xl 
                    bg-gray-800/50 backdrop-blur-sm rounded-lg
                    border border-white/10 hover:bg-gray-700/50 transition-colors lg:hidden z-50"
            >
                ☰
            </button>

            <Sidenav
                isOpen={isSidenavOpen}
                onClose={() => setIsSidenavOpen(false)}
                user={user}
                onLogout={logout}
            />

            <div className="content-container transition-[padding] duration-300 lg:pl-64">
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
