"use client";
import SidebarMenu from "@/components/SidebarMenu";
import LoadingSpinner from '@/components/LoadingSpinner';

import React, { useState, useEffect } from 'react';
import { getAuth } from '../../utils/auth';
import LogoutButton from '@/components/LogoutButton';
import { useRouter } from 'next/navigation';

interface UserAccount {
  id: number;
  username: string;
  roleId: number;
  isActive: boolean;
}

const UserAccountPage: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{ id?: number; username: string; password: string; roleId: number; isActive: boolean }>({ username: '', password: '', roleId: 1, isActive: true });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [roles, setRoles] = useState<{ id: number; roleName: string }[]>([]);
  const router = useRouter();
  const auth = getAuth();
  // Extract primitive role to avoid effect dependency on a new object each render
  const role = auth?.role ?? null;

  const fetchUsers = () => {
    if (role === null) return;
    setLoading(true);
    fetch(`/api/useraccount?roleId=${role}`)
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load users');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (role === null || role > 2) {
      router.push('/login');
      return;
    }
    fetchUsers();
  }, [role, router]);

  useEffect(() => {
    // load roles for dropdown
    fetch('/api/roles')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRoles(data);
      })
      .catch(() => { /* ignore */ });
  }, []);

  if (role === null || role > 2) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const payload = {
      username: form.username,
      passwordHash: form.password,
      roleId: form.roleId,
      isActive: form.isActive,
      id: form.id,
    };
    let res;
    if (editingId) {
      res = await fetch('/api/useraccount', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch('/api/useraccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    if (res.ok) {
      setForm({ username: '', password: '', roleId: 1, isActive: true });
      setEditingId(null);
      fetchUsers();
    } else {
      setError('Failed to save user');
    }
    setLoading(false);
  };

  const handleEdit = (user: UserAccount) => {
    setForm({ id: user.id, username: user.username, password: '', roleId: user.roleId, isActive: user.isActive });
    setEditingId(user.id);
  };

  const handleDelete = async (id: number) => {
    // ask for confirmation before deleting
    const ok = window.confirm('Are you sure you want to delete this user account?');
    if (!ok) return;
    setLoading(true);
    try {
      await fetch('/api/useraccount', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, roleId: auth.role }),
      });
      fetchUsers();
    } catch (err) {
      setError('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <main className="flex-1 p-8 relative">
  <LogoutButton />
        <h2 className="text-2xl font-bold mb-4">User Accounts</h2>
  {loading && <LoadingSpinner />}
        {error && <div className="text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="mb-6 flex gap-4 items-end">
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            className="border p-2 rounded"
            required
          />
          <input
            type="password"
            placeholder={editingId ? "New Password (optional)" : "Password"}
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="border p-2 rounded"
            required={!editingId}
          />
          {roles.length > 0 ? (
            <select value={form.roleId} onChange={e => setForm(f => ({ ...f, roleId: Number(e.target.value) }))} className="border p-2 rounded">
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.roleName}</option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              placeholder="Role ID"
              value={form.roleId}
              onChange={e => setForm(f => ({ ...f, roleId: Number(e.target.value) }))}
              className="border p-2 rounded w-24"
              min={1}
              max={10}
              required
            />
          )}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
            />
            Active
          </label>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            {editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={() => { setEditingId(null); setForm({ username: '', password: '', roleId: 1, isActive: true }); }}>
              Cancel
            </button>
          )}
        </form>
        <table className="w-full border mt-4">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">ID</th>
              <th className="p-2">Username</th>
              <th className="p-2">Role ID</th>
              <th className="p-2">Active</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t">
                <td className="p-2">{user.id}</td>
                <td className="p-2">{user.username}</td>
                <td className="p-2">{user.roleId}</td>
                <td className="p-2">{user.isActive ? 'Yes' : 'No'}</td>
                <td className="p-2 flex gap-2">
                  <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => handleEdit(user)}>Edit</button>
                  <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => handleDelete(user.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default UserAccountPage;
