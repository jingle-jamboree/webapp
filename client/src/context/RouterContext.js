import { createContext, useContext, useState, useEffect } from 'react';

const RouterContext = createContext();

export function RouterProvider({ children }) {
    const [currentPath, setCurrentPath] = useState(window.location.pathname);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        const handlePopState = () => {
            setCurrentPath(window.location.pathname);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const navigate = async (to) => {
        setIsTransitioning(true);
        // Wait for exit animations
        await new Promise(resolve => setTimeout(resolve, 300));

        window.history.pushState({}, '', to);
        setCurrentPath(to);

        // Wait for enter animations
        await new Promise(resolve => setTimeout(resolve, 300));
        setIsTransitioning(false);
    };

    return (
        <RouterContext.Provider value={{ currentPath, navigate, isTransitioning }}>
            {children}
        </RouterContext.Provider>
    );
}

export const useRouter = () => useContext(RouterContext);
