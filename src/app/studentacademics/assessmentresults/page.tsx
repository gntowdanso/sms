"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

type Option = { id: number; name: string };
type AssessmentLite = { id: number; title?: string | null };
type ExamPaperLite = { id: number; maxMarks: number };
type Student = { id: number; studentNo?: string | null; firstName: string; lastName?: string | null };
type GradeLite = { id: number; grade: string };

type AssessmentResult = { id: number; username: string; assessmentId: number; examPaperId?: number | null; studentId: number; marksObtained?: number | null; gradeId?: number | null; remarks?: string | null; academicYearId: number; termId: number };

export default function AssessmentResultsPage() {
  const [items, setItems] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [form, setForm] = useState<any>({ assessmentId: '', examPaperId: '', studentId: '', marksObtained: '', gradeId: '', remarks: '', academicYearId: '', termId: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  const [assessments, setAssessments] = useState<AssessmentLite[]>([]);
  const [exams, setExams] = useState<ExamPaperLite[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<GradeLite[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [arRes, asRes, epRes, stRes, grRes, yrRes, trRes] = await Promise.all([
          apiFetch('/api/assessmentresults'),
          apiFetch('/api/assessments'),
          apiFetch('/api/exampapers'),
          apiFetch('/api/students'),
          apiFetch('/api/gradingschemes'),
          apiFetch('/api/academicyears'),
          apiFetch('/api/terms'),
        ]);
        const [ars, ass, eps, sts, grs, yrs, trs] = await Promise.all([
          arRes.json().catch(() => []),
          asRes.json().catch(() => []),
          epRes.json().catch(() => []),
          stRes.json().catch(() => []),
          grRes.json().catch(() => []),
          yrRes.json().catch(() => []),
          trRes.json().catch(() => []),
        ]);
        setItems(Array.isArray(ars) ? ars : []);
        setAssessments(Array.isArray(ass) ? ass : []);
        setExams(Array.isArray(eps) ? eps : []);
        setStudents(Array.isArray(sts) ? sts : []);
        setGrades(Array.isArray(grs) ? grs : []);
        setYears(Array.isArray(yrs) ? yrs : []);
        setTerms(Array.isArray(trs) ? trs : []);
      } finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => items, [items]);

  const reset = () => setForm({ assessmentId: '', examPaperId: '', studentId: '', marksObtained: '', gradeId: '', remarks: '', academicYearId: '', termId: '' });

  const submit = async () => {
    setLoading(true);
    try {
      const payload: any = {
        assessmentId: form.assessmentId ? Number(form.assessmentId) : undefined,
        examPaperId: form.examPaperId ? Number(form.examPaperId) : null,
        studentId: form.studentId ? Number(form.studentId) : undefined,
        marksObtained: form.marksObtained !== '' ? Number(form.marksObtained) : null,
        gradeId: form.gradeId ? Number(form.gradeId) : null,
        remarks: form.remarks?.trim() || null,
        academicYearId: form.academicYearId ? Number(form.academicYearId) : undefined,
        termId: form.termId ? Number(form.termId) : undefined,
      };
      if (!payload.assessmentId || !payload.studentId || !payload.academicYearId || !payload.termId) { setLoading(false); return; }
      if (editingId) {
        const res = await apiFetch('/api/assessmentresults', { method: 'PUT', body: JSON.stringify({ id: editingId, ...payload }) });
        const up = await res.json().catch(() => null);
        if (res.ok && up) setItems(prev => prev.map(i => i.id === up.id ? up : i));
      } else {
        const res = await apiFetch('/api/assessmentresults', { method: 'POST', body: JSON.stringify(payload) });
        const created = await res.json().catch(() => null);
        if (res.ok && created) setItems(prev => [created, ...prev]);
      }
      setEditingId(null);
      reset();
    } finally { setLoading(false); }
  };

  const edit = (it: AssessmentResult) => {
    setEditingId(it.id);
    setForm({ assessmentId: String(it.assessmentId), examPaperId: it.examPaperId ? String(it.examPaperId) : '', studentId: String(it.studentId), marksObtained: it.marksObtained ?? '', gradeId: it.gradeId ? String(it.gradeId) : '', remarks: it.remarks ?? '', academicYearId: String(it.academicYearId), termId: String(it.termId) });
  };

  const remove = async (id: number) => {
    if (!confirm('Delete assessment result?')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/assessmentresults', { method: 'DELETE', body: JSON.stringify({ id }) });
      if (res.ok) setItems(prev => prev.filter(i => i.id !== id));
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Assessment Results</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded border mb-4">
          <select className="border p-2 rounded" value={form.assessmentId} onChange={e => setForm({ ...form, assessmentId: e.target.value })}>
            <option value="">Assessment</option>
            {assessments.map(a => <option key={a.id} value={a.id}>{a.title ?? `Assessment #${a.id}`}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.examPaperId} onChange={e => setForm({ ...form, examPaperId: e.target.value })}>
            <option value="">Exam Paper (optional)</option>
            {exams.map(e => <option key={e.id} value={e.id}>Paper #{e.id} (Max {e.maxMarks})</option>)}
          </select>
          <select className="border p-2 rounded" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
            <option value="">Student</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.studentNo ? `${s.studentNo} - ` : ''}{s.firstName}{s.lastName ? ` ${s.lastName}` : ''}</option>)}
          </select>
          <input className="border p-2 rounded" placeholder="Marks obtained" type="number" value={form.marksObtained} onChange={e => setForm({ ...form, marksObtained: e.target.value })} />
          <select className="border p-2 rounded" value={form.gradeId} onChange={e => setForm({ ...form, gradeId: e.target.value })}>
            <option value="">Grade (optional)</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.grade}</option>)}
          </select>
          <input className="border p-2 rounded" placeholder="Remarks" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
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
                <th className="p-2 border">Assessment</th>
                <th className="p-2 border">Student</th>
                <th className="p-2 border">Marks</th>
                <th className="p-2 border">Grade</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it, idx) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx + 1}</td>
                  <td className="p-2 border">{it.assessmentId}</td>
                  <td className="p-2 border">{it.studentId}</td>
                  <td className="p-2 border">{it.marksObtained ?? ''}</td>
                  <td className="p-2 border">{it.gradeId ?? ''}</td>
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
