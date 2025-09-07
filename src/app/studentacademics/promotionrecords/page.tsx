"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

type PromotionRecord = { id: number; studentId: number; fromClassId: number; toClassId: number; promotionDate: string; academicYearId: number; termId: number };

export default function PromotionRecordsPage() {
  const [items, setItems] = useState<PromotionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ studentId: '', fromClassId: '', toClassId: '', promotionDate: '', academicYearId: '', termId: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [prRes, stRes, clRes, yrRes, trRes] = await Promise.all([
          apiFetch('/api/promotionrecords'),
          apiFetch('/api/students'),
          apiFetch('/api/classes'),
          apiFetch('/api/academicyears'),
          apiFetch('/api/terms'),
        ]);
        const [prs, sts, cls, yrs, trs] = await Promise.all([
          prRes.json().catch(() => []),
          stRes.json().catch(() => []),
          clRes.json().catch(() => []),
          yrRes.json().catch(() => []),
          trRes.json().catch(() => []),
        ]);
        setItems(Array.isArray(prs) ? prs : []);
        setStudents(Array.isArray(sts) ? sts : []);
        setClasses(Array.isArray(cls) ? cls : []);
        setYears(Array.isArray(yrs) ? yrs : []);
        setTerms(Array.isArray(trs) ? trs : []);
      } finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => items, [items]);

  const reset = () => setForm({ studentId: '', fromClassId: '', toClassId: '', promotionDate: '', academicYearId: '', termId: '' });

  const submit = async () => {
    setLoading(true);
    try {
      const payload: any = {
        studentId: form.studentId ? Number(form.studentId) : undefined,
        fromClassId: form.fromClassId ? Number(form.fromClassId) : undefined,
        toClassId: form.toClassId ? Number(form.toClassId) : undefined,
        promotionDate: form.promotionDate ? new Date(form.promotionDate).toISOString() : undefined,
        academicYearId: form.academicYearId ? Number(form.academicYearId) : undefined,
        termId: form.termId ? Number(form.termId) : undefined,
      };
      if (!payload.studentId || !payload.fromClassId || !payload.toClassId || !payload.promotionDate || !payload.academicYearId || !payload.termId) { setLoading(false); return; }
      if (editingId) {
        const res = await apiFetch('/api/promotionrecords', { method: 'PUT', body: JSON.stringify({ id: editingId, ...payload }) });
        const up = await res.json().catch(() => null);
        if (res.ok && up) setItems(prev => prev.map(i => i.id === up.id ? up : i));
      } else {
        const res = await apiFetch('/api/promotionrecords', { method: 'POST', body: JSON.stringify(payload) });
        const created = await res.json().catch(() => null);
        if (res.ok && created) setItems(prev => [created, ...prev]);
      }
      setEditingId(null);
      reset();
    } finally { setLoading(false); }
  };

  const edit = (it: PromotionRecord) => {
    setEditingId(it.id);
    setForm({ studentId: String(it.studentId), fromClassId: String(it.fromClassId), toClassId: String(it.toClassId), promotionDate: it.promotionDate?.slice(0,10) ?? '', academicYearId: String(it.academicYearId), termId: String(it.termId) });
  };

  const remove = async (id: number) => {
    if (!confirm('Delete promotion record?')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/promotionrecords', { method: 'DELETE', body: JSON.stringify({ id }) });
      if (res.ok) setItems(prev => prev.filter(i => i.id !== id));
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Promotion Records</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded border mb-4">
          <select className="border p-2 rounded" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
            <option value="">Student</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.studentNo ? `${s.studentNo} - ` : ''}{s.firstName}{s.lastName ? ` ${s.lastName}` : ''}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.fromClassId} onChange={e => setForm({ ...form, fromClassId: e.target.value })}>
            <option value="">From Class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name ?? `Class #${c.id}`}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.toClassId} onChange={e => setForm({ ...form, toClassId: e.target.value })}>
            <option value="">To Class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name ?? `Class #${c.id}`}</option>)}
          </select>
          <input className="border p-2 rounded" type="date" value={form.promotionDate} onChange={e => setForm({ ...form, promotionDate: e.target.value })} />
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
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse bg-white">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">#</th>
                <th className="p-2 border">Student</th>
                <th className="p-2 border">From</th>
                <th className="p-2 border">To</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it, idx) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx + 1}</td>
                  <td className="p-2 border">{it.studentId}</td>
                  <td className="p-2 border">{it.fromClassId}</td>
                  <td className="p-2 border">{it.toClassId}</td>
                  <td className="p-2 border">{new Date(it.promotionDate).toLocaleDateString()}</td>
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
