import { motion } from 'framer-motion';
import { pageTransitionVariants } from '../utils/motion';

const PageTransition = ({ children }) => (
  <motion.div initial="initial" animate="animate" exit="exit" variants={pageTransitionVariants}>
    {children}
  </motion.div>
);
export default PageTransition;
