"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

type Option = { id: number; name: string };
type AssessmentLite = { id: number; title?: string | null };

type ExamPaper = { id: number; username: string; assessmentId: number; subjectId: number; teacherId: number; maxMarks: number; academicYearId: number; termId: number };

export default function ExamPapersPage() {
  const [items, setItems] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [form, setForm] = useState<any>({ assessmentId: '', subjectId: '', teacherId: '', maxMarks: '', academicYearId: '', termId: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  const [assessments, setAssessments] = useState<AssessmentLite[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [teachers, setTeachers] = useState<Option[]>([]);
  const [years, setYears] = useState<Option[]>([]);
  const [terms, setTerms] = useState<Option[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [epRes, asRes, subRes, stfRes, yrRes, trRes] = await Promise.all([
          apiFetch('/api/exampapers'),
          apiFetch('/api/assessments'),
          apiFetch('/api/subjects'),
          apiFetch('/api/staff'),
          apiFetch('/api/academicyears'),
          apiFetch('/api/terms'),
        ]);
        const [eps, ass, subs, stf, yrs, trs] = await Promise.all([
          epRes.json().catch(() => []),
          asRes.json().catch(() => []),
          subRes.json().catch(() => []),
          stfRes.json().catch(() => []),
          yrRes.json().catch(() => []),
          trRes.json().catch(() => []),
        ]);
        setItems(Array.isArray(eps) ? eps : []);
        setAssessments(Array.isArray(ass) ? ass : []);
        setSubjects(Array.isArray(subs) ? subs : []);
        setTeachers(Array.isArray(stf) ? stf : []);
        setYears(Array.isArray(yrs) ? yrs : []);
        setTerms(Array.isArray(trs) ? trs : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => items, [items]);

  const reset = () => setForm({ assessmentId: '', subjectId: '', teacherId: '', maxMarks: '', academicYearId: '', termId: '' });

  const submit = async () => {
    setLoading(true);
    try {
      const payload: any = {
        assessmentId: form.assessmentId ? Number(form.assessmentId) : undefined,
        subjectId: form.subjectId ? Number(form.subjectId) : undefined,
        teacherId: form.teacherId ? Number(form.teacherId) : undefined,
        maxMarks: form.maxMarks !== '' ? Number(form.maxMarks) : undefined,
        academicYearId: form.academicYearId ? Number(form.academicYearId) : undefined,
        termId: form.termId ? Number(form.termId) : undefined,
      };
      if (!payload.assessmentId || !payload.subjectId || !payload.teacherId || payload.maxMarks === undefined || !payload.academicYearId || !payload.termId) { setLoading(false); return; }
      if (editingId) {
        const res = await apiFetch('/api/exampapers', { method: 'PUT', body: JSON.stringify({ id: editingId, ...payload }) });
        const up = await res.json().catch(() => null);
        if (res.ok && up) setItems(prev => prev.map(i => i.id === up.id ? up : i));
      } else {
        const res = await apiFetch('/api/exampapers', { method: 'POST', body: JSON.stringify(payload) });
        const created = await res.json().catch(() => null);
        if (res.ok && created) setItems(prev => [created, ...prev]);
      }
      setEditingId(null);
      reset();
    } finally { setLoading(false); }
  };

  const edit = (it: ExamPaper) => {
    setEditingId(it.id);
    setForm({ assessmentId: String(it.assessmentId), subjectId: String(it.subjectId), teacherId: String(it.teacherId), maxMarks: String(it.maxMarks), academicYearId: String(it.academicYearId), termId: String(it.termId) });
  };

  const remove = async (id: number) => {
    if (!confirm('Delete exam paper?')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/exampapers', { method: 'DELETE', body: JSON.stringify({ id }) });
      if (res.ok) setItems(prev => prev.filter(i => i.id !== id));
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Exam Papers</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded border mb-4">
          <select className="border p-2 rounded" value={form.assessmentId} onChange={e => setForm({ ...form, assessmentId: e.target.value })}>
            <option value="">Assessment</option>
            {assessments.map(a => <option key={a.id} value={a.id}>{a.title ?? `Assessment #${a.id}`}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}>
            <option value="">Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })}>
            <option value="">Teacher</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input className="border p-2 rounded" placeholder="Max marks" type="number" value={form.maxMarks} onChange={e => setForm({ ...form, maxMarks: e.target.value })} />
          <select className="border p-2 rounded" value={form.academicYearId} onChange={e => setForm({ ...form, academicYearId: e.target.value })}>
            <option value="">Year</option>
            {years.map(y => <option key={y.id} value={y.id}>{y.name ?? (y as any).yearName ?? y.id}</option>)}
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
        <div className="flex items-center mb-2"><input className="border p-2 rounded" placeholder="Search (simple)" value={q} onChange={e => setQ(e.target.value)} /></div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse bg-white">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">#</th>
                <th className="p-2 border">Assessment</th>
                <th className="p-2 border">Subject</th>
                <th className="p-2 border">Teacher</th>
                <th className="p-2 border">Max</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it, idx) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx + 1}</td>
                  <td className="p-2 border">{it.assessmentId}</td>
                  <td className="p-2 border">{it.subjectId}</td>
                  <td className="p-2 border">{it.teacherId}</td>
                  <td className="p-2 border">{it.maxMarks}</td>
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
