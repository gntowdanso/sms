"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

type Student = { id: number; studentNo?: string | null; firstName: string; lastName?: string | null };

type ReportCard = { id: number; studentId: number; overallGrade?: string | null; totalMarks?: number | null; averageMarks?: number | null; position?: number | null; remarks?: string | null; teacherRemark?: string | null; principalRemark?: string | null; academicYearId: number; termId: number };

export default function ReportCardsPage() {
  const [items, setItems] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ studentId: '', overallGrade: '', totalMarks: '', averageMarks: '', position: '', remarks: '', teacherRemark: '', principalRemark: '', academicYearId: '', termId: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [rcRes, stRes, yrRes, trRes] = await Promise.all([
          apiFetch('/api/reportcards'),
          apiFetch('/api/students'),
          apiFetch('/api/academicyears'),
          apiFetch('/api/terms'),
        ]);
        const [rcs, sts, yrs, trs] = await Promise.all([
          rcRes.json().catch(() => []),
          stRes.json().catch(() => []),
          yrRes.json().catch(() => []),
          trRes.json().catch(() => []),
        ]);
        setItems(Array.isArray(rcs) ? rcs : []);
        setStudents(Array.isArray(sts) ? sts : []);
        setYears(Array.isArray(yrs) ? yrs : []);
        setTerms(Array.isArray(trs) ? trs : []);
      } finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => items, [items]);

  const reset = () => setForm({ studentId: '', overallGrade: '', totalMarks: '', averageMarks: '', position: '', remarks: '', teacherRemark: '', principalRemark: '', academicYearId: '', termId: '' });

  const submit = async () => {
    setLoading(true);
    try {
      const payload: any = {
        studentId: form.studentId ? Number(form.studentId) : undefined,
        overallGrade: form.overallGrade?.trim() || null,
        totalMarks: form.totalMarks !== '' ? Number(form.totalMarks) : null,
        averageMarks: form.averageMarks !== '' ? Number(form.averageMarks) : null,
        position: form.position !== '' ? Number(form.position) : null,
        remarks: form.remarks?.trim() || null,
        teacherRemark: form.teacherRemark?.trim() || null,
        principalRemark: form.principalRemark?.trim() || null,
        academicYearId: form.academicYearId ? Number(form.academicYearId) : undefined,
        termId: form.termId ? Number(form.termId) : undefined,
      };
      if (!payload.studentId || !payload.academicYearId || !payload.termId) { setLoading(false); return; }
      if (editingId) {
        const res = await apiFetch('/api/reportcards', { method: 'PUT', body: JSON.stringify({ id: editingId, ...payload }) });
        const up = await res.json().catch(() => null);
        if (res.ok && up) setItems(prev => prev.map(i => i.id === up.id ? up : i));
      } else {
        const res = await apiFetch('/api/reportcards', { method: 'POST', body: JSON.stringify(payload) });
        const created = await res.json().catch(() => null);
        if (res.ok && created) setItems(prev => [created, ...prev]);
      }
      setEditingId(null);
      reset();
    } finally { setLoading(false); }
  };

  const edit = (it: ReportCard) => {
    setEditingId(it.id);
    setForm({ studentId: String(it.studentId), overallGrade: it.overallGrade ?? '', totalMarks: it.totalMarks ?? '', averageMarks: it.averageMarks ?? '', position: it.position ?? '', remarks: it.remarks ?? '', teacherRemark: it.teacherRemark ?? '', principalRemark: it.principalRemark ?? '', academicYearId: String(it.academicYearId), termId: String(it.termId) });
  };

  const remove = async (id: number) => {
    if (!confirm('Delete report card?')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/reportcards', { method: 'DELETE', body: JSON.stringify({ id }) });
      if (res.ok) setItems(prev => prev.filter(i => i.id !== id));
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Report Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded border mb-4">
          <select className="border p-2 rounded" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
            <option value="">Student</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.studentNo ? `${s.studentNo} - ` : ''}{s.firstName}{s.lastName ? ` ${s.lastName}` : ''}</option>)}
          </select>
          <input className="border p-2 rounded" placeholder="Overall Grade" value={form.overallGrade} onChange={e => setForm({ ...form, overallGrade: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Total Marks" type="number" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Average Marks" type="number" value={form.averageMarks} onChange={e => setForm({ ...form, averageMarks: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Position" type="number" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Remarks" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Teacher Remark" value={form.teacherRemark} onChange={e => setForm({ ...form, teacherRemark: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Principal Remark" value={form.principalRemark} onChange={e => setForm({ ...form, principalRemark: e.target.value })} />
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
                <th className="p-2 border">Overall</th>
                <th className="p-2 border">Avg</th>
                <th className="p-2 border">Position</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it, idx) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx + 1}</td>
                  <td className="p-2 border">{it.studentId}</td>
                  <td className="p-2 border">{it.overallGrade ?? ''}</td>
                  <td className="p-2 border">{it.averageMarks ?? ''}</td>
                  <td className="p-2 border">{it.position ?? ''}</td>
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
