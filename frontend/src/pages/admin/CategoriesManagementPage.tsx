import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { ScamCategory } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { FolderLock, Plus, Edit2, Trash2, RefreshCw, Check, X } from 'lucide-react';

export const CategoriesManagementPage: React.FC = () => {
  const { addToast } = useNotification();
  const [categories, setCategories] = useState<ScamCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<ScamCategory[]>('/categories/all');
      setCategories(res);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenAdd = () => {
    setEditId(null);
    setName('');
    setDescription('');
    setDisplayOrder(categories.length + 1);
    setIsActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (c: ScamCategory) => {
    setEditId(c.id);
    setName(c.name);
    setDescription(c.description || '');
    setDisplayOrder(c.display_order);
    setIsActive(c.is_active);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      if (editId) {
        await api.put(`/categories/${editId}`, {
          name: name.trim(),
          description: description.trim() || undefined,
          display_order: displayOrder,
          is_active: isActive,
        });
        addToast('success', `Category '${name}' updated`);
      } else {
        await api.post('/categories/', {
          name: name.trim(),
          description: description.trim() || undefined,
          display_order: displayOrder,
          is_active: isActive,
        });
        addToast('success', `Created scam category '${name}'`);
      }
      setShowModal(false);
      fetchCategories();
    } catch (err: any) {
      addToast('error', err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!window.confirm(`Delete scam category '${catName}'?`)) return;
    try {
      await api.delete(`/categories/${id}`);
      addToast('success', `Category '${catName}' removed`);
      fetchCategories();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-1">
            TAXONOMY CONFIGURATION
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#0C2038]">
            Scam Category Management
          </h1>
          <p className="text-xs lg:text-sm text-[#64748B] mt-1">
            Configure crime classifications and intake options presented to citizens and investigators.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-[#C93636] hover:bg-[#B22B2B] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded-none self-start sm:self-auto"
        >
          <Plus size={14} /> Add Category
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] shadow-none">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            All Registered Categories ({categories.length})
          </span>
          <button
            onClick={fetchCategories}
            className="p-1.5 border border-[#CBD5E1] text-[#0C2038] hover:bg-[#F4F6F8]"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Order</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Name</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Description</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Status</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#64748B]">
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#64748B]">
                    No categories configured.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#0C2038]">{c.display_order}</td>
                    <td className="py-3 px-4 font-semibold text-[#0C2038]">{c.name}</td>
                    <td className="py-3 px-4 text-[#64748B] max-w-md truncate">{c.description || '—'}</td>
                    <td className="py-3 px-4">
                      {c.is_active ? (
                        <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 border border-slate-200">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1 text-[#64748B] hover:text-[#0C2038]"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-1 text-[#64748B] hover:text-[#C93636]"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-xl font-serif font-bold text-[#0C2038] mb-1">
              {editId ? 'Edit Category' : 'New Scam Category'}
            </h3>
            <p className="text-xs text-[#64748B] mb-4">
              Define the classification label and citizen guidance.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Identity Theft"
                  className="w-full p-2 text-xs bg-white border border-[#CBD5E1] rounded-none focus:outline-none focus:border-[#0C2038]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Description / Guidance
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain criteria and common modii operandi..."
                  rows={3}
                  className="w-full p-2 text-xs bg-white border border-[#CBD5E1] rounded-none focus:outline-none focus:border-[#0C2038]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  className="w-full p-2 text-xs bg-white border border-[#CBD5E1] rounded-none focus:outline-none focus:border-[#0C2038]"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs text-[#0C2038] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded-none border-[#CBD5E1]"
                  />
                  <span>Active for intake in citizen submission dropdown</span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white border border-[#CBD5E1] text-xs font-medium text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#C93636] hover:bg-[#B22B2B] text-white text-xs font-semibold uppercase tracking-wider"
                >
                  {saving ? 'Saving...' : editId ? 'Save Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
