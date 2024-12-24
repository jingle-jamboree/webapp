import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const skipAuth = process.env.REACT_APP_SKIP_AUTH === 'true';
    const [user, setUser] = useState(skipAuth ?
        { name: 'Dev User', enrollmentNo: '21124001' }
        : null
    );

    const login = async (enrollmentNo, password) => {
        // Placeholder for actual auth logic
        setUser({
            name: 'John Doe', // This will come from backend
            enrollmentNo
        });
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
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
