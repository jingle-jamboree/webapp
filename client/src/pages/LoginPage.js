import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const LoginPage = () => {
    const [enrollmentNo, setEnrollmentNo] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, loginError } = useAuth();
    const navigate = useNavigate();
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!enrollmentNo || !password || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const success = await login(enrollmentNo, password);
            if (success) {
                setIsAnimatingOut(true);
                // Delay navigation to allow animation to complete
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 1000);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={false}
            animate={isAnimatingOut ? {
                scale: 1.2,
                opacity: 0,
                filter: 'blur(10px)',
                transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
            } : {
                scale: 1,
                opacity: 1,
                filter: 'blur(0px)'
            }}
            className="min-h-screen flex items-center justify-center px-4 relative overflow-x-hidden"
        >
            {/* Background glow effects with animation */}
            <motion.div
                animate={isAnimatingOut ? {
                    scale: [1, 2],
                    opacity: [0.1, 0],
                    transition: { duration: 0.8 }
                } : {}}
                className="fixed top-[25vh] left-[25vw] w-[50vw] h-[50vw] max-w-[24rem] max-h-[24rem] bg-blue-500 rounded-full filter blur-[128px] opacity-10"
            />
            <motion.div
                animate={isAnimatingOut ? {
                    scale: [1, 2],
                    opacity: [0.1, 0],
                    transition: { duration: 0.8 }
                } : {}}
                className="fixed bottom-[25vh] right-[25vw] w-[50vw] h-[50vw] max-w-[24rem] max-h-[24rem] bg-purple-500 rounded-full filter blur-[128px] opacity-10"
            />

            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative bg-gray-900 w-full mx-4 max-w-md p-6 sm:p-10 rounded-2xl border border-white/10
                    shadow-[0_0_60px_-15px_rgba(0,0,0,0.5)]"
            >
                <motion.div
                    className="flex flex-col items-center mb-12"
                    animate={isAnimatingOut ? {
                        y: -20,
                        opacity: 0,
                        transition: { duration: 0.3 }
                    } : {}}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-4xl">🎓</span>
                        <h1 className="text-3xl sm:text-4xl font-bold gradient-text">
                            JIIT Tools
                        </h1>
                    </div>
                    <p className="text-gray-400 text-sm">Sign in with your student credentials</p>
                </motion.div>

                <motion.form
                    onSubmit={handleSubmit}
                    className="space-y-8"
                    animate={isAnimatingOut ? {
                        y: 20,
                        opacity: 0,
                        transition: { duration: 0.3 }
                    } : {}}
                >
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
                </motion.form>

                {isSubmitting && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-gray-900/50 rounded-2xl"
                    >
                        <div className="flex flex-col items-center">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-2xl mb-4"
                            >
                                🎓
                            </motion.div>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: 150 }}
                                transition={{ duration: 1, ease: "easeInOut" }}
                                className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                            />
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default LoginPage;
