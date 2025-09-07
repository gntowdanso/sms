"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/utils/apiFetch';
import LoadingSpinner from '@/components/LoadingSpinner';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';

type Student = {
  id: number;
  username: string;
  studentNo: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  contactNumber?: string | null;
};

export default function Page() {
  const [items, setItems] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ firstName: '', lastName: '', otherNames: '', dateOfBirth: '', gender: '', address: '', email: '', contactNumber: '', nationality: '', placeOfBirth: '', previousSchool: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [gForm, setGForm] = useState<any>({ id: undefined, name: '', relation: '', contactNumber: '', email: '', address: '' });
  const [gEditing, setGEditing] = useState<boolean>(false);
  // Registrations panel state
  const [regStudentId, setRegStudentId] = useState<number | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [regForm, setRegForm] = useState<any>({ schoolId: '', departmentId: '', classId: '', sectionId: '', academicYearId: '', termId: '', status: '' });
  const [regEditingId, setRegEditingId] = useState<number | null>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  // Curriculums panel state
  const [currStudentId, setCurrStudentId] = useState<number | null>(null);
  const [regForCurr, setRegForCurr] = useState<any[]>([]);
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [studentCurriculums, setStudentCurriculums] = useState<any[]>([]);
  const [scForm, setScForm] = useState<any>({ studentRegistrationId: '', curriculumId: '', isActive: 'true' });
  const [scEditingId, setScEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [q, setQ] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/students');
      const d = await res.json().catch(() => []);
      setItems(Array.isArray(d) ? d : []);
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  // When a student is selected, load their guardians
  useEffect(() => {
    (async () => {
      if (!selectedStudentId) { setGuardians([]); return; }
      try {
        const res = await apiFetch(`/api/studentguardians?studentId=${selectedStudentId}`);
        const d = await res.json().catch(() => []);
        setGuardians(Array.isArray(d) ? d : []);
      } catch { setGuardians([]); }
    })();
  }, [selectedStudentId]);

  const safeServerMessage = (obj: any) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object') return obj.error || obj.message || JSON.stringify(obj);
    return String(obj);
  };

  const submit = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    setLoading(true);
    try {
      if (!form.firstName || !form.lastName) {
        setMessage({ type: 'error', text: 'First and last name required' });
        setLoading(false);
        return;
      }
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        otherNames: form.otherNames || null,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        address: form.address || null,
        email: form.email || null,
        contactNumber: form.contactNumber || null,
        nationality: form.nationality || null,
        placeOfBirth: form.placeOfBirth || null,
        previousSchool: form.previousSchool || null,
      } as any;
      const res = await apiFetch('/api/students', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: 'error', text: safeServerMessage(result) || 'Server error' });
        setLoading(false);
        return;
      }
      setMessage({ type: 'success', text: editingId ? 'Updated' : 'Created' });
      setForm({ firstName: '', lastName: '', otherNames: '', dateOfBirth: '', gender: '', address: '', email: '', contactNumber: '', nationality: '', placeOfBirth: '', previousSchool: '' });
      setEditingId(null);
      await fetchItems();
    } catch (e) {
      setMessage({ type: 'error', text: 'Request failed' });
    }
    setLoading(false);
  };

  const startEdit = (it: Student) => {
    setEditingId(it.id);
    setForm({ firstName: it.firstName, lastName: it.lastName, otherNames: '', dateOfBirth: '', gender: '', address: '', email: it.email || '', contactNumber: it.contactNumber || '', nationality: '', placeOfBirth: '', previousSchool: '' });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Registrations helpers
  const resetRegForm = () => setRegForm({ schoolId: '', departmentId: '', classId: '', sectionId: '', academicYearId: '', termId: '', status: '' });
  const openRegistrations = async (studentId: number) => {
    setRegStudentId(studentId);
    setRegEditingId(null);
    resetRegForm();
    try {
      const [regsRes, schRes, depRes, clsRes, secRes, yrRes, trRes] = await Promise.all([
        apiFetch(`/api/studentregistrations?studentId=${studentId}`),
        apiFetch('/api/schools'),
        apiFetch('/api/departments'),
        apiFetch('/api/classes'),
        apiFetch('/api/sections'),
        apiFetch('/api/academicyears'),
        apiFetch('/api/terms'),
      ]);
      const [regs, schs, deps, clss, secs, yrs, trs] = await Promise.all([
        regsRes.json().catch(() => []),
        schRes.json().catch(() => []),
        depRes.json().catch(() => []),
        clsRes.json().catch(() => []),
        secRes.json().catch(() => []),
        yrRes.json().catch(() => []),
        trRes.json().catch(() => []),
      ]);
      setRegistrations(Array.isArray(regs) ? regs : []);
      setSchools(Array.isArray(schs) ? schs : []);
      setDepartments(Array.isArray(deps) ? deps : []);
      setClasses(Array.isArray(clss) ? clss : []);
      setSections(Array.isArray(secs) ? secs : []);
      setYears(Array.isArray(yrs) ? yrs : []);
      setTerms(Array.isArray(trs) ? trs : []);
    } catch { setRegistrations([]); }
  };
  const closeRegistrations = () => { setRegStudentId(null); setRegistrations([]); };
  const saveRegistration = async () => {
    if (!regStudentId || !regForm.schoolId || !regForm.academicYearId || !regForm.termId) return;
    try {
      const payload: any = {
        studentId: regStudentId,
        schoolId: Number(regForm.schoolId),
        departmentId: regForm.departmentId ? Number(regForm.departmentId) : null,
        classId: regForm.classId ? Number(regForm.classId) : null,
        sectionId: regForm.sectionId ? Number(regForm.sectionId) : null,
        academicYearId: Number(regForm.academicYearId),
        termId: Number(regForm.termId),
        status: regForm.status || null,
      };
      if (regEditingId) {
        const res = await apiFetch('/api/studentregistrations', { method: 'PUT', body: JSON.stringify({ id: regEditingId, ...payload }) });
        const up = await res.json().catch(() => null);
        if (res.ok && up) setRegistrations(prev => prev.map(r => r.id === up.id ? up : r));
      } else {
        const res = await apiFetch('/api/studentregistrations', { method: 'POST', body: JSON.stringify(payload) });
        const created = await res.json().catch(() => null);
        if (res.ok && created) setRegistrations(prev => [created, ...prev]);
      }
      setRegEditingId(null);
      resetRegForm();
    } catch { /* ignore */ }
  };
  const editRegistration = (r: any) => {
    setRegEditingId(r.id);
    setRegForm({
      schoolId: r.schoolId ? String(r.schoolId) : '',
      departmentId: r.departmentId ? String(r.departmentId) : '',
      classId: r.classId ? String(r.classId) : '',
      sectionId: r.sectionId ? String(r.sectionId) : '',
      academicYearId: r.academicYearId ? String(r.academicYearId) : '',
      termId: r.termId ? String(r.termId) : '',
      status: r.status || '',
    });
  };
  const deleteRegistration = async (id: number) => {
    if (!confirm('Delete registration?')) return;
    try {
      const res = await apiFetch('/api/studentregistrations', { method: 'DELETE', body: JSON.stringify({ id }) });
      if (res.ok) setRegistrations(prev => prev.filter(r => r.id !== id));
    } catch { /* ignore */ }
  };

  // Curriculums helpers
  const resetScForm = () => setScForm({ studentRegistrationId: '', curriculumId: '', isActive: 'true' });
  const openCurriculums = async (studentId: number) => {
    setCurrStudentId(studentId);
    setScEditingId(null);
    resetScForm();
    try {
      const regsRes = await apiFetch(`/api/studentregistrations?studentId=${studentId}`);
      const regs = await regsRes.json().catch(() => []);
      const regList = Array.isArray(regs) ? regs : [];
      setRegForCurr(regList);
      const [curRes, scRes] = await Promise.all([
        apiFetch('/api/curriculums'),
        apiFetch('/api/studentcurriculums'),
      ]);
      const [curList, scList] = await Promise.all([
        curRes.json().catch(() => []),
        scRes.json().catch(() => []),
      ]);
      setCurriculums(Array.isArray(curList) ? curList : []);
      const regIds = new Set(regList.map((r: any) => r.id));
      const filteredSc = (Array.isArray(scList) ? scList : []).filter((x: any) => regIds.has(x.studentRegistrationId));
      setStudentCurriculums(filteredSc);
    } catch {
      setRegForCurr([]);
      setCurriculums([]);
      setStudentCurriculums([]);
    }
  };
  const closeCurriculums = () => { setCurrStudentId(null); setRegForCurr([]); setCurriculums([]); setStudentCurriculums([]); };
  const saveStudentCurriculum = async () => {
    if (!scForm.studentRegistrationId || !scForm.curriculumId) return;
    try {
      const payload: any = {
        studentRegistrationId: Number(scForm.studentRegistrationId),
        curriculumId: Number(scForm.curriculumId),
        isActive: scForm.isActive === 'true',
      };
      if (scEditingId) {
        const res = await apiFetch('/api/studentcurriculums', { method: 'PUT', body: JSON.stringify({ id: scEditingId, isActive: payload.isActive, curriculumId: payload.curriculumId }) });
        const up = await res.json().catch(() => null);
        if (res.ok && up) setStudentCurriculums(prev => prev.map((i:any) => i.id === up.id ? up : i));
      } else {
        const res = await apiFetch('/api/studentcurriculums', { method: 'POST', body: JSON.stringify(payload) });
        const created = await res.json().catch(() => null);
        if (res.ok && created) setStudentCurriculums(prev => [created, ...prev]);
      }
      setScEditingId(null);
      resetScForm();
    } catch { /* ignore */ }
  };
  const editStudentCurriculum = (it: any) => {
    setScEditingId(it.id);
    setScForm({ studentRegistrationId: String(it.studentRegistrationId), curriculumId: String(it.curriculumId), isActive: String(!!it.isActive) });
  };
  const deleteStudentCurriculum = async (id: number) => {
    if (!confirm('Delete record?')) return;
    try {
      const res = await apiFetch('/api/studentcurriculums', { method: 'DELETE', body: JSON.stringify({ id }) });
      if (res.ok) setStudentCurriculums(prev => prev.filter((i:any) => i.id !== id));
    } catch { /* ignore */ }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete student?')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/students', { method: 'DELETE', body: JSON.stringify({ id }) });
      const r = await res.json().catch(() => ({}));
      if (!res.ok) setMessage({ type: 'error', text: safeServerMessage(r) || 'Delete failed' });
      else setMessage({ type: 'success', text: 'Deleted' });
      await fetchItems();
    } catch (e) {
      setMessage({ type: 'error', text: 'Delete failed' });
    }
    setLoading(false);
  };

  // import one application into students
  const importFromApplication = async () => {
    setLoading(true);
    try {
      const appsRes = await apiFetch('/api/studentapplications');
      const apps = await appsRes.json().catch(() => []);
      if (!Array.isArray(apps) || apps.length === 0) {
        setMessage({ type: 'error', text: 'No applications found' });
        setLoading(false);
        return;
      }
      const app = apps[0];
      const payload = { firstName: app.firstName, lastName: app.lastName, otherNames: app.otherNames || null, dateOfBirth: app.dateOfBirth || null, gender: app.gender || null, address: app.address || null, email: app.email || null, contactNumber: app.contactNumber || null, previousSchool: app.previousSchool || null };
      const res = await apiFetch('/api/students', { method: 'POST', body: JSON.stringify(payload) });
      const r = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: 'error', text: safeServerMessage(r) || 'Import failed' });
        setLoading(false);
        return;
      }
      setMessage({ type: 'success', text: 'Imported from application' });
      await fetchItems();
    } catch (e) {
      setMessage({ type: 'error', text: 'Import failed' });
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    if (!q) return items;
    const s = q.toLowerCase();
    return items.filter(i => `${i.firstName} ${i.lastName}`.toLowerCase().includes(s) || (i.studentNo || '').toLowerCase().includes(s));
  }, [items, q]);

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8 relative">
        <h2 className="text-2xl font-bold mb-4">Students</h2>

        <div className="mb-4">
          <button onClick={importFromApplication} disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded">
            Import from Application
          </button>
        </div>

        {message && (
          <div className={`mb-2 p-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={submit} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-4 rounded border">
          <input placeholder="First name" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="border p-2 rounded" />
          <input placeholder="Last name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="border p-2 rounded" />
          <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="border p-2 rounded" />
          <input placeholder="Contact" value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })} className="border p-2 rounded" />
          <div className="flex gap-2 md:col-span-3">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">{editingId ? 'Update' : 'Create'}</button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm({ firstName: '', lastName: '', otherNames: '', dateOfBirth: '', gender: '', address: '', email: '', contactNumber: '', nationality: '', placeOfBirth: '', previousSchool: '' }); }} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
            )}
          </div>
        </form>

        <div className="flex gap-2 items-center mb-2">
          <input placeholder="Search by name or student no..." value={q} onChange={e => { setQ(e.target.value); setPage(1); }} className="border p-2 rounded" />
          <div className="ml-auto flex items-center gap-2">
            <div className="text-sm text-gray-600">Page size</div>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded">
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={12}>12</option>
            </select>
          </div>
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            <div className="text-sm text-gray-600">Showing {start + 1} - {Math.min(start + pageSize, total)} of {total}</div>
            <div className="overflow-x-auto mt-2">
              <table className="w-full table-auto border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 border">#</th>
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Student No</th>
                    <th className="p-2 border">Email</th>
                    <th className="p-2 border">Contact</th>
                    <th className="p-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((it, idx) => (
                    <tr key={it.id} className="border-t">
                      <td className="p-2 border">{start + idx + 1}</td>
                      <td className="p-2 border">{it.firstName} {it.lastName}</td>
                      <td className="p-2 border">{it.studentNo}</td>
                      <td className="p-2 border">{it.email || ''}</td>
                      <td className="p-2 border">{it.contactNumber || ''}</td>
                      <td className="p-2 border">
                        <div className="flex gap-2">
                          <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => startEdit(it)}>Edit</button>
                          <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => remove(it.id)}>Delete</button>
                          <button className="bg-indigo-600 text-white px-2 py-1 rounded" onClick={() => setSelectedStudentId(it.id)}>Guardians</button>
                          <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={() => openRegistrations(it.id)}>Registrations</button>
                          <button className="bg-teal-600 text-white px-2 py-1 rounded" onClick={() => openCurriculums(it.id)}>Curriculums</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div />
              <div className="flex gap-2">
                <button className="px-3 py-1 border rounded" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
                <span className="px-2 py-1">Page {page}</span>
                <button className="px-3 py-1 border rounded" onClick={() => setPage(p => (start + pageSize < total ? p + 1 : p))} disabled={start + pageSize >= total}>Next</button>
              </div>
            </div>

            {/* Guardians panel */}
            {selectedStudentId && (
              <div className="mt-8 bg-white border rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Guardians for Student ID {selectedStudentId}</h3>
                  <button className="text-sm text-blue-600" onClick={() => { setSelectedStudentId(null); setGuardians([]); }}>Close</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <input placeholder="Name" className="border p-2 rounded" value={gForm.name} onChange={e => setGForm({ ...gForm, name: e.target.value })} />
                  <input placeholder="Relation" className="border p-2 rounded" value={gForm.relation} onChange={e => setGForm({ ...gForm, relation: e.target.value })} />
                  <input placeholder="Contact" className="border p-2 rounded" value={gForm.contactNumber} onChange={e => setGForm({ ...gForm, contactNumber: e.target.value })} />
                  <input placeholder="Email" className="border p-2 rounded" value={gForm.email} onChange={e => setGForm({ ...gForm, email: e.target.value })} />
                  <input placeholder="Address" className="border p-2 rounded md:col-span-2" value={gForm.address} onChange={e => setGForm({ ...gForm, address: e.target.value })} />
                  <div className="flex gap-2 items-center">
                    <button
                      className="bg-blue-600 text-white px-3 py-2 rounded"
                      onClick={async () => {
                        if (!selectedStudentId || !gForm.name) return;
                        try {
                          if (gEditing && gForm.id) {
                            const res = await apiFetch('/api/studentguardians', { method: 'PUT', body: JSON.stringify({ id: gForm.id, name: gForm.name, relation: gForm.relation || null, contactNumber: gForm.contactNumber || null, email: gForm.email || null, address: gForm.address || null }) });
                            const up = await res.json().catch(() => null);
                            if (res.ok && up) setGuardians(prev => prev.map((x: any) => x.id === up.id ? up : x));
                          } else {
                            const res = await apiFetch('/api/studentguardians', { method: 'POST', body: JSON.stringify({ studentId: selectedStudentId, name: gForm.name, relation: gForm.relation || null, contactNumber: gForm.contactNumber || null, email: gForm.email || null, address: gForm.address || null }) });
                            const created = await res.json().catch(() => null);
                            if (res.ok && created) setGuardians(prev => [created, ...prev]);
                          }
                          setGEditing(false);
                          setGForm({ id: undefined, name: '', relation: '', contactNumber: '', email: '', address: '' });
                        } catch { /* ignore */ }
                      }}
                    >{gEditing ? 'Update' : 'Add'}</button>
                    {gEditing && (
                      <button className="border px-3 py-2 rounded" onClick={() => { setGEditing(false); setGForm({ id: undefined, name: '', relation: '', contactNumber: '', email: '', address: '' }); }}>Cancel</button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full table-auto border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="p-2 border">#</th>
                        <th className="p-2 border">Name</th>
                        <th className="p-2 border">Relation</th>
                        <th className="p-2 border">Contact</th>
                        <th className="p-2 border">Email</th>
                        <th className="p-2 border">Address</th>
                        <th className="p-2 border">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guardians.map((g: any, idx: number) => (
                        <tr key={g.id} className="border-t">
                          <td className="p-2 border">{idx + 1}</td>
                          <td className="p-2 border">{g.name}</td>
                          <td className="p-2 border">{g.relation || ''}</td>
                          <td className="p-2 border">{g.contactNumber || ''}</td>
                          <td className="p-2 border">{g.email || ''}</td>
                          <td className="p-2 border">{g.address || ''}</td>
                          <td className="p-2 border">
                            <div className="flex gap-2">
                              <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => { setGEditing(true); setGForm({ id: g.id, name: g.name, relation: g.relation || '', contactNumber: g.contactNumber || '', email: g.email || '', address: g.address || '' }); }}>Edit</button>
                              <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={async () => {
                                if (!confirm('Delete guardian?')) return;
                                try {
                                  const res = await apiFetch('/api/studentguardians', { method: 'DELETE', body: JSON.stringify({ id: g.id }) });
                                  if (res.ok) setGuardians(prev => prev.filter((x: any) => x.id !== g.id));
                                } catch { /* ignore */ }
                              }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Registrations panel */}
            {regStudentId && (
              <div className="mt-8 bg-white border rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Registrations for Student ID {regStudentId}</h3>
                  <button className="text-sm text-blue-600" onClick={() => closeRegistrations()}>Close</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                  <select className="border p-2 rounded" value={regForm.schoolId} onChange={e => setRegForm({ ...regForm, schoolId: e.target.value })}>
                    <option value="">Select school</option>
                    {schools.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select className="border p-2 rounded" value={regForm.departmentId} onChange={e => setRegForm({ ...regForm, departmentId: e.target.value })}>
                    <option value="">Department (optional)</option>
                    {departments.map((d:any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <select className="border p-2 rounded" value={regForm.classId} onChange={e => setRegForm({ ...regForm, classId: e.target.value })}>
                    <option value="">Class (optional)</option>
                    {classes.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select className="border p-2 rounded" value={regForm.sectionId} onChange={e => setRegForm({ ...regForm, sectionId: e.target.value })}>
                    <option value="">Section (optional)</option>
                    {sections.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select className="border p-2 rounded" value={regForm.academicYearId} onChange={e => setRegForm({ ...regForm, academicYearId: e.target.value })}>
                    <option value="">Academic year</option>
                    {years.map((y:any) => <option key={y.id} value={y.id}>{y.yearName}</option>)}
                  </select>
                  <select className="border p-2 rounded" value={regForm.termId} onChange={e => setRegForm({ ...regForm, termId: e.target.value })}>
                    <option value="">Term</option>
                    {terms.map((t:any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <input placeholder="Status (PROMOTED / REPEATED / WITHDRAWN)" className="border p-2 rounded" value={regForm.status} onChange={e => setRegForm({ ...regForm, status: e.target.value })} />
                  <div className="flex items-center gap-2">
                    <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={saveRegistration}>{regEditingId ? 'Update' : 'Add'}</button>
                    {regEditingId && <button className="border px-3 py-2 rounded" onClick={() => { setRegEditingId(null); resetRegForm(); }}>Cancel</button>}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full table-auto border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="p-2 border">#</th>
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
                      {registrations.map((r:any, idx:number) => (
                        <tr key={r.id} className="border-t">
                          <td className="p-2 border">{idx + 1}</td>
                          <td className="p-2 border">{r.school?.name || ''}</td>
                          <td className="p-2 border">{r.department?.name || ''}</td>
                          <td className="p-2 border">{r.class?.name || ''}</td>
                          <td className="p-2 border">{r.section?.name || ''}</td>
                          <td className="p-2 border">{r.academicYear?.yearName || ''}</td>
                          <td className="p-2 border">{r.term?.name || ''}</td>
                          <td className="p-2 border">{r.status || ''}</td>
                          <td className="p-2 border">
                            <div className="flex gap-2">
                              <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => editRegistration(r)}>Edit</button>
                              <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => deleteRegistration(r.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Curriculums panel */}
            {currStudentId && (
              <div className="mt-8 bg-white border rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Curriculums for Student ID {currStudentId}</h3>
                  <button className="text-sm text-blue-600" onClick={() => closeCurriculums()}>Close</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                  <select className="border p-2 rounded" value={scForm.studentRegistrationId} onChange={e => setScForm({ ...scForm, studentRegistrationId: e.target.value })}>
                    <option value="">Select registration</option>
                    {regForCurr.map((r:any) => (
                      <option key={r.id} value={r.id}>{r.student ? `${r.student.studentNo} - ${r.student.firstName} ${r.student.lastName}` : `Reg #${r.id}`}</option>
                    ))}
                  </select>
                  <select className="border p-2 rounded" value={scForm.curriculumId} onChange={e => setScForm({ ...scForm, curriculumId: e.target.value })}>
                    <option value="">Select curriculum</option>
                    {curriculums.map((c:any) => (
                      <option key={c.id} value={c.id}>{c.subject ? `${c.subject.name}${c.subject.code ? ` (${c.subject.code})` : ''}` : `Curriculum #${c.id}`}</option>
                    ))}
                  </select>
                  <select className="border p-2 rounded" value={scForm.isActive} onChange={e => setScForm({ ...scForm, isActive: e.target.value })}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={saveStudentCurriculum}>{scEditingId ? 'Update' : 'Add'}</button>
                    {scEditingId && <button className="border px-3 py-2 rounded" onClick={() => { setScEditingId(null); resetScForm(); }}>Cancel</button>}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full table-auto border-collapse">
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
                      {studentCurriculums.map((it:any, idx:number) => (
                        <tr key={it.id} className="border-t">
                          <td className="p-2 border">{idx + 1}</td>
                          <td className="p-2 border">{it.studentRegistration?.student ? `${it.studentRegistration.student.studentNo} - ${it.studentRegistration.student.firstName} ${it.studentRegistration.student.lastName}` : it.studentRegistrationId}</td>
                          <td className="p-2 border">{it.curriculum?.subject ? `${it.curriculum.subject.name}${it.curriculum.subject.code ? ` (${it.curriculum.subject.code})` : ''}` : it.curriculumId}</td>
                          <td className="p-2 border">{it.isActive ? 'Yes' : 'No'}</td>
                          <td className="p-2 border">
                            <div className="flex gap-2">
                              <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => editStudentCurriculum(it)}>Edit</button>
                              <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => deleteStudentCurriculum(it.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
