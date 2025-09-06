"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/utils/apiFetch';
import LoadingSpinner from '@/components/LoadingSpinner';

type Student = {
  id: number;
  username: string;
  studentNo: string;
  firstName: string;
  lastName: string;
  email?: string;
  contactNumber?: string;
};

export default function Page() {
  const [items, setItems] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ firstName: '', lastName: '', otherNames: '', dateOfBirth: '', gender: '', address: '', email: '', contactNumber: '', nationality: '', placeOfBirth: '', previousSchool: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);
  const [q, setQ] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchItems = async () => { setLoading(true); try { const res = await apiFetch('/api/students'); const d = await res.json().catch(()=>[]); setItems(Array.isArray(d)?d:[]); } catch(e){} setLoading(false); };

  useEffect(()=>{ fetchItems(); }, []);

  const safeServerMessage = (obj:any) => { if(!obj) return null; if(typeof obj === 'string') return obj; if(typeof obj === 'object') return obj.error || obj.message || JSON.stringify(obj); return String(obj); };

  const submit = async (ev?:React.FormEvent) => {
    ev?.preventDefault();
    setLoading(true);
    try{
      if(!form.firstName || !form.lastName){ setMessage({ type:'error', text:'First and last name required' }); setLoading(false); return; }
      const payload = { firstName: form.firstName, lastName: form.lastName, otherNames: form.otherNames || null, dateOfBirth: form.dateOfBirth || null, gender: form.gender || null, address: form.address || null, email: form.email || null, contactNumber: form.contactNumber || null, nationality: form.nationality || null, placeOfBirth: form.placeOfBirth || null, previousSchool: form.previousSchool || null };
      const res = await apiFetch('/api/students', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload) });
      const result = await res.json().catch(()=>({}));
      if(!res.ok){ setMessage({ type:'error', text: safeServerMessage(result) || 'Server error' }); setLoading(false); return; }
      setMessage({ type:'success', text: editingId ? 'Updated' : 'Created' });
      setForm({ firstName: '', lastName: '', otherNames: '', dateOfBirth: '', gender: '', address: '', email: '', contactNumber: '', nationality: '', placeOfBirth: '', previousSchool: '' });
      setEditingId(null);
      await fetchItems();
    }catch(e){ setMessage({ type:'error', text: 'Request failed' }); }
    setLoading(false);
  };

  const startEdit = (it: Student) => { setEditingId(it.id); setForm({ firstName: it.firstName, lastName: it.lastName, otherNames: '', dateOfBirth: '', gender: '', address: '', email: it.email || '', contactNumber: it.contactNumber || '', nationality: '', placeOfBirth: '', previousSchool: '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const remove = async (id:number) => { if(!confirm('Delete student?')) return; setLoading(true); try{ const res = await apiFetch('/api/students', { method: 'DELETE', body: JSON.stringify({ id }) }); const r = await res.json().catch(()=>({})); if(!res.ok) setMessage({ type:'error', text: safeServerMessage(r) || 'Delete failed' }); else setMessage({ type:'success', text:'Deleted' }); await fetchItems(); }catch(e){ setMessage({ type:'error', text:'Delete failed' }); } setLoading(false); };

  // import one application into students
  const importFromApplication = async () => {
    // fetch first pending application (simple approach)
    setLoading(true);
    try{
      const appsRes = await apiFetch('/api/studentapplications');
      const apps = await appsRes.json().catch(()=>[]);
      if(!Array.isArray(apps) || apps.length === 0){ setMessage({ type:'error', text:'No applications found' }); setLoading(false); return; }
      const app = apps[0];
      // create student payload from application
      const payload = { firstName: app.firstName, lastName: app.lastName, otherNames: app.otherNames || null, dateOfBirth: app.dateOfBirth || null, gender: app.gender || null, address: app.address || null, email: app.email || null, contactNumber: app.contactNumber || null, previousSchool: app.previousSchool || null };
      const res = await apiFetch('/api/students', { method: 'POST', body: JSON.stringify(payload) });
      const r = await res.json().catch(()=>({}));
      if(!res.ok){ setMessage({ type:'error', text: safeServerMessage(r) || 'Import failed' }); setLoading(false); return; }
      setMessage({ type:'success', text:'Imported from application' });
      await fetchItems();
    }catch(e){ setMessage({ type:'error', text:'Import failed' }); }
    setLoading(false);
  };

  const filtered = useMemo(()=>{ if(!Array.isArray(items)) return []; if(!q) return items; const s = q.toLowerCase(); return items.filter(i=>`${i.firstName} ${i.lastName}`.toLowerCase().includes(s) || (i.studentNo||'').toLowerCase().includes(s)); }, [items, q]);
  const total = filtered.length;
  const start = (page-1)*perPage;
  const pageItems = filtered.slice(start, start+perPage);

  return (
    <div>
      <h2>Students</h2>
      <div style={{ marginBottom: 12 }}>
        <button onClick={importFromApplication} disabled={loading}>Import from Application</button>
      </div>
      {message && <div style={{ color: message.type==='error' ? 'crimson' : 'green' }}>{message.text}</div>}
      <form onSubmit={submit} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input placeholder="First name" value={form.firstName} onChange={e=>setForm({...form, firstName: e.target.value})} />
          <input placeholder="Last name" value={form.lastName} onChange={e=>setForm({...form, lastName: e.target.value})} />
          <input placeholder="Email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} />
          <input placeholder="Contact" value={form.contactNumber} onChange={e=>setForm({...form, contactNumber: e.target.value})} />
        </div>
        <div style={{ marginTop: 8 }}>
          <button type="submit" disabled={loading}>{editingId ? 'Update' : 'Create'}</button>
          {editingId && <button type="button" onClick={()=>{ setEditingId(null); setForm({ firstName: '', lastName: '', otherNames: '', dateOfBirth: '', gender: '', address: '', email: '', contactNumber: '', nationality: '', placeOfBirth: '', previousSchool: '' }); }}>Cancel</button>}
        </div>
      </form>

      <div style={{ marginBottom: 8 }}>
        <input placeholder="Search" value={q} onChange={e=>setQ(e.target.value)} />
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div>Showing {start+1} - {Math.min(start+perPage, total)} of {total}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Student No</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((it, idx)=> (
                <tr key={it.id}>
                  <td>{start + idx + 1}</td>
                  <td>{it.firstName} {it.lastName}</td>
                  <td>{it.studentNo}</td>
                  <td>{it.email}</td>
                  <td>{it.contactNumber}</td>
                  <td>
                    <button onClick={()=>startEdit(it)}>Edit</button>
                    <button onClick={()=>remove(it.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 8 }}>
            <button onClick={()=>setPage(p=>Math.max(1, p-1))} disabled={page===1}>Prev</button>
            <span style={{ margin: '0 8px' }}>Page {page}</span>
            <button onClick={()=>setPage(p=>p+1)} disabled={start + perPage >= total}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}
