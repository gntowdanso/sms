"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

type ReportCardDetail = { id: number; reportCardId: number; subjectId: number; assessmentId?: number | null; marksObtained?: number | null; grade?: string | null };

export default function ReportCardDetailsPage() {
  const [items, setItems] = useState<ReportCardDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ reportCardId: '', subjectId: '', assessmentId: '', marksObtained: '', grade: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  const [reportCards, setReportCards] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [rcdRes, rcRes, sbjRes, asRes] = await Promise.all([
          apiFetch('/api/reportcarddetails'),
          apiFetch('/api/reportcards'),
          apiFetch('/api/subjects'),
          apiFetch('/api/assessments'),
        ]);
        const [rcds, rcs, sbs, ass] = await Promise.all([
          rcdRes.json().catch(() => []),
          rcRes.json().catch(() => []),
          sbjRes.json().catch(() => []),
          asRes.json().catch(() => []),
        ]);
        setItems(Array.isArray(rcds) ? rcds : []);
        setReportCards(Array.isArray(rcs) ? rcs : []);
        setSubjects(Array.isArray(sbs) ? sbs : []);
        setAssessments(Array.isArray(ass) ? ass : []);
      } finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => items, [items]);

  const reset = () => setForm({ reportCardId: '', subjectId: '', assessmentId: '', marksObtained: '', grade: '' });

  const submit = async () => {
    setLoading(true);
    try {
      const payload: any = {
        reportCardId: form.reportCardId ? Number(form.reportCardId) : undefined,
        subjectId: form.subjectId ? Number(form.subjectId) : undefined,
        assessmentId: form.assessmentId ? Number(form.assessmentId) : null,
        marksObtained: form.marksObtained !== '' ? Number(form.marksObtained) : null,
        grade: form.grade?.trim() || null,
      };
      if (!payload.reportCardId || !payload.subjectId) { setLoading(false); return; }
      if (editingId) {
        const res = await apiFetch('/api/reportcarddetails', { method: 'PUT', body: JSON.stringify({ id: editingId, ...payload }) });
        const up = await res.json().catch(() => null);
        if (res.ok && up) setItems(prev => prev.map(i => i.id === up.id ? up : i));
      } else {
        const res = await apiFetch('/api/reportcarddetails', { method: 'POST', body: JSON.stringify(payload) });
        const created = await res.json().catch(() => null);
        if (res.ok && created) setItems(prev => [created, ...prev]);
      }
      setEditingId(null);
      reset();
    } finally { setLoading(false); }
  };

  const edit = (it: ReportCardDetail) => {
    setEditingId(it.id);
    setForm({ reportCardId: String(it.reportCardId), subjectId: String(it.subjectId), assessmentId: it.assessmentId ? String(it.assessmentId) : '', marksObtained: it.marksObtained ?? '', grade: it.grade ?? '' });
  };

  const remove = async (id: number) => {
    if (!confirm('Delete report card detail?')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/reportcarddetails', { method: 'DELETE', body: JSON.stringify({ id }) });
      if (res.ok) setItems(prev => prev.filter(i => i.id !== id));
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Report Card Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded border mb-4">
          <select className="border p-2 rounded" value={form.reportCardId} onChange={e => setForm({ ...form, reportCardId: e.target.value })}>
            <option value="">Report Card</option>
            {reportCards.map(rc => <option key={rc.id} value={rc.id}>RC #{rc.id} - Student {rc.studentId}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}>
            <option value="">Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name ?? `Subject #${s.id}`}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.assessmentId} onChange={e => setForm({ ...form, assessmentId: e.target.value })}>
            <option value="">Assessment (optional)</option>
            {assessments.map(a => <option key={a.id} value={a.id}>{a.title ?? `Assessment #${a.id}`}</option>)}
          </select>
          <input className="border p-2 rounded" placeholder="Marks" type="number" value={form.marksObtained} onChange={e => setForm({ ...form, marksObtained: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Grade" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} />
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
                <th className="p-2 border">ReportCard</th>
                <th className="p-2 border">Subject</th>
                <th className="p-2 border">Assessment</th>
                <th className="p-2 border">Marks</th>
                <th className="p-2 border">Grade</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it, idx) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx + 1}</td>
                  <td className="p-2 border">{it.reportCardId}</td>
                  <td className="p-2 border">{it.subjectId}</td>
                  <td className="p-2 border">{it.assessmentId ?? ''}</td>
                  <td className="p-2 border">{it.marksObtained ?? ''}</td>
                  <td className="p-2 border">{it.grade ?? ''}</td>
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
