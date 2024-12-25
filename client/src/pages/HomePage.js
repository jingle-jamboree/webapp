import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const features = [
    { id: 1, name: "Lost & Found", icon: "🔍", path: "/lost-and-found" },
    { id: 2, name: "Pick My Parcel", icon: "📦", path: "/parcel" },
    { id: 3, name: "Cat Spotter", icon: "🐈", path: "/cats" },
    { id: 4, name: "Pay For Project", icon: "📝", path: "/pay" }
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: {
        opacity: 0,
        y: 20
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.25, 0.1, 0.25, 1]
        }
    }
};

export default function HomePage() {
    const navigate = useNavigate();

    return (
        <motion.div
            className="container mx-auto px-4 py-8 sm:py-16"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <motion.h1
                className="text-5xl font-bold text-center mb-4 gradient-text"
                variants={itemVariants}
            >
                JIIT Tools
            </motion.h1>

            <motion.p
                className="text-center text-gray-400 mb-12 text-lg"
                variants={itemVariants}
            >
                Your digital companion for campus life
            </motion.p>

            <motion.div
                className="max-w-4xl mx-auto"
                variants={itemVariants}
            >
                <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                    {features.map((feature) => (
                        <motion.button
                            key={feature.id}
                            onClick={() => navigate(feature.path)}
                            className="feature-card group aspect-[4/3] sm:aspect-square"
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="feature-glow" />
                            <div className="feature-inner">
                                <span className="feature-icon">
                                    {feature.icon}
                                </span>
                                <span className="feature-name">
                                    {feature.name}
                                </span>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}