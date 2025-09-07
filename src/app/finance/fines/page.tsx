"use client";
import React, { useEffect, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

export default function FinesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ studentId: '', reason: '', amount: '', date: '', academicYearId: '', termId: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  useEffect(()=>{(async()=>{
    const [fn, st, yr, tr] = await Promise.all([
      apiFetch('/api/fines').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/students').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/academicyears').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/terms').then(r=>r.json().catch(()=>[])),
    ]);
    setItems(Array.isArray(fn)?fn:[]); setStudents(st||[]); setYears(yr||[]); setTerms(tr||[]);
  })();},[]);

  const reset = () => setForm({ studentId: '', reason: '', amount: '', date: '', academicYearId: '', termId: '' });

  const submit = async () => {
    const payload:any = { studentId: Number(form.studentId), reason: form.reason?.trim(), amount: form.amount!==''?Number(form.amount):null, date: form.date, academicYearId: Number(form.academicYearId), termId: Number(form.termId) };
    if(!payload.studentId || !payload.reason || payload.amount===null || !payload.date || !payload.academicYearId || !payload.termId) return;
    if(editingId){
      const res = await apiFetch('/api/fines',{ method:'PUT', body: JSON.stringify({ id: editingId, ...payload }) });
      const up = await res.json().catch(()=>null); if(res.ok&&up) setItems(prev=>prev.map(i=>i.id===up.id?up:i));
    } else {
      const res = await apiFetch('/api/fines',{ method:'POST', body: JSON.stringify(payload) });
      const created = await res.json().catch(()=>null); if(res.ok&&created) setItems(prev=>[created, ...prev]);
    }
    setEditingId(null); reset();
  };

  const edit = (it:any) => { setEditingId(it.id); setForm({ studentId: String(it.studentId), reason: it.reason ?? '', amount: it.amount ?? '', date: it.date?.slice(0,10) ?? '', academicYearId: String(it.academicYearId), termId: String(it.termId) }); };
  const remove = async (id:number) => { if(!confirm('Delete fine?')) return; const res = await apiFetch('/api/fines',{ method:'DELETE', body: JSON.stringify({ id }) }); if(res.ok) setItems(prev=>prev.filter(i=>i.id!==id)); };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Fines</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white p-4 rounded border mb-4">
          <select className="border p-2 rounded" value={form.studentId} onChange={e=>setForm({ ...form, studentId: e.target.value })}><option value="">Student</option>{students.map(s=>(<option key={s.id} value={s.id}>{s.studentNo?`${s.studentNo} - `:''}{s.firstName}{s.lastName?` ${s.lastName}`:''}</option>))}</select>
          <input className="border p-2 rounded" placeholder="Reason" value={form.reason} onChange={e=>setForm({ ...form, reason: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Amount" type="number" value={form.amount} onChange={e=>setForm({ ...form, amount: e.target.value })} />
          <input className="border p-2 rounded" type="date" value={form.date} onChange={e=>setForm({ ...form, date: e.target.value })} />
          <select className="border p-2 rounded" value={form.academicYearId} onChange={e=>setForm({ ...form, academicYearId: e.target.value })}><option value="">Year</option>{years.map(y=>(<option key={y.id} value={y.id}>{y.yearName??y.name}</option>))}</select>
          <select className="border p-2 rounded" value={form.termId} onChange={e=>setForm({ ...form, termId: e.target.value })}><option value="">Term</option>{terms.map(t=>(<option key={t.id} value={t.id}>{t.name}</option>))}</select>
          <div className="flex items-center gap-2"><button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submit}>{editingId?'Update':'Add'}</button>{editingId&&<button className="border px-4 py-2 rounded" onClick={()=>{ setEditingId(null); reset(); }}>Cancel</button>}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse bg-white">
            <thead><tr className="bg-gray-200"><th className="p-2 border">#</th><th className="p-2 border">Student</th><th className="p-2 border">Reason</th><th className="p-2 border">Amount</th><th className="p-2 border">Date</th><th className="p-2 border">Year/Term</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {items.map((it:any, idx:number)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx+1}</td>
                  <td className="p-2 border">{it.studentId}</td>
                  <td className="p-2 border">{it.reason}</td>
                  <td className="p-2 border">{it.amount}</td>
                  <td className="p-2 border">{new Date(it.date).toLocaleDateString()}</td>
                  <td className="p-2 border">{it.academicYearId} / {it.termId}</td>
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
