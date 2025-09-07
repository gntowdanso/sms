"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

type StudentLite = { id: number; studentNo: string; firstName: string; lastName: string };
type Option = { id: number; name: string };
type AcademicYearLite = { id: number; yearName: string };
type TermLite = { id: number; name: string };

type Registration = {
  id: number;
  username: string;
  studentId: number;
  schoolId: number;
  departmentId?: number | null;
  classId?: number | null;
  sectionId?: number | null;
  academicYearId: number;
  termId: number;
  status?: string | null;
  student?: StudentLite;
  school?: Option;
  department?: Option | null;
  class?: Option | null;
  section?: Option | null;
  academicYear?: AcademicYearLite;
  term?: TermLite;
};

export default function RegistrationsPage() {
  const [items, setItems] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [form, setForm] = useState<any>({ studentId: '', schoolId: '', departmentId: '', classId: '', sectionId: '', academicYearId: '', termId: '', status: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  // lookups
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [schools, setSchools] = useState<Option[]>([]);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [sections, setSections] = useState<Option[]>([]);
  const [years, setYears] = useState<AcademicYearLite[]>([]);
  const [terms, setTerms] = useState<TermLite[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [regRes, stuRes, schRes, depRes, clsRes, secRes, yrRes, trRes] = await Promise.all([
          apiFetch('/api/studentregistrations'),
          apiFetch('/api/students'),
          apiFetch('/api/schools'),
          apiFetch('/api/departments'),
          apiFetch('/api/classes'),
          apiFetch('/api/sections'),
          apiFetch('/api/academicyears'),
          apiFetch('/api/terms'),
        ]);
        const [regs, stus, schs, deps, clss, secs, yrs, trs] = await Promise.all([
          regRes.json().catch(() => []),
          stuRes.json().catch(() => []),
          schRes.json().catch(() => []),
          depRes.json().catch(() => []),
          clsRes.json().catch(() => []),
          secRes.json().catch(() => []),
          yrRes.json().catch(() => []),
          trRes.json().catch(() => []),
        ]);
        setItems(Array.isArray(regs) ? regs : []);
        setStudents(Array.isArray(stus) ? stus : []);
        setSchools(Array.isArray(schs) ? schs : []);
        setDepartments(Array.isArray(deps) ? deps : []);
        setClasses(Array.isArray(clss) ? clss : []);
        setSections(Array.isArray(secs) ? secs : []);
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
    return items.filter(it => `${it.student?.firstName ?? ''} ${it.student?.lastName ?? ''}`.toLowerCase().includes(s) || (it.student?.studentNo ?? '').toLowerCase().includes(s));
  }, [items, q]);

  const resetForm = () => setForm({ studentId: '', schoolId: '', departmentId: '', classId: '', sectionId: '', academicYearId: '', termId: '', status: '' });

  const submit = async () => {
    setLoading(true);
    try {
      const payload: any = {
        studentId: form.studentId ? Number(form.studentId) : undefined,
        schoolId: form.schoolId ? Number(form.schoolId) : undefined,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        classId: form.classId ? Number(form.classId) : null,
        sectionId: form.sectionId ? Number(form.sectionId) : null,
        academicYearId: form.academicYearId ? Number(form.academicYearId) : undefined,
        termId: form.termId ? Number(form.termId) : undefined,
        status: form.status || null,
      };
      if (!payload.studentId || !payload.schoolId || !payload.academicYearId || !payload.termId) {
        setLoading(false);
        return;
      }
      if (editingId) {
        const res = await apiFetch('/api/studentregistrations', { method: 'PUT', body: JSON.stringify({ id: editingId, ...payload }) });
        const up = await res.json().catch(() => null);
        if (res.ok && up) setItems(prev => prev.map(i => i.id === up.id ? up : i));
      } else {
        const res = await apiFetch('/api/studentregistrations', { method: 'POST', body: JSON.stringify(payload) });
        const created = await res.json().catch(() => null);
        if (res.ok && created) setItems(prev => [created, ...prev]);
      }
      setEditingId(null);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const edit = (it: Registration) => {
    setEditingId(it.id);
    setForm({
      studentId: String(it.studentId),
      schoolId: String(it.schoolId),
      departmentId: it.departmentId ? String(it.departmentId) : '',
      classId: it.classId ? String(it.classId) : '',
      sectionId: it.sectionId ? String(it.sectionId) : '',
      academicYearId: String(it.academicYearId),
      termId: String(it.termId),
      status: it.status || '',
    });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id: number) => {
    if (!confirm('Delete registration?')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/studentregistrations', { method: 'DELETE', body: JSON.stringify({ id }) });
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
        <h2 className="text-2xl font-bold mb-4">Student Registrations</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded border mb-4">
          <select className="border p-2 rounded" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
            <option value="">Select student</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.studentNo} - {s.firstName} {s.lastName}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.schoolId} onChange={e => setForm({ ...form, schoolId: e.target.value })}>
            <option value="">Select school</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
            <option value="">Department (optional)</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })}>
            <option value="">Class (optional)</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.sectionId} onChange={e => setForm({ ...form, sectionId: e.target.value })}>
            <option value="">Section (optional)</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.academicYearId} onChange={e => setForm({ ...form, academicYearId: e.target.value })}>
            <option value="">Academic year</option>
            {years.map(y => <option key={y.id} value={y.id}>{y.yearName}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.termId} onChange={e => setForm({ ...form, termId: e.target.value })}>
            <option value="">Term</option>
            {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input placeholder="Status (PROMOTED / REPEATED / WITHDRAWN)" className="border p-2 rounded" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} />
          <div className="flex items-center gap-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submit}>{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button className="border px-4 py-2 rounded" onClick={() => { setEditingId(null); resetForm(); }}>Cancel</button>}
          </div>
        </div>

        <div className="flex items-center mb-2">
          <input placeholder="Search by student name/no" className="border p-2 rounded" value={q} onChange={e => setQ(e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse bg-white">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">#</th>
                <th className="p-2 border">Student</th>
                <th className="p-2 border">School</th>
                <th className="p-2 border">Dept</th>
                <th className="p-2 border">Class</th>
                <th className="p-2 border">Section</th>
                <th className="p-2 border">Year</th>
                <th className="p-2 border">Term</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it, idx) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx + 1}</td>
                  <td className="p-2 border">{it.student ? `${it.student.studentNo} - ${it.student.firstName} ${it.student.lastName}` : it.studentId}</td>
                  <td className="p-2 border">{it.school?.name || it.schoolId}</td>
                  <td className="p-2 border">{it.department?.name || ''}</td>
                  <td className="p-2 border">{it.class?.name || ''}</td>
                  <td className="p-2 border">{it.section?.name || ''}</td>
                  <td className="p-2 border">{it.academicYear?.yearName || it.academicYearId}</td>
                  <td className="p-2 border">{it.term?.name || it.termId}</td>
                  <td className="p-2 border">{it.status || ''}</td>
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
