"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

type AssessmentType = { id: number; username: string; name: string; percentage: number; description?: string | null };

export default function AssessmentTypesPage() {
  const [items, setItems] = useState<AssessmentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [form, setForm] = useState<any>({ name: '', percentage: '', description: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/api/assessmenttypes');
        const data = await res.json().catch(() => []);
        setItems(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!q) return items;
    const s = q.toLowerCase();
    return items.filter(it => it.name.toLowerCase().includes(s) || String(it.percentage).includes(s) || (it.description ?? '').toLowerCase().includes(s));
  }, [items, q]);

  const reset = () => setForm({ name: '', percentage: '', description: '' });

  const submit = async () => {
    setLoading(true);
    try {
      const payload: any = {
        name: form.name?.trim(),
        percentage: form.percentage !== '' ? Number(form.percentage) : undefined,
        description: form.description?.trim() || null,
      };
      if (!payload.name || payload.percentage === undefined || Number.isNaN(payload.percentage)) { setLoading(false); return; }
      if (editingId) {
        const res = await apiFetch('/api/assessmenttypes', { method: 'PUT', body: JSON.stringify({ id: editingId, ...payload }) });
        const up = await res.json().catch(() => null);
        if (res.ok && up) setItems(prev => prev.map(i => i.id === up.id ? up : i));
      } else {
        const res = await apiFetch('/api/assessmenttypes', { method: 'POST', body: JSON.stringify(payload) });
        const created = await res.json().catch(() => null);
        if (res.ok && created) setItems(prev => [created, ...prev]);
      }
      setEditingId(null);
      reset();
    } finally {
      setLoading(false);
    }
  };

  const edit = (it: AssessmentType) => {
    setEditingId(it.id);
    setForm({ name: it.name, percentage: String(it.percentage), description: it.description ?? '' });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id: number) => {
    if (!confirm('Delete assessment type?')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/assessmenttypes', { method: 'DELETE', body: JSON.stringify({ id }) });
      if (res.ok) setItems(prev => prev.filter(i => i.id !== id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Assessment Types</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded border mb-4">
          <input className="border p-2 rounded" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Percentage" type="number" value={form.percentage} onChange={e => setForm({ ...form, percentage: e.target.value })} />
          <input className="border p-2 rounded md:col-span-2" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="flex items-center gap-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submit}>{editingId ? 'Update' : 'Add'}</button>
            {editingId && <button className="border px-4 py-2 rounded" onClick={() => { setEditingId(null); reset(); }}>Cancel</button>}
          </div>
        </div>

        <div className="flex items-center mb-2">
          <input placeholder="Search" className="border p-2 rounded" value={q} onChange={e => setQ(e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse bg-white">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">#</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Percentage</th>
                <th className="p-2 border">Description</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it, idx) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx + 1}</td>
                  <td className="p-2 border">{it.name}</td>
                  <td className="p-2 border">{it.percentage}</td>
                  <td className="p-2 border">{it.description ?? ''}</td>
                  <td className="p-2 border">
                    <div className="flex gap-2">
                      <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => edit(it)}>Edit</button>
                      <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => remove(it.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <div className="text-sm text-gray-600 mt-2">Working...</div>}
      </main>
    </div>
  );
}
