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
        return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-3.5 w-3.5 text-blue-500" />;
    }
  };

  return (
    <>
      {/* Invisible click capturer to close panel when clicking outside */}
      <div
        onClick={() => setNotificationsOpen(false)}
        className="fixed inset-0 z-40 bg-transparent"
      />

      {/* Floating Panel Container */}
      <aside className="fixed top-16 right-3 left-3 md:left-auto md:right-6 z-50 flex w-[calc(100vw-1.5rem)] md:w-80 max-h-[42vh] flex-col bg-white border border-slate-200/60 shadow-md rounded-xl animate-fade-in font-sans overflow-hidden">
        {/* Header Block */}
        <div className="flex h-10 items-center justify-between border-b border-slate-200/60 px-3 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5 text-slate-700" />
            <h2 className="text-xs font-extrabold text-slate-800 font-display">Notifications</h2>
            {unreadCount > 0 && (
              <span className="rounded bg-red-50 text-red-600 border border-red-200/50 px-1 py-0.5 text-[8px] font-semibold select-none">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={() => setNotificationsOpen(false)}
            className="rounded-lg p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Action Panel Utilities */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-1 bg-slate-50/20 text-[10px] shrink-0 select-none">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 font-bold text-slate-500 hover:text-red-600 transition-colors"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
            <button
              onClick={clearAllNotifications}
              className="flex items-center gap-1 font-bold text-slate-500 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Clear all
            </button>
          </div>
        )}

        {/* Scrollable Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 px-3 text-center select-none">
              <div className="rounded-full bg-slate-100 p-2.5 mb-2.5 text-slate-400">
                <Bell className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-bold text-slate-800">No new notifications</h3>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[180px]">
                You'll see alerts here for status updates and claims.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`flex gap-2.5 py-2 px-3 text-left transition-colors cursor-pointer relative group ${
                  !notif.read ? 'bg-slate-50/40 hover:bg-slate-50' : 'hover:bg-slate-50/20'
                }`}
              >
                {/* Status Icon Wrapper */}
                <div className="shrink-0 mt-0.5">{getNotifIcon(notif.type)}</div>

                {/* Info Metadata */}
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className={`text-[11px] leading-snug truncate ${!notif.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                      {notif.title}
                    </h4>
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-500 leading-normal font-sans pr-2">
                    {notif.description}
                  </p>
                  <span className="mt-0.5 block text-[8px] text-slate-400 font-sans font-medium">
                    {formatTime(notif.timestamp)}
                  </span>
                </div>

                {/* Context Action Elements */}
                <div className="absolute right-2 top-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearNotification(notif.id);
                    }}
                    className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Dismiss alert"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
};

export default NotificationPanel;
