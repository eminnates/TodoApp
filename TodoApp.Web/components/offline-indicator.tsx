'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg"
          style={{
            backgroundColor: isOnline ? '#10B981' : '#EF4444',
            color: 'white',
            fontFamily: "'Courier New', monospace",
            border: '2px solid',
            borderColor: isOnline ? '#059669' : '#DC2626',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {isOnline ? '✓' : '⚠'}
            </span>
            <span className="font-semibold">
              {isOnline ? 'Back Online!' : 'You are offline'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
