"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

export default function FeeStructuresPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ classId: '', academicYearId: '', termId: '', feeItemId: '', amount: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  const [classes, setClasses] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [feeItems, setFeeItems] = useState<any[]>([]);

  useEffect(() => { (async () => {
    const [fs, cl, yr, tr, fi] = await Promise.all([
      apiFetch('/api/feestructures').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/classes').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/academicyears').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/terms').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/feeitems').then(r=>r.json().catch(()=>[])),
    ]);
    setItems(Array.isArray(fs)?fs:[]); setClasses(Array.isArray(cl)?cl:[]); setYears(Array.isArray(yr)?yr:[]); setTerms(Array.isArray(tr)?tr:[]); setFeeItems(Array.isArray(fi)?fi:[]);
  })(); }, []);

  const reset = () => setForm({ classId: '', academicYearId: '', termId: '', feeItemId: '', amount: '' });
  const submit = async () => {
    const payload: any = { classId: Number(form.classId), academicYearId: Number(form.academicYearId), termId: Number(form.termId), feeItemId: Number(form.feeItemId), amount: form.amount!==''?Number(form.amount):null };
    if (!payload.classId || !payload.academicYearId || !payload.termId || !payload.feeItemId || payload.amount===null) return;
    if (editingId) {
      const res = await apiFetch('/api/feestructures', { method:'PUT', body: JSON.stringify({ id: editingId, ...payload }) });
      const up = await res.json().catch(()=>null); if(res.ok&&up) setItems(prev=>prev.map(i=>i.id===up.id?up:i));
    } else {
      const res = await apiFetch('/api/feestructures', { method:'POST', body: JSON.stringify(payload) });
      const created = await res.json().catch(()=>null); if(res.ok&&created) setItems(prev=>[created,...prev]);
    }
    setEditingId(null); reset();
  };
  const edit = (it:any) => { setEditingId(it.id); setForm({ classId: String(it.classId), academicYearId: String(it.academicYearId), termId: String(it.termId), feeItemId: String(it.feeItemId), amount: it.amount }); };
  const remove = async (id:number) => { if(!confirm('Delete fee structure?')) return; const res = await apiFetch('/api/feestructures',{ method:'DELETE', body: JSON.stringify({ id })}); if(res.ok) setItems(prev=>prev.filter(i=>i.id!==id)); };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Fee Structures</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded border mb-4">
          <select className="border p-2 rounded" value={form.classId} onChange={e=>setForm({ ...form, classId: e.target.value })}><option value="">Class</option>{classes.map(c=>(<option key={c.id} value={c.id}>{c.name??`Class #${c.id}`}</option>))}</select>
          <select className="border p-2 rounded" value={form.academicYearId} onChange={e=>setForm({ ...form, academicYearId: e.target.value })}><option value="">Year</option>{years.map(y=>(<option key={y.id} value={y.id}>{y.yearName??y.name}</option>))}</select>
          <select className="border p-2 rounded" value={form.termId} onChange={e=>setForm({ ...form, termId: e.target.value })}><option value="">Term</option>{terms.map(t=>(<option key={t.id} value={t.id}>{t.name}</option>))}</select>
          <select className="border p-2 rounded" value={form.feeItemId} onChange={e=>setForm({ ...form, feeItemId: e.target.value })}><option value="">Fee Item</option>{feeItems.map(f=>(<option key={f.id} value={f.id}>{f.name}</option>))}</select>
          <input className="border p-2 rounded" placeholder="Amount" type="number" value={form.amount} onChange={e=>setForm({ ...form, amount: e.target.value })} />
          <div className="flex items-center gap-2"><button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submit}>{editingId?'Update':'Add'}</button>{editingId&&<button className="border px-4 py-2 rounded" onClick={()=>{ setEditingId(null); reset(); }}>Cancel</button>}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse bg-white">
            <thead><tr className="bg-gray-200"><th className="p-2 border">#</th><th className="p-2 border">Class</th><th className="p-2 border">Year</th><th className="p-2 border">Term</th><th className="p-2 border">Item</th><th className="p-2 border">Amount</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {items.map((it:any, idx:number)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx+1}</td>
                  <td className="p-2 border">{it.classId}</td>
                  <td className="p-2 border">{it.academicYearId}</td>
                  <td className="p-2 border">{it.termId}</td>
                  <td className="p-2 border">{it.feeItem?.name ?? it.feeItemId}</td>
                  <td className="p-2 border">{it.amount}</td>
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
