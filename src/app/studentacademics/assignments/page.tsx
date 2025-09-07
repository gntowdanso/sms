"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

type Option = { id: number; name: string };

type Assignment = { id: number; username: string; title: string; description?: string | null; classId: number; subjectId: number; teacherId: number; dueDate: string; academicYearId: number; termId: number };

export default function AssignmentsPage() {
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [form, setForm] = useState<any>({ title: '', description: '', classId: '', subjectId: '', teacherId: '', dueDate: '', academicYearId: '', termId: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  const [classes, setClasses] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [teachers, setTeachers] = useState<Option[]>([]);
  const [years, setYears] = useState<Option[]>([]);
  const [terms, setTerms] = useState<Option[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [asRes, clsRes, subRes, stfRes, yrRes, trRes] = await Promise.all([
          apiFetch('/api/assignments'),
          apiFetch('/api/classes'),
          apiFetch('/api/subjects'),
          apiFetch('/api/staff'),
          apiFetch('/api/academicyears'),
          apiFetch('/api/terms'),
        ]);
        const [ass, cls, sub, stf, yrs, trs] = await Promise.all([
          asRes.json().catch(() => []),
          clsRes.json().catch(() => []),
          subRes.json().catch(() => []),
          stfRes.json().catch(() => []),
          yrRes.json().catch(() => []),
          trRes.json().catch(() => []),
        ]);
        setItems(Array.isArray(ass) ? ass : []);
        setClasses(Array.isArray(cls) ? cls : []);
        setSubjects(Array.isArray(sub) ? sub : []);
        setTeachers(Array.isArray(stf) ? stf : []);
        setYears(Array.isArray(yrs) ? yrs : []);
        setTerms(Array.isArray(trs) ? trs : []);
      } finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!q) return items;
    const s = q.toLowerCase();
    return items.filter(it => it.title.toLowerCase().includes(s) || (it.description ?? '').toLowerCase().includes(s));
  }, [items, q]);

  const reset = () => setForm({ title: '', description: '', classId: '', subjectId: '', teacherId: '', dueDate: '', academicYearId: '', termId: '' });

  const submit = async () => {
    setLoading(true);
    try {
      const payload: any = {
        title: form.title?.trim(),
        description: form.description?.trim() || null,
        classId: form.classId ? Number(form.classId) : undefined,
        subjectId: form.subjectId ? Number(form.subjectId) : undefined,
        teacherId: form.teacherId ? Number(form.teacherId) : undefined,
        dueDate: form.dueDate,
        academicYearId: form.academicYearId ? Number(form.academicYearId) : undefined,
        termId: form.termId ? Number(form.termId) : undefined,
      };
      if (!payload.title || !payload.classId || !payload.subjectId || !payload.teacherId || !payload.dueDate || !payload.academicYearId || !payload.termId) { setLoading(false); return; }
      if (editingId) {
        const res = await apiFetch('/api/assignments', { method: 'PUT', body: JSON.stringify({ id: editingId, ...payload }) });
        const up = await res.json().catch(() => null);
        if (res.ok && up) setItems(prev => prev.map(i => i.id === up.id ? up : i));
      } else {
        const res = await apiFetch('/api/assignments', { method: 'POST', body: JSON.stringify(payload) });
        const created = await res.json().catch(() => null);
        if (res.ok && created) setItems(prev => [created, ...prev]);
      }
      setEditingId(null);
      reset();
    } finally { setLoading(false); }
  };

  const edit = (it: Assignment) => {
    setEditingId(it.id);
    setForm({ title: it.title, description: it.description ?? '', classId: String(it.classId), subjectId: String(it.subjectId), teacherId: String(it.teacherId), dueDate: String(it.dueDate).substring(0, 10), academicYearId: String(it.academicYearId), termId: String(it.termId) });
  };

  const remove = async (id: number) => {
    if (!confirm('Delete assignment?')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/assignments', { method: 'DELETE', body: JSON.stringify({ id }) });
      if (res.ok) setItems(prev => prev.filter(i => i.id !== id));
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Assignments</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded border mb-4">
          <input className="border p-2 rounded" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <select className="border p-2 rounded" value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })}>
            <option value="">Class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}>
            <option value="">Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })}>
            <option value="">Teacher</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input className="border p-2 rounded" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          <select className="border p-2 rounded" value={form.academicYearId} onChange={e => setForm({ ...form, academicYearId: e.target.value })}>
            <option value="">Year</option>
            {years.map(y => <option key={y.id} value={y.id}>{(y as any).yearName ?? y.name}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.termId} onChange={e => setForm({ ...form, termId: e.target.value })}>
            <option value="">Term</option>
            {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submit}>{editingId ? 'Update' : 'Add'}</button>
            {editingId && <button className="border px-4 py-2 rounded" onClick={() => { setEditingId(null); reset(); }}>Cancel</button>}
          </div>
        </div>
        <div className="flex items-center mb-2"><input className="border p-2 rounded" placeholder="Search" value={q} onChange={e => setQ(e.target.value)} /></div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse bg-white">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">#</th>
                <th className="p-2 border">Title</th>
                <th className="p-2 border">Due</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it, idx) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx + 1}</td>
                  <td className="p-2 border">{it.title}</td>
                  <td className="p-2 border">{String(it.dueDate).substring(0, 10)}</td>
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
      </main>
    </div>
  );
}
