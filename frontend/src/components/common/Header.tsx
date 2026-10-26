import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Bell, ChevronRight, User as UserIcon, LogOut, CheckCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format current date according to locale
  const currentDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Simple breadcrumbs generator
  const getBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return ['SAFECASE', 'DASHBOARD'];
    return ['SAFECASE', ...parts.map((p) => p.replace('-', ' ').toUpperCase())];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 text-[#0C2038] hover:bg-slate-100 border border-transparent"
            title="Toggle Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <nav className="flex items-center space-x-1.5 text-xs text-[#64748B] font-medium tracking-wide">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb + idx}>
              {idx > 0 && <ChevronRight size={12} className="text-[#94A3B8]" />}
              <span className={idx === breadcrumbs.length - 1 ? 'text-[#0C2038] font-semibold' : ''}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Date, Notifications, Profile */}
      <div className="flex items-center gap-4 lg:gap-6">
        <span className="hidden md:inline-block text-xs text-[#64748B] border-r border-[#E2E8F0] pr-5">
          {currentDate}
        </span>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 text-[#64748B] hover:text-[#0C2038] hover:bg-[#F4F6F8] transition-colors"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#C93636] rounded-full ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-[#E2E8F0] shadow-lg py-2 z-50">
              <div className="px-4 py-2 border-b border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#0C2038]">
                  Notifications ({unreadCount} Unread)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-[#C93636] hover:underline flex items-center gap-1"
                  >
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#F1F5F9]">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#64748B]">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && markAsRead(n.id)}
                      className={`p-3 text-xs hover:bg-[#F8FAFC] transition-colors cursor-pointer ${
                        !n.is_read ? 'bg-[#FDF2F2]/50 border-l-2 border-[#C93636]' : ''
                      }`}
                    >
                      <div className="font-semibold text-[#0C2038] mb-0.5">{n.title}</div>
                      <div className="text-[#64748B] line-clamp-2">{n.message}</div>
                      <div className="text-[10px] text-[#94A3B8] mt-1">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1.5 hover:bg-[#F4F6F8] transition-colors text-left"
          >
            <div className="w-8 h-8 bg-[#0C2038] text-white flex items-center justify-center font-serif text-sm font-semibold">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden lg:block">
              <div className="text-xs font-semibold text-[#0C2038] leading-tight">
                {user?.full_name || 'Authorized Officer'}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[#C93636] font-semibold">
                {user?.role}
              </div>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E2E8F0] shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b border-[#E2E8F0] text-xs">
                <div className="font-semibold text-[#0C2038] truncate">{user?.full_name}</div>
                <div className="text-[#64748B] text-[11px] truncate">{user?.email}</div>
              </div>

              <Link
                to="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="w-full text-left px-4 py-2 text-xs text-[#0C2038] hover:bg-[#F4F6F8] flex items-center gap-2"
              >
                <UserIcon size={14} /> Profile & Settings
              </Link>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-xs text-[#C93636] hover:bg-red-50 flex items-center gap-2 border-t border-[#F1F5F9]"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
