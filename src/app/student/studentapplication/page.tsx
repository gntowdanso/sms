"use client";
import React, { useEffect, useState, useMemo } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import { apiFetch } from '@/utils/apiFetch';
import LogoutButton from '@/components/LogoutButton';

const StudentApplicationsPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ firstName: '', lastName: '', otherNames: '', dateOfBirth: '', gender: '', address: '', email: '', contactNumber: '', previousSchool: '', intendedClass: '', guardianName: '', guardianContact: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [filterName, setFilterName] = useState('');
  const [message, setMessage] = useState<{ type: 'success'|'error'|'info', text: string } | null>(null);

  const fetchItems = async () => { setLoading(true); try { const res = await apiFetch('/api/studentapplications'); const d = await res.json().catch(()=>[]); setItems(Array.isArray(d)?d:[]); } catch(e){} setLoading(false); };

  useEffect(()=>{ fetchItems(); }, []);

  const safeServerMessage = (resObj: any) => { if (!resObj) return ''; if (typeof resObj === 'string') return resObj; if (typeof resObj === 'object') return (resObj.error || resObj.message || JSON.stringify(resObj)); return String(resObj); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    if (!form.firstName || !form.lastName) { setMessage({ type:'error', text:'First and last name required' }); setLoading(false); return; }
    const payload: any = { firstName: form.firstName, lastName: form.lastName, otherNames: form.otherNames || null, dateOfBirth: form.dateOfBirth || null, gender: form.gender || null, address: form.address || null, email: form.email || null, contactNumber: form.contactNumber || null, previousSchool: form.previousSchool || null, intendedClass: form.intendedClass || null, guardianName: form.guardianName || null, guardianContact: form.guardianContact || null };
    try {
      const res = await apiFetch('/api/studentapplications', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload) });
      const result = await res.json().catch(()=>({}));
      if (!res.ok) { setMessage({ type:'error', text: safeServerMessage(result) || 'Server error' }); setLoading(false); return; }
      setMessage({ type:'success', text: editingId ? 'Updated' : 'Created' }); setForm({ firstName:'', lastName:'', otherNames:'', dateOfBirth:'', gender:'', address:'', email:'', contactNumber:'', previousSchool:'', intendedClass:'', guardianName:'', guardianContact:'' }); setEditingId(null); await fetchItems();
    } catch(e){ setMessage({ type:'error', text:'Request failed' }); }
    setLoading(false);
  };

  const handleEdit = (it:any) => { setForm({ firstName: it.firstName, lastName: it.lastName, otherNames: it.otherNames || '', dateOfBirth: it.dateOfBirth ? new Date(it.dateOfBirth).toISOString().slice(0,10) : '', gender: it.gender || '', address: it.address || '', email: it.email || '', contactNumber: it.contactNumber || '', previousSchool: it.previousSchool || '', intendedClass: it.intendedClass || '', guardianName: it.guardianName || '', guardianContact: it.guardianContact || '' }); setEditingId(it.id); };

  const handleDelete = async (id:number) => { if(!confirm('Delete application?')) return; setLoading(true); try { const res = await apiFetch('/api/studentapplications', { method:'DELETE', body: JSON.stringify({ id }) }); const result = await res.json().catch(()=>({})); if (!res.ok) setMessage({ type:'error', text: safeServerMessage(result) || 'Delete failed' }); else setMessage({ type:'success', text:'Deleted' }); await fetchItems(); } catch(e){ setMessage({ type:'error', text:'Delete failed' }); } setLoading(false); };

  const filtered = useMemo(()=>{ if(!Array.isArray(items)) return []; return items.filter(it=>{ if(filterName){ const q = filterName.toLowerCase(); if(!(`${it.firstName} ${it.lastName}`.toLowerCase().includes(q))) return false; } return true; }); }, [items, filterName]);
  const totalFiltered = filtered.length; const start = (page-1)*pageSize; const pageItems = useMemo(()=>filtered.slice(start, start+pageSize), [filtered, start, pageSize]); const showingStart = totalFiltered===0?0:start+1; const showingEnd = Math.min(start+pageSize, totalFiltered);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8 relative">
        <h2 className="text-2xl font-bold mb-4">Student Applications</h2>
        {loading && <LoadingSpinner />}

        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={form.firstName} onChange={e=>setForm({...form, firstName: e.target.value})} placeholder="First Name" className="border p-2 rounded" required />
          <input value={form.lastName} onChange={e=>setForm({...form, lastName: e.target.value})} placeholder="Last Name" className="border p-2 rounded" required />
          <input value={form.otherNames} onChange={e=>setForm({...form, otherNames: e.target.value})} placeholder="Other Names" className="border p-2 rounded" />
          <input type="date" value={form.dateOfBirth} onChange={e=>setForm({...form, dateOfBirth: e.target.value})} className="border p-2 rounded" />
          <select value={form.gender} onChange={e=>setForm({...form, gender: e.target.value})} className="border p-2 rounded">
            <option value="">Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          <input value={form.contactNumber} onChange={e=>setForm({...form, contactNumber: e.target.value})} placeholder="Contact Number" className="border p-2 rounded" />
          <input value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder="Email" className="border p-2 rounded" />
          <input value={form.previousSchool} onChange={e=>setForm({...form, previousSchool: e.target.value})} placeholder="Previous School" className="border p-2 rounded" />
          <input value={form.intendedClass} onChange={e=>setForm({...form, intendedClass: e.target.value})} placeholder="Intended Class" className="border p-2 rounded" />
          <input value={form.guardianName} onChange={e=>setForm({...form, guardianName: e.target.value})} placeholder="Guardian Name" className="border p-2 rounded" />
          <input value={form.guardianContact} onChange={e=>setForm({...form, guardianContact: e.target.value})} placeholder="Guardian Contact" className="border p-2 rounded" />
          <input value={form.address} onChange={e=>setForm({...form, address: e.target.value})} placeholder="Address" className="border p-2 rounded md:col-span-2" />
          <div className="md:col-span-2 flex gap-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">{editingId? 'Update':'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ firstName: '', lastName: '', otherNames: '', dateOfBirth: '', gender: '', address: '', email: '', contactNumber: '', previousSchool: '', intendedClass: '', guardianName: '', guardianContact: '' }); }}>Cancel</button>}
          </div>
        </form>

        <div className="mt-4">
          <div className="flex gap-2 items-center mb-2">
            <input placeholder="Filter by name..." className="border p-2 rounded" value={filterName} onChange={e=>{ setFilterName(e.target.value); setPage(1); }} />
            <div className="ml-auto flex items-center gap-2">
              <div className="text-sm text-gray-600">Page size</div>
              <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded">
                <option value={5}>5</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
              </select>
            </div>
          </div>

          {message && <div className={`mb-2 p-2 rounded ${message.type==='success'?'bg-green-100 text-green-800':message.type==='error'?'bg-red-100 text-red-800':'bg-blue-100 text-blue-800'}`}>{message.text}</div>}

          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse bg-white">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">DOB</th>
                  <th className="p-2 border">Contact</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(it=> (
                  <tr key={it.id} className="border-t">
                    <td className="p-2 border">{it.id}</td>
                    <td className="p-2 border">{it.firstName} {it.lastName}</td>
                    <td className="p-2 border">{it.dateOfBirth ? new Date(it.dateOfBirth).toLocaleDateString() : ''}</td>
                    <td className="p-2 border">{it.contactNumber || it.email || ''}</td>
                    <td className="p-2 border">{it.status || ''}</td>
                    <td className="p-2 border"><div className="flex gap-2"><button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={()=>handleEdit(it)}>Edit</button><button className="bg-red-600 text-white px-2 py-1 rounded" onClick={()=>handleDelete(it.id)}>Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">Showing {showingStart} - {showingEnd} of {totalFiltered}</div>
            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Prev</button>
              <button className="px-3 py-1 border rounded" onClick={()=>setPage(p=> (page*pageSize < totalFiltered ? p+1 : p))} disabled={page*pageSize >= totalFiltered}>Next</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentApplicationsPage;
