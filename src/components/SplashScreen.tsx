import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  appName?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete,
  appName = 'Laba & Rugi Marketplace'
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 500);
    }, 1800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white p-6 select-none"
        >
          {/* Subtle background glow */}
          <div className="absolute w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute w-60 h-60 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative z-10 flex flex-col items-center text-center space-y-5"
          >
            {/* Logo box */}
            <div className="relative">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-slate-800 via-slate-900 to-slate-800 border border-slate-700/80 flex items-center justify-center text-white shadow-2xl">
                <ShoppingBag className="w-10 h-10 text-emerald-400" />
              </div>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-1.5 -right-1.5"
              >
                <Sparkles className="w-5 h-5 text-amber-400" />
              </motion.div>
            </div>

            {/* App title */}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {appName}
              </h1>
              <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                Sistem Akuntansi &amp; Live Shop
              </p>
            </div>

            {/* Welcome to be Success motto */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-6 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs font-bold tracking-wide backdrop-blur-xs flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Welcome to be Success</span>
            </motion.div>

            {/* Loading progress bar */}
            <div className="w-44 h-1 bg-slate-800 rounded-full overflow-hidden mt-6">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.4, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
