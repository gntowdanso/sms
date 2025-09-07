"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

type Student = { id: number; studentNo?: string | null; firstName: string; lastName?: string | null };
type AssignmentLite = { id: number; title: string };

type Submission = { id: number; username: string; assignmentId: number; studentId: number; submittedDate: string; fileUrl?: string | null; marks?: number | null; feedback?: string | null; academicYearId: number; termId: number };

export default function AssignmentSubmissionsPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [form, setForm] = useState<any>({ assignmentId: '', studentId: '', submittedDate: '', fileUrl: '', marks: '', feedback: '', academicYearId: '', termId: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  const [assignments, setAssignments] = useState<AssignmentLite[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [sbRes, asRes, stRes, yrRes, trRes] = await Promise.all([
          apiFetch('/api/assignmentsubmissions'),
          apiFetch('/api/assignments'),
          apiFetch('/api/students'),
          apiFetch('/api/academicyears'),
          apiFetch('/api/terms'),
        ]);
        const [subs, ass, sts, yrs, trs] = await Promise.all([
          sbRes.json().catch(() => []),
          asRes.json().catch(() => []),
          stRes.json().catch(() => []),
          yrRes.json().catch(() => []),
          trRes.json().catch(() => []),
        ]);
        setItems(Array.isArray(subs) ? subs : []);
        setAssignments(Array.isArray(ass) ? ass : []);
        setStudents(Array.isArray(sts) ? sts : []);
        setYears(Array.isArray(yrs) ? yrs : []);
        setTerms(Array.isArray(trs) ? trs : []);
      } finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => items, [items]);

  const reset = () => setForm({ assignmentId: '', studentId: '', submittedDate: '', fileUrl: '', marks: '', feedback: '', academicYearId: '', termId: '' });

  const submit = async () => {
    setLoading(true);
    try {
      const payload: any = {
        assignmentId: form.assignmentId ? Number(form.assignmentId) : undefined,
        studentId: form.studentId ? Number(form.studentId) : undefined,
        submittedDate: form.submittedDate,
        fileUrl: form.fileUrl?.trim() || null,
        marks: form.marks !== '' ? Number(form.marks) : null,
        feedback: form.feedback?.trim() || null,
        academicYearId: form.academicYearId ? Number(form.academicYearId) : undefined,
        termId: form.termId ? Number(form.termId) : undefined,
      };
      if (!payload.assignmentId || !payload.studentId || !payload.submittedDate || !payload.academicYearId || !payload.termId) { setLoading(false); return; }
      if (editingId) {
        const res = await apiFetch('/api/assignmentsubmissions', { method: 'PUT', body: JSON.stringify({ id: editingId, ...payload }) });
        const up = await res.json().catch(() => null);
        if (res.ok && up) setItems(prev => prev.map(i => i.id === up.id ? up : i));
      } else {
        const res = await apiFetch('/api/assignmentsubmissions', { method: 'POST', body: JSON.stringify(payload) });
        const created = await res.json().catch(() => null);
        if (res.ok && created) setItems(prev => [created, ...prev]);
      }
      setEditingId(null);
      reset();
    } finally { setLoading(false); }
  };

  const edit = (it: Submission) => {
    setEditingId(it.id);
    setForm({ assignmentId: String(it.assignmentId), studentId: String(it.studentId), submittedDate: String(it.submittedDate).substring(0, 10), fileUrl: it.fileUrl ?? '', marks: it.marks ?? '', feedback: it.feedback ?? '', academicYearId: String(it.academicYearId), termId: String(it.termId) });
  };

  const remove = async (id: number) => {
    if (!confirm('Delete submission?')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/assignmentsubmissions', { method: 'DELETE', body: JSON.stringify({ id }) });
      if (res.ok) setItems(prev => prev.filter(i => i.id !== id));
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Assignment Submissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded border mb-4">
          <select className="border p-2 rounded" value={form.assignmentId} onChange={e => setForm({ ...form, assignmentId: e.target.value })}>
            <option value="">Assignment</option>
            {assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
            <option value="">Student</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.studentNo ? `${s.studentNo} - ` : ''}{s.firstName}{s.lastName ? ` ${s.lastName}` : ''}</option>)}
          </select>
          <input className="border p-2 rounded" type="date" value={form.submittedDate} onChange={e => setForm({ ...form, submittedDate: e.target.value })} />
          <input className="border p-2 rounded" placeholder="File URL" value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Marks" type="number" value={form.marks} onChange={e => setForm({ ...form, marks: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Feedback" value={form.feedback} onChange={e => setForm({ ...form, feedback: e.target.value })} />
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
                <th className="p-2 border">Assignment</th>
                <th className="p-2 border">Student</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Marks</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it, idx) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx + 1}</td>
                  <td className="p-2 border">{it.assignmentId}</td>
                  <td className="p-2 border">{it.studentId}</td>
                  <td className="p-2 border">{String(it.submittedDate).substring(0, 10)}</td>
                  <td className="p-2 border">{it.marks ?? ''}</td>
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
