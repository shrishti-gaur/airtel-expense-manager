import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { X, Bell, CheckCheck, Trash2, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

/**
 * Premium Right-Side Slide-out Drawer Panel for Activity Logs & Notifications
 */
const NotificationPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    notifications,
    notificationsOpen,
    setNotificationsOpen,
    markAllAsRead,
    markAsRead,
    clearNotification,
    clearAllNotifications,
    unreadCount
  } = useUI();

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    if (notif.claimId && user) {
      const rolePath = 
        user.role === 'Employee' 
          ? 'employee' 
          : user.role === 'Manager' 
            ? 'manager' 
            : 'finance';
      navigate(`/${rolePath}?claimId=${notif.claimId}`);
      setNotificationsOpen(false);
    }
  };

  if (!notificationsOpen) return null;

  // Formatting helper for dynamic timestamps
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return '';
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <>
      {/* Drawer Backdrop Layer */}
      <div
        onClick={() => setNotificationsOpen(false)}
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Side-Drawer Container */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white border-l border-slate-200/80 shadow-2xl animate-fade-in font-sans">
        {/* Header Block */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-6 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-800 font-display">Recent Activity</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={() => setNotificationsOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Panel Utilities */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-2 bg-slate-50/20 text-xs">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 font-semibold text-slate-500 hover:text-red-600 transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
            <button
              onClick={clearAllNotifications}
              className="flex items-center gap-1 font-semibold text-slate-500 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Clear all
            </button>
          </div>
        )}

        {/* Scrollable Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 px-6 text-center">
              <div className="rounded-full bg-slate-100 p-4 mb-4 text-slate-400">
                <Bell className="h-8 w-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Inbox is clean</h3>
              <p className="text-xs text-slate-400 mt-1">
                You will receive alerts here when claims status updates or OCR events complete.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`flex gap-3.5 p-5 text-left transition-colors cursor-pointer relative group ${
                  !notif.read ? 'bg-slate-50/40 hover:bg-slate-50' : 'hover:bg-slate-50/20'
                }`}
              >
                {/* Status Icon Wrapper */}
                <div className="shrink-0 mt-0.5">{getNotifIcon(notif.type)}</div>

                {/* Info Metadata */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className={`text-sm leading-snug truncate ${!notif.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                      {notif.title}
                    </h4>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 leading-normal font-sans pr-2">
                    {notif.description}
                  </p>
                  <span className="mt-2 block text-[10px] text-slate-400 font-sans font-medium">
                    {formatTime(notif.timestamp)}
                  </span>
                </div>

                {/* Context Action Elements */}
                <div className="absolute right-4 top-5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearNotification(notif.id);
                    }}
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Dismiss alert"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Left Unread Stripe Badge */}
                {!notif.read && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-red-600" />
                )}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
};

export default NotificationPanel;
