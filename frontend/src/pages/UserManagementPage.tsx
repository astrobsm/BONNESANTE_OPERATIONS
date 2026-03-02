import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { PageHeader, Card, Button } from '@/components/ui';
import {
  Users, UserPlus, Search, Shield, ShieldOff,
  KeyRound, Edit, ChevronLeft, ChevronRight, X,
} from 'lucide-react';

interface UserItem {
  id: string;
  employee_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  department: string | null;
  is_active: boolean;
  is_verified: boolean;
  last_login: string | null;
  created_at: string;
}

const ROLE_OPTIONS = [
  { value: 'factory_supervisor', label: 'Factory Supervisor' },
  { value: 'sales_manager', label: 'Sales Manager' },
  { value: 'marketer', label: 'Marketer' },
  { value: 'customer_care', label: 'Customer Care' },
  { value: 'admin', label: 'Admin' },
  { value: 'hr_management', label: 'HR Management' },
];

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  hr_management: 'bg-blue-100 text-blue-800',
  factory_supervisor: 'bg-green-100 text-green-800',
  sales_manager: 'bg-orange-100 text-orange-800',
  marketer: 'bg-pink-100 text-pink-800',
  customer_care: 'bg-teal-100 text-teal-800',
};

interface CreateUserForm {
  employee_id: string;
  email: string;
  full_name: string;
  phone: string;
  password: string;
  role: string;
  department: string;
}

const emptyForm: CreateUserForm = {
  employee_id: '', email: '', full_name: '', phone: '',
  password: '', role: 'sales_manager', department: '',
};

export default function UserManagementPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [createForm, setCreateForm] = useState<CreateUserForm>({ ...emptyForm });
  const [editForm, setEditForm] = useState<Partial<CreateUserForm>>({});
  const [resetPwValue, setResetPwValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pageSize = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page, page_size: pageSize };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (activeFilter !== '') params.active_only = activeFilter;
      const res = await api.get('/auth/users', { params });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, activeFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };

  // Create User
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/auth/users', createForm);
      flash('User created successfully');
      setShowCreate(false);
      setCreateForm({ ...emptyForm });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit User
  const openEdit = (u: UserItem) => {
    setSelectedUser(u);
    setEditForm({ full_name: u.full_name, email: u.email, phone: u.phone || '', role: u.role, department: u.department || '' });
    setShowEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    setError('');
    try {
      await api.put(`/auth/users/${selectedUser.id}`, editForm);
      flash('User updated');
      setShowEdit(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active
  const handleToggleActive = async (u: UserItem) => {
    if (u.id === currentUser?.id) return;
    try {
      await api.patch(`/auth/users/${u.id}/toggle-active`, { is_active: !u.is_active });
      flash(`${u.full_name} ${u.is_active ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to toggle');
    }
  };

  // Admin reset password
  const openResetPw = (u: UserItem) => { setSelectedUser(u); setResetPwValue(''); setShowResetPw(true); };
  const handleResetPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/auth/users/${selectedUser.id}/reset-password`, { new_password: resetPwValue });
      flash(`Password reset for ${selectedUser.full_name}`);
      setShowResetPw(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <PageHeader title="User Management" subtitle={`${total} users total`} />

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">{success}</div>}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Roles</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <Button onClick={() => { setShowCreate(true); setCreateForm({ ...emptyForm }); }}>
          <UserPlus size={16} className="mr-1" /> New User
        </Button>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500 text-xs uppercase">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">No users found</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{u.full_name}</td>
                  <td className="py-3 px-4 text-gray-600">{u.email}</td>
                  <td className="py-3 px-4 text-gray-600">{u.employee_id}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-700'}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${u.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                    {u.is_active ? 'Active' : 'Inactive'}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {u.last_login ? new Date(u.last_login).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button onClick={() => openEdit(u)} title="Edit" className="p-1.5 rounded hover:bg-gray-100"><Edit size={15} /></button>
                    <button onClick={() => openResetPw(u)} title="Reset Password" className="p-1.5 rounded hover:bg-gray-100"><KeyRound size={15} /></button>
                    <button onClick={() => handleToggleActive(u)} title={u.is_active ? 'Deactivate' : 'Activate'}
                      className={`p-1.5 rounded hover:bg-gray-100 ${u.id === currentUser?.id ? 'opacity-30 cursor-not-allowed' : ''}`}
                      disabled={u.id === currentUser?.id}
                    >
                      {u.is_active ? <ShieldOff size={15} className="text-red-500" /> : <Shield size={15} className="text-green-500" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-sm text-gray-600">
            <span>Page {page} of {totalPages} ({total} users)</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={18} /></button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Create Modal ── */}
      {showCreate && (
        <Modal title="Create New User" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-3">
            <Input label="Full Name" required value={createForm.full_name} onChange={(v) => setCreateForm({ ...createForm, full_name: v })} />
            <Input label="Email" type="email" required value={createForm.email} onChange={(v) => setCreateForm({ ...createForm, email: v })} />
            <Input label="Employee ID" required value={createForm.employee_id} onChange={(v) => setCreateForm({ ...createForm, employee_id: v })} />
            <Input label="Phone" value={createForm.phone} onChange={(v) => setCreateForm({ ...createForm, phone: v })} />
            <Input label="Department" value={createForm.department} onChange={(v) => setCreateForm({ ...createForm, department: v })} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <Input label="Password" type="password" required minLength={8} value={createForm.password} onChange={(v) => setCreateForm({ ...createForm, password: v })} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" loading={submitting}>Create User</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {showEdit && selectedUser && (
        <Modal title={`Edit — ${selectedUser.full_name}`} onClose={() => setShowEdit(false)}>
          <form onSubmit={handleEdit} className="space-y-3">
            <Input label="Full Name" value={editForm.full_name || ''} onChange={(v) => setEditForm({ ...editForm, full_name: v })} />
            <Input label="Email" type="email" value={editForm.email || ''} onChange={(v) => setEditForm({ ...editForm, email: v })} />
            <Input label="Phone" value={editForm.phone || ''} onChange={(v) => setEditForm({ ...editForm, phone: v })} />
            <Input label="Department" value={editForm.department || ''} onChange={(v) => setEditForm({ ...editForm, department: v })} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={editForm.role || ''} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
              <Button type="submit" loading={submitting}>Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Reset Password Modal ── */}
      {showResetPw && selectedUser && (
        <Modal title={`Reset Password — ${selectedUser.full_name}`} onClose={() => setShowResetPw(false)}>
          <form onSubmit={handleResetPw} className="space-y-3">
            <Input label="New Password" type="password" required minLength={8} value={resetPwValue} onChange={setResetPwValue} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowResetPw(false)}>Cancel</Button>
              <Button type="submit" loading={submitting}>Reset Password</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ── Reusable sub-components ── */

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', required, minLength }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; minLength?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
      />
    </div>
  );
}
