"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

type Option = { id: number; name: string };
type AssessmentTypeLite = { id: number; name: string };
type AcademicYearLite = { id: number; yearName: string };
type TermLite = { id: number; name: string };

type Assessment = { id: number; username: string; title?: string | null; description?: string | null; date?: string | null; classId?: number | null; subjectId?: number | null; teacherId?: number | null; assessmentTypeId: number; academicYearId: number; termId: number; assessmentType?: AssessmentTypeLite };

export default function AssessmentsPage() {
  const [items, setItems] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [form, setForm] = useState<any>({ title: '', description: '', date: '', classId: '', subjectId: '', teacherId: '', assessmentTypeId: '', academicYearId: '', termId: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  // lookups
  const [classes, setClasses] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [teachers, setTeachers] = useState<Option[]>([]);
  const [types, setTypes] = useState<AssessmentTypeLite[]>([]);
  const [years, setYears] = useState<AcademicYearLite[]>([]);
  const [terms, setTerms] = useState<TermLite[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [assRes, clsRes, subRes, stfRes, typRes, yrRes, trRes] = await Promise.all([
          apiFetch('/api/assessments'),
          apiFetch('/api/classes'),
          apiFetch('/api/subjects'),
          apiFetch('/api/staff'),
          apiFetch('/api/assessmenttypes'),
          apiFetch('/api/academicyears'),
          apiFetch('/api/terms'),
        ]);
        const [ass, cls, sub, stf, typ, yrs, trs] = await Promise.all([
          assRes.json().catch(() => []),
          clsRes.json().catch(() => []),
          subRes.json().catch(() => []),
          stfRes.json().catch(() => []),
          typRes.json().catch(() => []),
          yrRes.json().catch(() => []),
          trRes.json().catch(() => []),
        ]);
        setItems(Array.isArray(ass) ? ass : []);
        setClasses(Array.isArray(cls) ? cls : []);
        setSubjects(Array.isArray(sub) ? sub : []);
        setTeachers(Array.isArray(stf) ? stf : []);
        setTypes(Array.isArray(typ) ? typ : []);
        setYears(Array.isArray(yrs) ? yrs : []);
        setTerms(Array.isArray(trs) ? trs : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!q) return items;
    const s = q.toLowerCase();
    return items.filter(it => (it.title ?? '').toLowerCase().includes(s) || (it.description ?? '').toLowerCase().includes(s));
  }, [items, q]);

  const reset = () => setForm({ title: '', description: '', date: '', classId: '', subjectId: '', teacherId: '', assessmentTypeId: '', academicYearId: '', termId: '' });

  const submit = async () => {
    setLoading(true);
    try {
      const payload: any = {
        title: form.title?.trim() || null,
        description: form.description?.trim() || null,
        date: form.date || null,
        classId: form.classId ? Number(form.classId) : null,
        subjectId: form.subjectId ? Number(form.subjectId) : null,
        teacherId: form.teacherId ? Number(form.teacherId) : null,
        assessmentTypeId: form.assessmentTypeId ? Number(form.assessmentTypeId) : undefined,
        academicYearId: form.academicYearId ? Number(form.academicYearId) : undefined,
        termId: form.termId ? Number(form.termId) : undefined,
      };
      if (!payload.assessmentTypeId || !payload.academicYearId || !payload.termId) { setLoading(false); return; }
      if (editingId) {
        const res = await apiFetch('/api/assessments', { method: 'PUT', body: JSON.stringify({ id: editingId, ...payload }) });
        const up = await res.json().catch(() => null);
        if (res.ok && up) setItems(prev => prev.map(i => i.id === up.id ? up : i));
      } else {
        const res = await apiFetch('/api/assessments', { method: 'POST', body: JSON.stringify(payload) });
        const created = await res.json().catch(() => null);
        if (res.ok && created) setItems(prev => [created, ...prev]);
      }
      setEditingId(null);
      reset();
    } finally {
      setLoading(false);
    }
  };

  const edit = (it: Assessment) => {
    setEditingId(it.id);
    setForm({
      title: it.title ?? '',
      description: it.description ?? '',
      date: it.date ? String(it.date).substring(0, 10) : '',
      classId: it.classId ? String(it.classId) : '',
      subjectId: it.subjectId ? String(it.subjectId) : '',
      teacherId: it.teacherId ? String(it.teacherId) : '',
      assessmentTypeId: String(it.assessmentTypeId),
      academicYearId: String(it.academicYearId),
      termId: String(it.termId),
    });
  };

  const remove = async (id: number) => {
    if (!confirm('Delete assessment?')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/assessments', { method: 'DELETE', body: JSON.stringify({ id }) });
      if (res.ok) setItems(prev => prev.filter(i => i.id !== id));
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Assessments</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded border mb-4">
          <input className="border p-2 rounded" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <input className="border p-2 rounded" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <select className="border p-2 rounded" value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })}>
            <option value="">Class (optional)</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}>
            <option value="">Subject (optional)</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })}>
            <option value="">Teacher (optional)</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.assessmentTypeId} onChange={e => setForm({ ...form, assessmentTypeId: e.target.value })}>
            <option value="">Assessment type</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.academicYearId} onChange={e => setForm({ ...form, academicYearId: e.target.value })}>
            <option value="">Year</option>
            {years.map(y => <option key={y.id} value={y.id}>{y.yearName}</option>)}
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
                <th className="p-2 border">Type</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it, idx) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx + 1}</td>
                  <td className="p-2 border">{it.title ?? ''}</td>
                  <td className="p-2 border">{it.assessmentType?.name ?? it.assessmentTypeId}</td>
                  <td className="p-2 border">{it.date ? String(it.date).substring(0, 10) : ''}</td>
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
