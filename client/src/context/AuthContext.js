import { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);
const PORT = process.env.BACKEND_PORT || 5000;
const URL = process.env.REACT_BACKEND_API_URL || 'http://localhost:' + PORT;

// Add this utility function at the top level
export const isAuthError = (error) => {
    return error?.message?.toLowerCase().includes('token') ||
        error?.message?.toLowerCase().includes('authentication');
};

const whoami = async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const resp = await fetch(`${URL}/api/whoami`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Accept': 'application/json'
            },
            credentials: 'include'
        });
        if (resp.ok) {
            const d = await resp.json();
            localStorage.setItem('user', JSON.stringify(d));
            return d;
        }
        return null;
    } catch (err) {
        console.error('whoami error:', err);
        return null;
    }
};

const refresh = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
        const resp = await fetch(`${URL}/api/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken })
        });
        if (resp.ok) {
            const data = await resp.json();
            localStorage.setItem('token', data.token);
            return data;
        }
        return null;
    } catch (err) {
        console.error('refresh error:', err);
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const skipAuth = process.env.REACT_APP_SKIP_AUTH === 'true';

    const [user, setUser] = useState(
        skipAuth
            ? { name: 'Dev User', enrollmentNo: '21124001' }
            : null
    );

    const [isLoading, setIsLoading] = useState(!skipAuth);
    const [loginError, setLoginError] = useState(null);

    // Add new method to handle auth errors
    const handleAuthError = () => {
        logout();
        window.location.href = '/login';
    };

    useEffect(() => {
        if (skipAuth) return;

        const initializeAuth = async () => {

            const token = localStorage.getItem('token');

            if (!token) {
                // No token -> we know we're not logged in
                setIsLoading(false);
                return;
            }
            let userData = localStorage.getItem('user');
            if (userData) {
                setUser(JSON.parse(userData));
                setIsLoading(false);
                return
            }
            // Attempt whoami
            userData = await whoami();
            if (!userData) {
                // whoami failed -> try refresh
                const refreshData = await refresh();
                if (!refreshData) {
                    // Refresh failed -> remove tokens, done
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    setUser(null);
                    setIsLoading(false);
                    return;
                }

                // Refresh succeeded -> whoami again
                userData = await whoami();
                if (!userData) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    setUser(null);
                    setIsLoading(false);
                    return;
                }
            }

            setUser(userData);
            setIsLoading(false);
        };

        initializeAuth();
    }, [skipAuth]);

    const login = async (enrollmentNo, password) => {
        setLoginError(null);
        console.log('[login] Attempting to log in...');
        try {
            const resp = await fetch(`${URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                body: JSON.stringify({
                    enroll: enrollmentNo,
                    password
                })
            });

            const data = await resp.json();

            if (!resp.ok) {
                throw new Error(data.message || 'Login failed');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);

            const userData = await whoami();
            if (!userData) {
                throw new Error('Failed to get user data');
            }
            setUser(userData);
            return true;
        } catch (error) {
            console.error('[login] error:', error);
            setLoginError(error.message);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                isLoading,
                loginError,
                handleAuthError,
                isAuthError
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
