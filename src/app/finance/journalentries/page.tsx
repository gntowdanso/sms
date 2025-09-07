"use client";
import React, { useEffect, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

export default function JournalEntriesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ date: '', description: '', postedBy: '', academicYearId: '', termId: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [years, setYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [lineForm, setLineForm] = useState<any>({ journalEntryId: '', accountId: '', debit: '', credit: '' });

  useEffect(()=>{(async()=>{
    const [je, yr, tr, ac] = await Promise.all([
      apiFetch('/api/journalentries').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/academicyears').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/terms').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/chartofaccounts').then(r=>r.json().catch(()=>[])),
    ]);
    setItems(Array.isArray(je)?je:[]); setYears(Array.isArray(yr)?yr:[]); setTerms(Array.isArray(tr)?tr:[]); setAccounts(Array.isArray(ac)?ac:[]);
  })();},[]);

  const reset = () => setForm({ date: '', description: '', postedBy: '', academicYearId: '', termId: '' });

  const submit = async () => {
    const payload:any = { date: form.date, description: form.description?.trim(), postedBy: form.postedBy?.trim(), academicYearId: Number(form.academicYearId), termId: Number(form.termId) };
    if(!payload.date || !payload.description || !payload.postedBy || !payload.academicYearId || !payload.termId) return;
    if(editingId){
      const res = await apiFetch('/api/journalentries',{ method:'PUT', body: JSON.stringify({ id: editingId, ...payload }) });
      const up = await res.json().catch(()=>null); if(res.ok&&up) setItems(prev=>prev.map(i=>i.id===up.id?up:i));
    } else {
      const res = await apiFetch('/api/journalentries',{ method:'POST', body: JSON.stringify(payload) });
      const created = await res.json().catch(()=>null); if(res.ok&&created) setItems(prev=>[created, ...prev]);
    }
    setEditingId(null); reset();
  };

  const addLine = async () => {
    const payload:any = { journalEntryId: Number(lineForm.journalEntryId), accountId: Number(lineForm.accountId), debit: lineForm.debit!==''?Number(lineForm.debit):0, credit: lineForm.credit!==''?Number(lineForm.credit):0 };
    if(!payload.journalEntryId || !payload.accountId) return;
    const res = await apiFetch('/api/journallines',{ method:'POST', body: JSON.stringify(payload) });
    const created = await res.json().catch(()=>null);
    if(res.ok && created){ setItems(prev=>prev.map(j=> j.id===payload.journalEntryId ? { ...j, lines: [created, ...(j.lines||[])] } : j)); }
    setLineForm({ journalEntryId: '', accountId: '', debit: '', credit: '' });
  };

  const edit = (it:any) => { setEditingId(it.id); setForm({ date: it.date?.slice(0,10) ?? '', description: it.description ?? '', postedBy: it.postedBy ?? '', academicYearId: String(it.academicYearId), termId: String(it.termId) }); };
  const remove = async (id:number) => { if(!confirm('Delete journal entry?')) return; const res = await apiFetch('/api/journalentries',{ method:'DELETE', body: JSON.stringify({ id }) }); if(res.ok) setItems(prev=>prev.filter(i=>i.id!==id)); };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Journal Entries</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white p-4 rounded border mb-4">
          <input className="border p-2 rounded" type="date" value={form.date} onChange={e=>setForm({ ...form, date: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Description" value={form.description} onChange={e=>setForm({ ...form, description: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Posted By" value={form.postedBy} onChange={e=>setForm({ ...form, postedBy: e.target.value })} />
          <select className="border p-2 rounded" value={form.academicYearId} onChange={e=>setForm({ ...form, academicYearId: e.target.value })}><option value="">Year</option>{years.map(y=>(<option key={y.id} value={y.id}>{y.yearName??y.name}</option>))}</select>
          <select className="border p-2 rounded" value={form.termId} onChange={e=>setForm({ ...form, termId: e.target.value })}><option value="">Term</option>{terms.map(t=>(<option key={t.id} value={t.id}>{t.name}</option>))}</select>
          <div className="flex items-center gap-2"><button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submit}>{editingId?'Update':'Add'}</button>{editingId&&<button className="border px-4 py-2 rounded" onClick={()=>{ setEditingId(null); reset(); }}>Cancel</button>}</div>
        </div>

        <div className="bg-white border rounded p-4 mb-6">
          <h3 className="font-semibold mb-2">Add Line (API pending)</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select className="border p-2 rounded" value={lineForm.journalEntryId} onChange={e=>setLineForm({ ...lineForm, journalEntryId: e.target.value })}><option value="">Journal</option>{items.map(j=>(<option key={j.id} value={j.id}>JE #{j.id}</option>))}</select>
            <select className="border p-2 rounded" value={lineForm.accountId} onChange={e=>setLineForm({ ...lineForm, accountId: e.target.value })}><option value="">Account</option>{accounts.map(a=>(<option key={a.id} value={a.id}>{a.accountCode} - {a.accountName}</option>))}</select>
            <input className="border p-2 rounded" placeholder="Debit" type="number" value={lineForm.debit} onChange={e=>setLineForm({ ...lineForm, debit: e.target.value })} />
            <input className="border p-2 rounded" placeholder="Credit" type="number" value={lineForm.credit} onChange={e=>setLineForm({ ...lineForm, credit: e.target.value })} />
            <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={addLine}>Add Line</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse bg-white">
            <thead><tr className="bg-gray-200"><th className="p-2 border">#</th><th className="p-2 border">Date</th><th className="p-2 border">Description</th><th className="p-2 border">Posted By</th><th className="p-2 border">Year/Term</th><th className="p-2 border">Lines</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {items.map((it:any, idx:number)=> (
                <tr key={it.id} className="border-t align-top">
                  <td className="p-2 border">{idx+1}</td>
                  <td className="p-2 border">{new Date(it.date).toLocaleDateString()}</td>
                  <td className="p-2 border">{it.description}</td>
                  <td className="p-2 border">{it.postedBy}</td>
                  <td className="p-2 border">{it.academicYearId} / {it.termId}</td>
                  <td className="p-2 border">
                    <ul className="list-disc pl-4">
                      {(it.lines||[]).map((ln:any)=> <li key={ln.id}>{ln.accountId}: D {ln.debit} C {ln.credit}</li>)}
                    </ul>
                  </td>
                  <td className="p-2 border"><div className="flex gap-2"><button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={()=>edit(it)}>Edit</button><button className="bg-red-600 text-white px-2 py-1 rounded" onClick={()=>remove(it.id)}>Delete</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
