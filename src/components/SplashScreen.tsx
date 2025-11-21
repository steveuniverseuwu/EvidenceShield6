import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { BlockchainBackground } from "./BlockchainBackground";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [animateToLogin, setAnimateToLogin] = useState(false);

  useEffect(() => {
    // Start moving logo to login position after 2 seconds
    const moveTimer = setTimeout(() => {
      setAnimateToLogin(true);
    }, 2000);

    // Complete the splash screen after the animation finishes (3 seconds total)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(moveTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: animateToLogin ? 0 : 1 }}
      transition={{ duration: 0.5, delay: animateToLogin ? 0.5 : 0 }}
      className="fixed inset-0 z-50 pointer-events-none"
    >
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated Blockchain Background */}
        <BlockchainBackground />

        {/* Main Content - Logo that moves to login position */}
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={
              animateToLogin
                ? {
                    scale: 0.375, // Scale down from 32 (8rem) to 24 (6rem) = 24/32 = 0.75, but starting from center so 0.75 * 0.5 = 0.375
                    opacity: 1,
                    y: "-35vh", // Move up to where the logo should be in login container
                  }
                : { scale: 1, opacity: 1 }
            }
            transition={
              animateToLogin
                ? {
                    duration: 1,
                    ease: "easeInOut",
                  }
                : {
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                    duration: 0.8,
                  }
            }
            className="flex flex-col items-center"
          >
            {/* Logo with Glow Effect */}
            <motion.div
              animate={{
                filter: [
                  "drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))",
                  "drop-shadow(0 0 40px rgba(59, 130, 246, 0.8))",
                  "drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <img 
                src="/CYBERCRIME.png" 
                alt="ChainGuard Logo" 
                className="w-32 h-32 object-contain"
              />
            </motion.div>

            {/* Text that fades out when moving */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={
                animateToLogin
                  ? { opacity: 0, y: 10 }
                  : { opacity: 1, y: 0 }
              }
              transition={
                animateToLogin
                  ? { duration: 0.3 }
                  : { delay: 0.5, duration: 0.8 }
              }
              className="mt-8 text-center"
            >
              <h1 className="text-3xl font-bold text-white mb-2">ChainGuard</h1>
              <p className="text-blue-300 text-sm">Digital Evidence Management</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
