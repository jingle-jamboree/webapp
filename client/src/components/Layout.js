import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidenav from './Sidenav';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const [isSidenavOpen, setIsSidenavOpen] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <div className="page-wrapper">
            <motion.div
                className="gradient-background"
                animate={{
                    opacity: [0, 1],
                    scale: [1.1, 1],
                }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            />
            <div className="noise-background" />

            {/* Animated glow effects */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="fixed top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-[128px]"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-[128px]"
            />

            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsSidenavOpen(true)}
                className="fixed top-4 left-4 w-10 h-10 flex items-center justify-center text-xl 
                    bg-gray-800/50 backdrop-blur-sm rounded-lg
                    border border-white/10 hover:bg-gray-700/50 transition-colors lg:hidden z-50"
            >☰</button>

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
