import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Play double chime notification sound using browser Web Audio API
  const playNotificationSound = useCallback(() => {
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
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const response = await api.get('/notification');
      if (response && response.success && response.data) {
        setNotifications(response.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications from database:', err);
    }
  }, [user]);

  // Load user notifications on login / profile change
  useEffect(() => {
    let active = true;
    if (!user) {
      // Defer state update to next microtask tick
      Promise.resolve().then(() => {
        if (active) {
          setNotifications([]);
        }
      });
      return;
    }
    
    api.get('/notification')
      .then((response) => {
        if (active && response && response.success && response.data) {
          setNotifications(response.data.notifications || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load notifications from database:', err);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const addNotification = async (title, description, type = 'info') => {
    // Optimistic local state append
    const localId = `local-${Date.now()}`;
    const newNotif = {
      id: localId,
      title,
      description,
      timestamp: new Date().toISOString(),
      read: false,
      type
    };

    setNotifications((prev) => [newNotif, ...prev]);
    playNotificationSound();

    // Persist to MongoDB if user is authenticated
    if (user) {
      try {
        await api.post('/notification', { title, description, type });
        fetchNotifications(); // reload to get actual DB ids
      } catch (err) {
        console.error('Failed to persist notification:', err);
      }
    }
  };

  const markAllAsRead = async () => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.patch('/notification/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const markAsRead = async (id) => {
    // Skip if already read or local notification
    const item = notifications.find(n => n.id === id);
    if (!item || item.read) return;

    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

    if (typeof id === 'string' && id.startsWith('local-')) {
      return;
    }

    try {
      await api.patch(`/notification/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(`Failed to mark read notification ${id}:`, err);
    }
  };

  const clearNotification = async (id) => {
    // Optimistic UI update
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    if (typeof id === 'string' && id.startsWith('local-')) {
      return;
    }

    try {
      await api.delete(`/notification/${id}`);
      fetchNotifications();
    } catch (err) {
      console.error(`Failed to clear notification ${id}:`, err);
    }
  };

  const clearAllNotifications = async () => {
    // Optimistic UI update
    setNotifications([]);
    try {
      await api.delete('/notification');
      fetchNotifications();
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
    }
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
