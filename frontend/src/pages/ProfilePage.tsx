import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../api/client';
import { User, Lock, AlertTriangle, ShieldCheck } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { addToast } = useNotification();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      addToast('error', 'New passwords do not match');
      return;
    }

    setIsUpdating(true);
    try {
      const updated = await api.put<any>('/auth/me', {
        full_name: fullName,
        phone_number: phoneNumber || undefined,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined,
      });

      updateUser(updated);
      addToast('success', 'Profile and security preferences updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (
      !window.confirm(
        'Are you sure you want to request account deactivation? You will be signed out and unable to log in until reactivated by an administrator.'
      )
    ) {
      return;
    }

    try {
      await api.delete('/auth/me');
      addToast('info', 'Your account has been deactivated.');
      logout();
    } catch (err: any) {
      addToast('error', err.message || 'Deactivation request failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-1">
          CREDENTIAL & ACCOUNT SETTINGS
        </div>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#0C2038]">
          Profile & Security Settings
        </h1>
        <p className="text-xs lg:text-sm text-[#64748B] mt-1">
          Manage your verified contact details, role authorizations, and authentication passwords.
        </p>
      </div>

      {/* Account Summary Banner */}
      <div className="bg-white border border-[#E2E8F0] p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#0C2038] text-white flex items-center justify-center font-serif text-lg font-bold">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="text-base font-serif font-bold text-[#0C2038]">{user?.full_name}</div>
            <div className="text-xs text-[#64748B]">{user?.email}</div>
          </div>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-slate-100 text-[#0C2038] border border-slate-300">
          {user?.role}
        </span>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleUpdateProfile} className="bg-white border border-[#E2E8F0] p-6 space-y-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#0C2038] pb-2 border-b border-[#E2E8F0]">
          Contact Information
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
              Full Legal Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] rounded-none focus:outline-none focus:border-[#0C2038]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 ..."
              className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] rounded-none focus:outline-none focus:border-[#0C2038]"
            />
          </div>
        </div>

        <div className="text-xs font-semibold uppercase tracking-wider text-[#0C2038] pb-2 border-b border-[#E2E8F0] pt-4">
          Change Password (Optional)
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Required to change password"
              className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] rounded-none focus:outline-none focus:border-[#0C2038]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] rounded-none focus:outline-none focus:border-[#0C2038]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] rounded-none focus:outline-none focus:border-[#0C2038]"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
          <button
            type="submit"
            disabled={isUpdating}
            className="px-6 py-2.5 bg-[#0C2038] hover:bg-[#132A47] text-white text-xs font-semibold uppercase tracking-wider rounded-none"
          >
            {isUpdating ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Account Deactivation Section */}
      <div className="bg-white border border-rose-200 p-6 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#C93636] flex items-center gap-1.5">
          <AlertTriangle size={14} /> Account Deactivation Policy
        </div>
        <p className="text-xs text-[#64748B] leading-relaxed">
          In compliance with civic data retention regulations, historical complaints and investigation logs are securely retained in audit storage, while your authentication credentials and session access are revoked.
        </p>
        <button
          onClick={handleDeactivateAccount}
          className="px-4 py-2 bg-rose-50 border border-rose-300 text-[#C93636] hover:bg-rose-100 text-xs font-semibold uppercase tracking-wider"
        >
          Deactivate My Account
        </button>
      </div>
    </div>
  );
};
