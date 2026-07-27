import { createContext, useContext, useState } from 'react';

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [notifications, setNotifications] = useState(() => {
    const baseTime = Date.now();
    return [
      {
        id: 1,
        title: 'Welcome to Airtel Expense Manager',
        description: 'Your expense workspace is active. Manage, scan, and audit your claims here.',
        timestamp: new Date(baseTime - 3600000).toISOString(), // 1 hour ago
        read: false,
        type: 'info'
      },
      {
        id: 2,
        title: 'System Synced',
        description: 'Successfully established link to Oracle ERP General Ledger.',
        timestamp: new Date(baseTime - 7200000).toISOString(), // 2 hours ago
        read: true,
        type: 'success'
      }
    ];
  });
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Play double chime notification sound using browser Web Audio API (no external file dependencies)
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const playChime = (time, pitch, duration) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, time);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.06, time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.start(time);
        osc.stop(time + duration);
      };
      
      const now = audioCtx.currentTime;
      playChime(now, 587.33, 0.3);  // D5
      playChime(now + 0.1, 880.00, 0.4); // A5
    } catch (e) {
      console.warn('Web Audio API chime failed to play:', e);
    }
  };

  const addNotification = (title, description, type = 'info') => {
    const newNotif = {
      id: Date.now(),
      title,
      description,
      timestamp: new Date().toISOString(),
      read: false,
      type
    };
    setNotifications((prev) => [newNotif, ...prev]);
    playNotificationSound();
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Reusable loading simulator runner
  const runWithLoading = async (sequence, callback) => {
    setIsLoading(true);
    try {
      for (const step of sequence) {
        setLoadingMessage(step.message);
        await new Promise((resolve) => setTimeout(resolve, step.duration));
      }
      return await callback();
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <UIContext.Provider
      value={{
        isLoading,
        setIsLoading,
        loadingMessage,
        setLoadingMessage,
        runWithLoading,
        notifications,
        addNotification,
        notificationsOpen,
        setNotificationsOpen,
        markAllAsRead,
        markAsRead,
        clearNotification,
        clearAllNotifications,
        unreadCount
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be consumed inside UIProvider');
  }
  return context;
};
