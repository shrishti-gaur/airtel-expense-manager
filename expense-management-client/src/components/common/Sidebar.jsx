import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Scan,
  History,
  ClipboardCheck,
  ShieldCheck,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  SlidersHorizontal
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const userRole = user?.role || 'Employee';

  // Define routes per role
  const navigationItems = {
    Employee: [
      { name: 'Dashboard', path: '/employee', icon: LayoutDashboard },
      { name: 'Scan Receipt (OCR)', path: '/employee/scan', icon: Scan },
      { name: 'Submit Expense', path: '/employee/submit', icon: FileSpreadsheet },
      { name: 'Claim History', path: '/employee/claims', icon: History },
    ],
    Manager: [
      { name: 'Dashboard', path: '/manager', icon: LayoutDashboard },
      { name: 'Pending Reviews', path: '/manager/reviews', icon: ClipboardCheck },
      { name: 'Team Summaries', path: '/manager/teams', icon: SlidersHorizontal },
    ],
    Finance: [
      { name: 'Dashboard', path: '/finance', icon: LayoutDashboard },
      { name: 'Audit Claims', path: '/finance/audit', icon: ShieldCheck },
      { name: 'Bulk Disbursements', path: '/finance/disbursements', icon: CreditCard },
    ],
  };

  const currentNav = navigationItems[userRole] || navigationItems.Employee;

  const activeClass = 'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white bg-red-600 shadow-sm transition-all duration-200';
  const inactiveClass = 'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200';

  const sidebarContent = (
    <div className="flex h-full w-full flex-col justify-between bg-white border-r border-slate-200/80 px-4 py-6">
      <div>
        {/* Brand Header Logo */}
        <div className="flex items-center gap-2.5 px-3 py-2 mb-8">
          <span className="text-3xl font-extrabold tracking-tighter text-red-600 font-display">
            airtel
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 tracking-wide font-sans">
            Expense
          </span>
        </div>

        {/* Dynamic Navigation Links */}
        <nav className="space-y-1.5">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            {userRole} Workspace
          </p>
          {currentNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => (isActive ? activeClass : inactiveClass)}
                end
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Area */}
      <div>
        <div className="mb-4 border-t border-slate-100 pt-4 space-y-1">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) => (isActive ? activeClass : inactiveClass)}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </NavLink>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Log Out</span>
          </button>
        </div>

        {/* User Session Profile Mini */}
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200/40">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="truncate text-xs font-bold text-slate-700 leading-4">{user?.name}</p>
            <p className="truncate text-[10px] text-slate-400">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Panel Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:sticky lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
