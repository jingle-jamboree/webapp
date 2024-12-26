import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from '../context/RouterContext';

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    enter: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: [0.25, 0.1, 0.25, 1],
            when: 'beforeChildren'
        }
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.2,
            ease: [0.25, 0.1, 0.25, 1]
        }
    }
};

export function PageTransition({ children }) {
    const { currentPath } = useRouter();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={currentPath}
                variants={pageVariants}
                initial="initial"
                animate="enter"
                exit="exit"
                className="page-content"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
