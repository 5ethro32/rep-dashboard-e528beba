import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy } from 'lucide-react';

interface CelebrationAnimationProps {
  show: boolean;
  message: string;
  type?: 'small' | 'large';
  onComplete?: () => void;
}

const CelebrationAnimation = ({
  show,
  message,
  type = 'small',
  onComplete
}: CelebrationAnimationProps) => {
  const [isVisible, setIsVisible] = useState(show);
  
  useEffect(() => {
    setIsVisible(show);
    
    if (show) {
      // Trigger confetti if it's a celebration
      const isLarge = type === 'large';
      
      if (isLarge) {
        // For large celebrations, make it more elaborate
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        // Fire twice for more impact
        setTimeout(() => {
          confetti({
            particleCount: 100,
            angle: 60,
            spread: 55,
            origin: { x: 0.1, y: 0.7 }
          });
        }, 250);
        
        setTimeout(() => {
          confetti({
            particleCount: 100,
            angle: 120,
            spread: 55,
            origin: { x: 0.9, y: 0.7 }
          });
        }, 400);
      } else {
        // For small celebrations, keep it simple
        confetti({
          particleCount: 50,
          spread: 40,
          origin: { y: 0.7 }
        });
      }
      
      // Hide after a delay
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) onComplete();
      }, isLarge ? 5000 : 3000);
      
      return () => clearTimeout(timer);
    }
  }, [show, type, onComplete]);
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none`}
        >
          <div 
            className={`${
              type === 'large' 
                ? 'bg-gradient-to-b from-yellow-900/90 to-gray-900/90 p-10 rounded-lg'
                : 'bg-gradient-to-b from-green-900/80 to-gray-900/80 p-6 rounded-md'
            } text-white text-center shadow-xl`}
          >
            <Trophy 
              className={`${
                type === 'large' 
                  ? 'h-16 w-16 text-yellow-400' 
                  : 'h-10 w-10 text-green-400'
              } mx-auto mb-3`} 
            />
            <motion.h2 
              className={`${
                type === 'large' 
                  ? 'text-3xl font-bold' 
                  : 'text-xl font-semibold'
              } mb-2`}
              initial={{ y: 20 }}
              animate={{ y: 0 }}
            >
              {type === 'large' ? '🎉 Congratulations! 🎉' : 'Goal Achieved!'}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {message}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationAnimation;
