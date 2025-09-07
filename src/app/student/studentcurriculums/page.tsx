"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

type RegistrationLite = { id: number; student?: { studentNo: string; firstName: string; lastName: string } | null; class?: { name: string } | null; term?: { name: string } | null; academicYear?: { yearName: string } | null };
type CurriculumLite = { id: number; subject?: { name: string; code?: string | null } | null; class?: { name: string } | null; academicYear?: { yearName: string } | null; term?: { name: string } | null };
type StudentCurriculum = { id: number; studentRegistrationId: number; curriculumId: number; isActive: boolean; studentRegistration?: RegistrationLite; curriculum?: CurriculumLite };

export default function StudentCurriculumsPage() {
  const [items, setItems] = useState<StudentCurriculum[]>([]);
  const [regs, setRegs] = useState<RegistrationLite[]>([]);
  const [currics, setCurrics] = useState<CurriculumLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [form, setForm] = useState<any>({ studentRegistrationId: '', curriculumId: '', isActive: 'true' });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [scRes, regRes, curRes] = await Promise.all([
          apiFetch('/api/studentcurriculums'),
          apiFetch('/api/studentregistrations'),
          apiFetch('/api/curriculums'),
        ]);
        const [scs, rgs, curs] = await Promise.all([
          scRes.json().catch(() => []),
          regRes.json().catch(() => []),
          curRes.json().catch(() => []),
        ]);
        setItems(Array.isArray(scs) ? scs : []);
        setRegs(Array.isArray(rgs) ? rgs : []);
        setCurrics(Array.isArray(curs) ? curs : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!q) return items;
    const s = q.toLowerCase();
    return items.filter(it => {
      const a = `${it.studentRegistration?.student?.studentNo ?? ''} ${it.studentRegistration?.student?.firstName ?? ''} ${it.studentRegistration?.student?.lastName ?? ''}`.toLowerCase();
      const b = `${it.curriculum?.subject?.name ?? ''} ${it.curriculum?.subject?.code ?? ''}`.toLowerCase();
      return a.includes(s) || b.includes(s);
    });
  }, [items, q]);

  const reset = () => setForm({ studentRegistrationId: '', curriculumId: '', isActive: 'true' });

  const submit = async () => {
    setLoading(true);
    try {
      const payload: any = {
        studentRegistrationId: form.studentRegistrationId ? Number(form.studentRegistrationId) : undefined,
        curriculumId: form.curriculumId ? Number(form.curriculumId) : undefined,
        isActive: form.isActive === 'true',
      };
      if (!payload.studentRegistrationId || !payload.curriculumId) { setLoading(false); return; }
      if (editingId) {
        const res = await apiFetch('/api/studentcurriculums', { method: 'PUT', body: JSON.stringify({ id: editingId, isActive: payload.isActive, curriculumId: payload.curriculumId }) });
        const up = await res.json().catch(() => null);
        if (res.ok && up) setItems(prev => prev.map(i => i.id === up.id ? up : i));
      } else {
        const res = await apiFetch('/api/studentcurriculums', { method: 'POST', body: JSON.stringify(payload) });
        const created = await res.json().catch(() => null);
        if (res.ok && created) setItems(prev => [created, ...prev]);
      }
      setEditingId(null);
      reset();
    } finally {
      setLoading(false);
    }
  };

  const edit = (it: StudentCurriculum) => {
    setEditingId(it.id);
    setForm({ studentRegistrationId: String(it.studentRegistrationId), curriculumId: String(it.curriculumId), isActive: String(it.isActive) });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id: number) => {
    if (!confirm('Delete record?')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/studentcurriculums', { method: 'DELETE', body: JSON.stringify({ id }) });
      if (res.ok) setItems(prev => prev.filter(i => i.id !== id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Student Curriculums</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded border mb-4">
          <select className="border p-2 rounded" value={form.studentRegistrationId} onChange={e => setForm({ ...form, studentRegistrationId: e.target.value })}>
            <option value="">Select registration</option>
            {regs.map(r => (
              <option key={r.id} value={r.id}>
                {r.student ? `${r.student.studentNo} - ${r.student.firstName} ${r.student.lastName}` : `Registration #${r.id}`}
              </option>
            ))}
          </select>
          <select className="border p-2 rounded" value={form.curriculumId} onChange={e => setForm({ ...form, curriculumId: e.target.value })}>
            <option value="">Select curriculum</option>
            {currics.map(c => (
              <option key={c.id} value={c.id}>
                {c.subject ? `${c.subject.name}${c.subject.code ? ` (${c.subject.code})` : ''}` : `Curriculum #${c.id}`}
              </option>
            ))}
          </select>
          <select className="border p-2 rounded" value={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.value })}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <div className="flex items-center gap-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submit}>{editingId ? 'Update' : 'Add'}</button>
            {editingId && <button className="border px-4 py-2 rounded" onClick={() => { setEditingId(null); reset(); }}>Cancel</button>}
          </div>
        </div>

        <div className="flex items-center mb-2">
          <input placeholder="Search by student or subject" className="border p-2 rounded" value={q} onChange={e => setQ(e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse bg-white">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">#</th>
                <th className="p-2 border">Registration</th>
                <th className="p-2 border">Curriculum</th>
                <th className="p-2 border">Active</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it, idx) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx + 1}</td>
                  <td className="p-2 border">{it.studentRegistration?.student ? `${it.studentRegistration.student.studentNo} - ${it.studentRegistration.student.firstName} ${it.studentRegistration.student.lastName}` : it.studentRegistrationId}</td>
                  <td className="p-2 border">{it.curriculum?.subject ? `${it.curriculum.subject.name}${it.curriculum.subject.code ? ` (${it.curriculum.subject.code})` : ''}` : it.curriculumId}</td>
                  <td className="p-2 border">{it.isActive ? 'Yes' : 'No'}</td>
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
