export const transition = {
  duration: 1.4,
  ease: [0.19, 1, 0.22, 1]
};

export const maskVariant = {
  initial: { clipPath: 'circle(0% at 50% 50%)' },
  animate: { 
    clipPath: 'circle(150% at 50% 50%)',
    transition: { duration: 2, ease: [0.19, 1, 0.22, 1] }
  }
};

export const textReveal = {
  initial: { y: '100%' },
  animate: (i = 0) => ({
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 1.2,
      ease: [0.19, 1, 0.22, 1]
    }
  })
};

export const fadeIn = {
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: [0.19, 1, 0.22, 1] }
  }
};

export const archMask = {
  initial: { clipPath: 'ellipse(100% 0% at 50% 100%)' },
  animate: { 
    clipPath: 'ellipse(100% 100% at 50% 100%)',
    transition: { duration: 1.8, ease: [0.19, 1, 0.22, 1] }
  }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};
export const text3D = {
  initial: { rotateX: 90, opacity: 0, scale: 0.8 },
  animate: (i = 0) => ({
    rotateX: 0,
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 1.5,
      ease: [0.19, 1, 0.22, 1]
    }
  })
};
