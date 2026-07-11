export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};
export const staggerContainer = (staggerDelay = 0.08, initialDelay = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: staggerDelay, delayChildren: initialDelay } },
});
export const springPress = {
  whileTap: { scale: 0.94 },
  whileHover: { scale: 1.03 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
};
export const pageTransitionVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
};
