import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  FileText,
  PlusCircle,
  BarChart3,
  Ban,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  FolderLock,
  Layers
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, isCitizen, isInvestigator, isAdmin } = useAuth();

  // Role-appropriate navigation lists
  const citizenNav = [
    { name: 'My Complaints', to: '/dashboard', icon: FileText },
    { name: 'File a Complaint', to: '/dashboard/file', icon: PlusCircle },
    { name: 'Profile & Settings', to: '/profile', icon: Settings },
  ];

  const investigatorNav = [
    { name: 'Investigation Desk', to: '/investigation', icon: FileText },
    { name: 'Scammer Blacklist', to: '/investigation/blacklist', icon: Ban },
    { name: 'Casework Analytics', to: '/investigation/analytics', icon: BarChart3 },
    { name: 'Officer Settings', to: '/profile', icon: Settings },
  ];

  const adminNav = [
    { name: 'Admin Dashboard', to: '/admin', icon: Layers },
    { name: 'User Management', to: '/admin/users', icon: Users },
    { name: 'Scam Categories', to: '/admin/categories', icon: FolderLock },
    { name: 'Casework Caseload', to: '/investigation', icon: FileText },
    { name: 'Blacklist Oversight', to: '/investigation/blacklist', icon: Ban },
    { name: 'System Analytics', to: '/investigation/analytics', icon: BarChart3 },
    { name: 'Security Audit Logs', to: '/admin/audit', icon: ShieldCheck },
    { name: 'Admin Profile', to: '/profile', icon: Settings },
  ];

  const navItems = isAdmin ? adminNav : isInvestigator ? investigatorNav : citizenNav;
  const workspaceLabel = isAdmin
    ? 'ADMINISTRATIVE DESK'
    : isInvestigator
    ? 'INVESTIGATION DESK'
    : 'CITIZEN PUBLIC DESK';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0C2038] text-white flex flex-col justify-between transition-transform duration-200 ease-in-out border-r border-[#1B3557] ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 border-b border-[#1B3557] flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Red square shield icon */}
              <div className="w-8 h-8 bg-[#C93636] flex items-center justify-center">
                <ShieldAlert size={18} className="text-white" strokeWidth={2.2} />
              </div>
              <div>
                <span className="font-serif font-bold tracking-wider text-base text-white block leading-none">
                  SAFECASE
                </span>
                <span className="text-[9px] uppercase tracking-widest text-[#94A3B8] font-semibold block mt-1">
                  ANTI-SCAM DESK
                </span>
              </div>
            </div>
          </div>

          {/* Workspace label */}
          <div className="px-6 py-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              WORKSPACE
            </div>
            <div className="text-xs font-semibold text-white tracking-wide mt-0.5">
              {workspaceLabel}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-2 space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.name + item.to}
                to={item.to}
                end={item.to === '/dashboard' || item.to === '/investigation' || item.to === '/admin'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3 text-xs font-medium tracking-wide transition-colors ${
                    isActive
                      ? 'bg-[#132A47] text-white border-l-4 border-[#C93636]'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#132A47]/60 border-l-4 border-transparent'
                  }`
                }
              >
                <item.icon size={16} strokeWidth={2} />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer: User summary & Sign out */}
        <div className="p-4 border-t border-[#1B3557]">
          <div className="px-2 py-2 flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="text-xs font-semibold text-white truncate">
                {user?.full_name}
              </div>
              <div className="text-[10px] text-[#94A3B8] truncate">{user?.email}</div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 text-[#94A3B8] hover:text-[#C93636] transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
