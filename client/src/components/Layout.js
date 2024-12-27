import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidenav from './Sidenav';
import { useAuth } from '../context/AuthContext';
import { Bars3Icon } from '@heroicons/react/24/outline';

const Layout = () => {
    const [isSidenavOpen, setIsSidenavOpen] = useState(true);
    const { user, logout } = useAuth();

    const toggleSidenav = () => setIsSidenavOpen(!isSidenavOpen);

    return (
        <div className="min-h-screen relative">
            <div className="fixed inset-0 bg-gradient-to-b from-[#0B0F1A] via-[#131B2E] to-[#0B0F1A]" />

            {/* Updated Menu Button - always visible */}
            <div className="fixed top-0 left-0 right-0 h-16 z-40 
                bg-gradient-to-b from-black/20 to-transparent">
                <button
                    onClick={toggleSidenav}
                    className="absolute top-3 left-3 z-50 w-10 h-10
                        flex items-center justify-center
                        bg-gray-800/90 hover:bg-gray-700/90
                        backdrop-blur-sm rounded-xl
                        border border-white/10
                        transition-all duration-200
                        active:scale-95
                        shadow-lg shadow-black/10"
                >
                    <Bars3Icon className="w-5 h-5 text-gray-300" />
                </button>
            </div>

            <Sidenav
                isOpen={isSidenavOpen}
                onClose={() => setIsSidenavOpen(false)}
                user={user}
                onLogout={logout}
            />

            <main className={`relative z-10 transition-all duration-300
                ${isSidenavOpen ? 'lg:pl-64' : 'lg:pl-0'}`}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
