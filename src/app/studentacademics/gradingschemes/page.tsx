"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

type GradingScheme = { id: number; username: string; minMark: number; maxMark: number; grade: string; remarks?: string | null };

export default function GradingSchemesPage() {
  const [items, setItems] = useState<GradingScheme[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [form, setForm] = useState<any>({ minMark: '', maxMark: '', grade: '', remarks: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/api/gradingschemes');
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
    return items.filter(it => it.grade.toLowerCase().includes(s) || `${it.minMark}-${it.maxMark}`.includes(s) || (it.remarks ?? '').toLowerCase().includes(s));
  }, [items, q]);

  const reset = () => setForm({ minMark: '', maxMark: '', grade: '', remarks: '' });

  const submit = async () => {
    setLoading(true);
    try {
      const payload: any = {
        minMark: form.minMark !== '' ? Number(form.minMark) : undefined,
        maxMark: form.maxMark !== '' ? Number(form.maxMark) : undefined,
        grade: form.grade?.trim(),
        remarks: form.remarks?.trim() || null,
      };
      if (payload.minMark === undefined || payload.maxMark === undefined || !payload.grade) { setLoading(false); return; }
      if (editingId) {
        const res = await apiFetch('/api/gradingschemes', { method: 'PUT', body: JSON.stringify({ id: editingId, ...payload }) });
        const up = await res.json().catch(() => null);
        if (res.ok && up) setItems(prev => prev.map(i => i.id === up.id ? up : i));
      } else {
        const res = await apiFetch('/api/gradingschemes', { method: 'POST', body: JSON.stringify(payload) });
        const created = await res.json().catch(() => null);
        if (res.ok && created) setItems(prev => [created, ...prev]);
      }
      setEditingId(null);
      reset();
    } finally {
      setLoading(false);
    }
  };

  const edit = (it: GradingScheme) => {
    setEditingId(it.id);
    setForm({ minMark: String(it.minMark), maxMark: String(it.maxMark), grade: it.grade, remarks: it.remarks ?? '' });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id: number) => {
    if (!confirm('Delete grading scheme?')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/gradingschemes', { method: 'DELETE', body: JSON.stringify({ id }) });
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
        <h2 className="text-2xl font-bold mb-4">Grading Schemes</h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white p-4 rounded border mb-4">
          <input className="border p-2 rounded" placeholder="Min mark" type="number" value={form.minMark} onChange={e => setForm({ ...form, minMark: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Max mark" type="number" value={form.maxMark} onChange={e => setForm({ ...form, maxMark: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Grade (e.g., A, B)" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Remarks" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
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
                <th className="p-2 border">Range</th>
                <th className="p-2 border">Grade</th>
                <th className="p-2 border">Remarks</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it, idx) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx + 1}</td>
                  <td className="p-2 border">{it.minMark} - {it.maxMark}</td>
                  <td className="p-2 border">{it.grade}</td>
                  <td className="p-2 border">{it.remarks ?? ''}</td>
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
