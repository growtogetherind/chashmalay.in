import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmContext = createContext();

export const useConfirm = () => {
  return useContext(ConfirmContext);
};

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    message: '',
    title: 'Confirm Action',
  });

  const resolver = useRef(null);

  const confirm = useCallback(({ title = 'Confirm Action', message }) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
    });
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const handleConfirm = () => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    if (resolver.current) resolver.current(true);
  };

  const handleCancel = () => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    if (resolver.current) resolver.current(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {confirmState.isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-[#111111] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2">{confirmState.title}</h3>
              <p className="text-gray-400 mb-6 text-sm">{confirmState.message}</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-full transition-colors shadow-lg shadow-blue-500/20"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};
