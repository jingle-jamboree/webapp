import { NavLink } from 'react-router-dom';

const navItems = [
    { name: "Home", icon: "🏠", path: "/" },
    { name: "Lost & Found", icon: "🔍", path: "/lost-and-found" },
    { name: "Pick My Parcel", icon: "📦", path: "/parcel" },
    { name: "Cat Spotter", icon: "🐈", path: "/cats" },
    { name: "Pay For Project", icon: "📝", path: "/pay" }
];

const Sidenav = ({ isOpen, onClose, user, onLogout }) => {
    return (
        <>
            {/* Backdrop for mobile */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden z-40
                    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Sidenav */}
            <nav className={`fixed left-0 top-0 bottom-0 w-64 bg-gray-900/95 backdrop-blur-md z-50
                border-r border-white/10 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:z-20 pt-6
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                <div className="p-4 flex flex-col h-full">
                    <h2 className="text-xl font-bold gradient-text mb-8 text-center">JIIT Tools</h2>

                    <div className="space-y-2 flex-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-4 py-3 rounded-lg
                                    transition-colors duration-200
                                    ${isActive
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : 'hover:bg-white/5 text-gray-300 hover:text-white'}`}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span>{item.name}</span>
                            </NavLink>
                        ))}
                    </div>

                    {/* User section */}
                    <div className="border-t border-white/10 pt-4 mt-4">
                        <div className="px-4 mb-2">
                            <div className="font-medium text-gray-200">{user?.name}</div>
                            <div className="text-sm text-gray-400">{user?.enrollmentNo}</div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Sidenav;
