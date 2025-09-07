"use client";
import React, { useEffect, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

export default function FinancialReportsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ academicYearId: '', termId: '', reportTitle: '', generatedDate: '', fileUrl: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [years, setYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  useEffect(()=>{(async()=>{
    const [re, yr, tr] = await Promise.all([
      apiFetch('/api/financialreports').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/academicyears').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/terms').then(r=>r.json().catch(()=>[])),
    ]);
    setItems(Array.isArray(re)?re:[]); setYears(Array.isArray(yr)?yr:[]); setTerms(Array.isArray(tr)?tr:[]);
  })();},[]);

  const reset = () => setForm({ academicYearId: '', termId: '', reportTitle: '', generatedDate: '', fileUrl: '' });

  const submit = async () => {
    const payload:any = { academicYearId: Number(form.academicYearId), termId: Number(form.termId), reportTitle: form.reportTitle?.trim(), generatedDate: form.generatedDate, fileUrl: form.fileUrl?.trim() };
    if(!payload.academicYearId || !payload.termId || !payload.reportTitle || !payload.generatedDate || !payload.fileUrl) return;
    if(editingId){
      const res = await apiFetch('/api/financialreports',{ method:'PUT', body: JSON.stringify({ id: editingId, ...payload }) });
      const up = await res.json().catch(()=>null); if(res.ok&&up) setItems(prev=>prev.map(i=>i.id===up.id?up:i));
    } else {
      const res = await apiFetch('/api/financialreports',{ method:'POST', body: JSON.stringify(payload) });
      const created = await res.json().catch(()=>null); if(res.ok&&created) setItems(prev=>[created, ...prev]);
    }
    setEditingId(null); reset();
  };

  const edit = (it:any) => { setEditingId(it.id); setForm({ academicYearId: String(it.academicYearId), termId: String(it.termId), reportTitle: it.reportTitle ?? '', generatedDate: it.generatedDate?.slice(0,10) ?? '', fileUrl: it.fileUrl ?? '' }); };
  const remove = async (id:number) => { if(!confirm('Delete report?')) return; const res = await apiFetch('/api/financialreports',{ method:'DELETE', body: JSON.stringify({ id }) }); if(res.ok) setItems(prev=>prev.filter(i=>i.id!==id)); };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Financial Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white p-4 rounded border mb-4">
          <select className="border p-2 rounded" value={form.academicYearId} onChange={e=>setForm({ ...form, academicYearId: e.target.value })}><option value="">Year</option>{years.map(y=>(<option key={y.id} value={y.id}>{y.yearName??y.name}</option>))}</select>
          <select className="border p-2 rounded" value={form.termId} onChange={e=>setForm({ ...form, termId: e.target.value })}><option value="">Term</option>{terms.map(t=>(<option key={t.id} value={t.id}>{t.name}</option>))}</select>
          <input className="border p-2 rounded" placeholder="Title" value={form.reportTitle} onChange={e=>setForm({ ...form, reportTitle: e.target.value })} />
          <input className="border p-2 rounded" type="date" value={form.generatedDate} onChange={e=>setForm({ ...form, generatedDate: e.target.value })} />
          <input className="border p-2 rounded" placeholder="File URL" value={form.fileUrl} onChange={e=>setForm({ ...form, fileUrl: e.target.value })} />
          <div className="flex items-center gap-2"><button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submit}>{editingId?'Update':'Add'}</button>{editingId&&<button className="border px-4 py-2 rounded" onClick={()=>{ setEditingId(null); reset(); }}>Cancel</button>}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse bg-white">
            <thead><tr className="bg-gray-200"><th className="p-2 border">#</th><th className="p-2 border">Year</th><th className="p-2 border">Term</th><th className="p-2 border">Title</th><th className="p-2 border">Date</th><th className="p-2 border">File</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {items.map((it:any, idx:number)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx+1}</td>
                  <td className="p-2 border">{it.academicYearId}</td>
                  <td className="p-2 border">{it.termId}</td>
                  <td className="p-2 border">{it.reportTitle}</td>
                  <td className="p-2 border">{new Date(it.generatedDate).toLocaleDateString()}</td>
                  <td className="p-2 border"><a className="text-blue-600 underline" href={it.fileUrl} target="_blank" rel="noreferrer">Open</a></td>
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
