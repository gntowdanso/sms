"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

type Student = { id: number; studentNo?: string | null; firstName: string; lastName?: string | null };
type Option = { id: number; name: string };

type Attendance = { id: number; username: string; studentId: number; classId: number; date: string; status: string; teacherId: number; academicYearId: number; termId: number };

export default function AttendancePage() {
  const [items, setItems] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [form, setForm] = useState<any>({ studentId: '', classId: '', date: '', status: 'PRESENT', teacherId: '', academicYearId: '', termId: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [teachers, setTeachers] = useState<Option[]>([]);
  const [years, setYears] = useState<Option[]>([]);
  const [terms, setTerms] = useState<Option[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [attRes, stuRes, clsRes, stfRes, yrRes, trRes] = await Promise.all([
          apiFetch('/api/attendances'),
          apiFetch('/api/students'),
          apiFetch('/api/classes'),
          apiFetch('/api/staff'),
          apiFetch('/api/academicyears'),
          apiFetch('/api/terms'),
        ]);
        const [atts, stus, cls, stf, yrs, trs] = await Promise.all([
          attRes.json().catch(() => []),
          stuRes.json().catch(() => []),
          clsRes.json().catch(() => []),
          stfRes.json().catch(() => []),
          yrRes.json().catch(() => []),
          trRes.json().catch(() => []),
        ]);
        setItems(Array.isArray(atts) ? atts : []);
        setStudents(Array.isArray(stus) ? stus : []);
        setClasses(Array.isArray(cls) ? cls : []);
        setTeachers(Array.isArray(stf) ? stf : []);
        setYears(Array.isArray(yrs) ? yrs : []);
        setTerms(Array.isArray(trs) ? trs : []);
      } finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => items, [items]);

  const reset = () => setForm({ studentId: '', classId: '', date: '', status: 'PRESENT', teacherId: '', academicYearId: '', termId: '' });

  const submit = async () => {
    setLoading(true);
    try {
      const payload: any = {
        studentId: form.studentId ? Number(form.studentId) : undefined,
        classId: form.classId ? Number(form.classId) : undefined,
        date: form.date,
        status: form.status,
        teacherId: form.teacherId ? Number(form.teacherId) : undefined,
        academicYearId: form.academicYearId ? Number(form.academicYearId) : undefined,
        termId: form.termId ? Number(form.termId) : undefined,
      };
      if (!payload.studentId || !payload.classId || !payload.date || !payload.status || !payload.teacherId || !payload.academicYearId || !payload.termId) { setLoading(false); return; }
      if (editingId) {
        const res = await apiFetch('/api/attendances', { method: 'PUT', body: JSON.stringify({ id: editingId, ...payload }) });
        const up = await res.json().catch(() => null);
        if (res.ok && up) setItems(prev => prev.map(i => i.id === up.id ? up : i));
      } else {
        const res = await apiFetch('/api/attendances', { method: 'POST', body: JSON.stringify(payload) });
        const created = await res.json().catch(() => null);
        if (res.ok && created) setItems(prev => [created, ...prev]);
      }
      setEditingId(null);
      reset();
    } finally { setLoading(false); }
  };

  const edit = (it: Attendance) => {
    setEditingId(it.id);
    setForm({ studentId: String(it.studentId), classId: String(it.classId), date: String(it.date).substring(0, 10), status: it.status, teacherId: String(it.teacherId), academicYearId: String(it.academicYearId), termId: String(it.termId) });
  };

  const remove = async (id: number) => {
    if (!confirm('Delete attendance record?')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/attendances', { method: 'DELETE', body: JSON.stringify({ id }) });
      if (res.ok) setItems(prev => prev.filter(i => i.id !== id));
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Attendance</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded border mb-4">
          <select className="border p-2 rounded" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
            <option value="">Student</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.studentNo ? `${s.studentNo} - ` : ''}{s.firstName}{s.lastName ? ` ${s.lastName}` : ''}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })}>
            <option value="">Class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="border p-2 rounded" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <select className="border p-2 rounded" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="PRESENT">PRESENT</option>
            <option value="ABSENT">ABSENT</option>
            <option value="LATE">LATE</option>
            <option value="EXCUSED">EXCUSED</option>
          </select>
          <select className="border p-2 rounded" value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })}>
            <option value="">Teacher</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
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
                <th className="p-2 border">Class</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it, idx) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx + 1}</td>
                  <td className="p-2 border">{it.studentId}</td>
                  <td className="p-2 border">{it.classId}</td>
                  <td className="p-2 border">{String(it.date).substring(0, 10)}</td>
                  <td className="p-2 border">{it.status}</td>
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
