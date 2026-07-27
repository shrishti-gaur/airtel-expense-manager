import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { Bell, LogOut, User, Activity, Menu } from 'lucide-react';

const Navbar = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { unreadCount, notificationsOpen, setNotificationsOpen } = useUI();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur-md">
      {/* Brand area for mobile */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="mr-1 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-2 lg:hidden">
          <span className="text-xl font-extrabold tracking-tight text-red-600 font-display">
            airtel
          </span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
            Expense
          </span>
        </div>
      </div>

      {/* Global search or metric indicators */}
      <div className="hidden items-center gap-4 md:flex">
        <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200/50">
          <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
          <span>Oracle ERP System: Connected</span>
        </div>
      </div>

      {/* Profile & Notifications */}
      <div className="flex items-center gap-4">
        {/* Mock Notification Bell */}
        <button 
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Notifications Alerts"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-extrabold text-white ring-2 ring-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User profile dropdown selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-full p-1 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-xs font-semibold text-slate-700 leading-3">{user?.name}</p>
              <span className="text-[10px] text-slate-500 font-medium">{user?.role}</span>
            </div>
          </button>

          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg z-20 animate-fade-in">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="truncate text-sm font-semibold text-slate-700">{user?.email}</p>
                </div>
                
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    // Navigation placeholder
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                >
                  <User className="h-4 w-4" />
                  My Settings
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
