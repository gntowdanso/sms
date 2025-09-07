"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/utils/apiFetch';
import Link from 'next/link';

// Minimal types aligned with API
type Student = { id: number; firstName: string; lastName?: string | null; studentNo?: string | null };
type Guardian = { id: number; studentId: number; name: string; relation?: string | null; contactNumber?: string | null; email?: string | null; address?: string | null };

export default function GuardiansPage() {
  const [items, setItems] = useState<Guardian[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState({ studentId: '', q: '' });

  const [form, setForm] = useState<Partial<Guardian>>({ id: undefined, studentId: undefined, name: '', relation: '', contactNumber: '', email: '', address: '' });
  const [editing, setEditing] = useState(false);

  const filteredItems = useMemo(() => {
    let list = items;
    if (filter.studentId) list = list.filter(i => String(i.studentId) === filter.studentId);
    if (filter.q) {
      const q = filter.q.toLowerCase();
      list = list.filter(i =>
        (i.name?.toLowerCase().includes(q)) ||
        (i.relation?.toLowerCase().includes(q)) ||
        (i.contactNumber?.toLowerCase().includes(q)) ||
        (i.email?.toLowerCase().includes(q)) ||
        (i.address?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [items, filter]);

  useEffect(() => {
    // initial load: guardians and students lookup
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [gRes, sRes] = await Promise.all([
          apiFetch('/api/studentguardians'),
          apiFetch('/api/students'),
        ]);
        const [g, s] = await Promise.all([gRes.json(), sRes.json()]);
        setItems((Array.isArray(g) ? g : []) as Guardian[]);
        setStudents((Array.isArray(s) ? s : []) as Student[]);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const upsert = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        id: form.id,
        studentId: typeof form.studentId === 'string' ? Number(form.studentId) : form.studentId,
        name: form.name,
        relation: form.relation,
        contactNumber: form.contactNumber,
        email: form.email,
        address: form.address,
      };
      if (!payload.studentId || !payload.name) {
        setError('Student and Name are required');
        setLoading(false);
        return;
      }
      if (editing) {
        const updatedRes = await apiFetch('/api/studentguardians', { method: 'PUT', body: JSON.stringify(payload) });
        const updated: Guardian = await updatedRes.json();
        setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)));
      } else {
        const createdRes = await apiFetch('/api/studentguardians', { method: 'POST', body: JSON.stringify(payload) });
        const created: Guardian = await createdRes.json();
        setItems(prev => [created, ...prev]);
      }
      setForm({ id: undefined, studentId: payload.studentId, name: '', relation: '', contactNumber: '', email: '', address: '' });
      setEditing(false);
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (g: Guardian) => {
    setForm({ ...g });
    setEditing(true);
  };

  const onDelete = async (id: number) => {
    if (!confirm('Delete this guardian?')) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/api/studentguardians', { method: 'DELETE', body: JSON.stringify({ id }) });
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e: any) {
      setError(e?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Student Guardians</h1>
        <Link className="text-sm text-blue-600 hover:underline" href="/student/student">Back to Students</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Student</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={form.studentId !== undefined && form.studentId !== null ? String(form.studentId) : ''}
            onChange={(e) => setForm(f => ({ ...f, studentId: e.target.value ? Number(e.target.value) : undefined }))}
          >
            <option value="">-- Select student --</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.studentNo ? `${s.studentNo} - ` : ''}{s.firstName}{s.lastName ? ` ${s.lastName}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input className="w-full border rounded px-3 py-2" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Relation</label>
          <input className="w-full border rounded px-3 py-2" value={form.relation || ''} onChange={e => setForm(f => ({ ...f, relation: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contact Number</label>
          <input className="w-full border rounded px-3 py-2" value={form.contactNumber || ''} onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input className="w-full border rounded px-3 py-2" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <input className="w-full border rounded px-3 py-2" value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        </div>
        <div className="flex items-end gap-3">
          <button onClick={upsert} className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
            {editing ? 'Update' : 'Add'}
          </button>
          {editing && (
            <button onClick={() => { setEditing(false); setForm({ id: undefined, studentId: undefined, name: '', relation: '', contactNumber: '', email: '', address: '' }); }} className="px-4 py-2 rounded border">
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select
          className="border rounded px-3 py-2"
          value={filter.studentId}
          onChange={e => setFilter(f => ({ ...f, studentId: e.target.value }))}
        >
          <option value="">All students</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>
              {s.studentNo ? `${s.studentNo} - ` : ''}{s.firstName}{s.lastName ? ` ${s.lastName}` : ''}
            </option>
          ))}
        </select>
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Search guardians..."
          value={filter.q}
          onChange={e => setFilter(f => ({ ...f, q: e.target.value }))}
        />
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border-b">ID</th>
              <th className="text-left p-2 border-b">Student</th>
              <th className="text-left p-2 border-b">Name</th>
              <th className="text-left p-2 border-b">Relation</th>
              <th className="text-left p-2 border-b">Contact</th>
              <th className="text-left p-2 border-b">Email</th>
              <th className="text-left p-2 border-b">Address</th>
              <th className="text-left p-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(g => {
              const st = students.find(s => s.id === g.studentId);
              return (
                <tr key={g.id} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border-b">{g.id}</td>
                  <td className="p-2 border-b">{st ? (st.studentNo ? `${st.studentNo} - ` : '') + st.firstName + (st.lastName ? ` ${st.lastName}` : '') : g.studentId}</td>
                  <td className="p-2 border-b">{g.name}</td>
                  <td className="p-2 border-b">{g.relation || ''}</td>
                  <td className="p-2 border-b">{g.contactNumber || ''}</td>
                  <td className="p-2 border-b">{g.email || ''}</td>
                  <td className="p-2 border-b">{g.address || ''}</td>
                  <td className="p-2 border-b">
                    <div className="flex gap-2">
                      <button className="text-blue-600" onClick={() => onEdit(g)}>Edit</button>
                      <button className="text-red-600" onClick={() => onDelete(g.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {loading && <div className="text-sm text-gray-600">Working...</div>}
    </div>
  );
}
