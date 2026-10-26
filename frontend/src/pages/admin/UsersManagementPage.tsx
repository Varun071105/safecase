import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  Users,
  Search,
  Plus,
  Shield,
  Edit2,
  Lock,
  RefreshCw,
  Check,
  X
} from 'lucide-react';

export const UsersManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { addToast } = useNotification();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<'CITIZEN' | 'INVESTIGATOR' | 'ADMIN'>('INVESTIGATOR');
  const [isCreating, setIsCreating] = useState(false);

  // Edit User Modal
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'CITIZEN' | 'INVESTIGATOR' | 'ADMIN'>('CITIZEN');
  const [editActive, setEditActive] = useState(true);
  const [editPassword, setEditPassword] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (roleFilter) params.append('role', roleFilter);

      const res = await api.get<User[]>(`/users/?${params.toString()}`);
      setUsers(res);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to load user accounts');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, addToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newFullName) return;

    setIsCreating(true);
    try {
      await api.post('/users/', {
        email: newEmail,
        password: newPassword,
        full_name: newFullName,
        phone_number: newPhone || undefined,
        role: newRole,
      });

      addToast('success', `Created account for ${newFullName} (${newRole})`);
      setShowCreateModal(false);
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      setNewPhone('');
      fetchUsers();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEdit = (u: User) => {
    setEditUser(u);
    setEditFullName(u.full_name);
    setEditPhone(u.phone_number || '');
    setEditRole(u.role);
    setEditActive(u.is_active);
    setEditPassword('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    setIsSavingEdit(true);
    try {
      await api.put(`/users/${editUser.id}`, {
        full_name: editFullName,
        phone_number: editPhone || undefined,
        role: editRole,
        is_active: editActive,
        password: editPassword || undefined,
      });

      addToast('success', `Account ${editUser.email} updated successfully`);
      setEditUser(null);
      fetchUsers();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update user');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleToggleActive = async (u: User) => {
    if (u.id === currentUser?.id) {
      addToast('error', 'Cannot deactivate your own administrator account');
      return;
    }

    try {
      await api.put(`/users/${u.id}`, {
        is_active: !u.is_active,
      });
      addToast('success', `Account ${u.email} ${!u.is_active ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (err: any) {
      addToast('error', err.message || 'Operation failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-1">
            ACCESS GOVERNANCE
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#0C2038]">
            User & Officer Management
          </h1>
          <p className="text-xs lg:text-sm text-[#64748B] mt-1">
            Provision investigator accounts, manage roles, and enforce security policies.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-[#C93636] hover:bg-[#B22B2B] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded-none self-start sm:self-auto"
        >
          <Plus size={14} /> Create Account
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#E2E8F0] shadow-none">
        <div className="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
              <Search size={14} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] placeholder-[#94A3B8] focus:outline-none focus:border-[#0C2038] rounded-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-white border border-[#CBD5E1] text-xs text-[#0C2038] rounded-none"
            >
              <option value="">All Roles</option>
              <option value="CITIZEN">Citizen</option>
              <option value="INVESTIGATOR">Investigator</option>
              <option value="ADMIN">Super Admin</option>
            </select>

            <button
              onClick={fetchUsers}
              className="p-1.5 border border-[#CBD5E1] text-[#0C2038] hover:bg-[#F4F6F8]"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Name</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Email</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Role</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Phone</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Status</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Registered</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin text-[#0C2038]" />
                      <span>Loading accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    No accounts found matching filter.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#0C2038]">{u.full_name}</td>
                    <td className="py-3 px-4 text-[#64748B] font-mono">{u.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-900 border-purple-200'
                            : u.role === 'INVESTIGATOR'
                            ? 'bg-blue-50 text-blue-900 border-blue-200'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">{u.phone_number || '—'}</td>
                    <td className="py-3 px-4">
                      {u.is_active ? (
                        <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-rose-800 bg-rose-50 px-2 py-0.5 border border-rose-200">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1 text-[#64748B] hover:text-[#0C2038]"
                          title="Edit Account Details"
                        >
                          <Edit2 size={14} />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`p-1 ${
                              u.is_active
                                ? 'text-rose-700 hover:text-rose-900'
                                : 'text-emerald-700 hover:text-emerald-900'
                            }`}
                            title={u.is_active ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {u.is_active ? <X size={14} /> : <Check size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-xl font-serif font-bold text-[#0C2038] mb-1">
              Create New Account
            </h3>
            <p className="text-xs text-[#64748B] mb-4">
              Provision a new official investigator, admin, or citizen user.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Officer Full Name"
                  className="w-full p-2 text-xs bg-white border border-[#CBD5E1] rounded-none focus:outline-none focus:border-[#0C2038]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="officer@safecase.gov"
                  className="w-full p-2 text-xs bg-white border border-[#CBD5E1] rounded-none focus:outline-none focus:border-[#0C2038]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full p-2 text-xs bg-white border border-[#CBD5E1] rounded-none focus:outline-none focus:border-[#0C2038]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Role Permission
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full p-2 text-xs bg-white border border-[#CBD5E1] rounded-none focus:outline-none focus:border-[#0C2038]"
                >
                  <option value="INVESTIGATOR">Investigator (Casework Officer)</option>
                  <option value="ADMIN">Super Admin (System Administrator)</option>
                  <option value="CITIZEN">Citizen (Complainant)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full p-2 text-xs bg-white border border-[#CBD5E1] rounded-none focus:outline-none focus:border-[#0C2038]"
                />
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-white border border-[#CBD5E1] text-xs font-medium text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-[#C93636] hover:bg-[#B22B2B] text-white text-xs font-semibold uppercase tracking-wider"
                >
                  {isCreating ? 'Provisioning...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-xl font-serif font-bold text-[#0C2038] mb-1">
              Edit Account: {editUser.email}
            </h3>
            <p className="text-xs text-[#64748B] mb-4">
              Modify account authorization and activation status.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full p-2 text-xs bg-white border border-[#CBD5E1] rounded-none focus:outline-none focus:border-[#0C2038]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-2 text-xs bg-white border border-[#CBD5E1] rounded-none focus:outline-none focus:border-[#0C2038]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Assigned Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full p-2 text-xs bg-white border border-[#CBD5E1] rounded-none focus:outline-none focus:border-[#0C2038]"
                >
                  <option value="CITIZEN">Citizen</option>
                  <option value="INVESTIGATOR">Investigator</option>
                  <option value="ADMIN">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Reset Password (Leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="New password (optional)"
                  className="w-full p-2 text-xs bg-white border border-[#CBD5E1] rounded-none focus:outline-none focus:border-[#0C2038]"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs text-[#0C2038] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="rounded-none border-[#CBD5E1] text-[#0C2038]"
                  />
                  <span>Account is Active and allowed to authenticate</span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 bg-white border border-[#CBD5E1] text-xs font-medium text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 bg-[#0C2038] hover:bg-[#132A47] text-white text-xs font-semibold uppercase tracking-wider"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
