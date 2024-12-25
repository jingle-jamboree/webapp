import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const [enrollmentNo, setEnrollmentNo] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, loginError } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!enrollmentNo || !password || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const success = await login(enrollmentNo, password);
            if (success) {
                navigate('/', { replace: true });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative">
            {/* Background glow effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-[128px] opacity-10" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-[128px] opacity-10" />

            <div className="relative bg-gray-900 max-w-md w-full p-8 sm:p-10 rounded-2xl border border-white/10
                shadow-[0_0_60px_-15px_rgba(0,0,0,0.5)]">
                <div className="flex flex-col items-center mb-12">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-4xl">🎓</span>
                        <h1 className="text-3xl sm:text-4xl font-bold gradient-text">
                            JIIT Tools
                        </h1>
                    </div>
                    <p className="text-gray-400 text-sm">Sign in with your student credentials</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {loginError && (
                        <div className="p-3 text-sm rounded-lg bg-red-500/10 border border-red-500/50 text-red-500">
                            {loginError}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <label className="block text-gray-300 text-[13px] font-medium mb-1.5">
                                ENROLLMENT NUMBER
                            </label>
                            <input
                                type="text"
                                required
                                value={enrollmentNo}
                                onChange={(e) => setEnrollmentNo(e.target.value)}
                                placeholder="Enter your enrollment number"
                                className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700/80 
                                    focus:border-blue-500 focus:bg-gray-800
                                    rounded-lg outline-none transition-all duration-300
                                    text-[15px] placeholder:text-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-[13px] font-medium mb-1.5">
                                PASSWORD
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700/80 
                                    focus:border-blue-500 focus:bg-gray-800
                                    rounded-lg outline-none transition-all duration-300
                                    text-[15px] placeholder:text-gray-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 
                            hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg 
                            transition-all duration-300 text-[15px]
                            hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]
                            disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
