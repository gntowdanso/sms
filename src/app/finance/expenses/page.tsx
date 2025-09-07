"use client";
import React, { useEffect, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

export default function ExpensesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ category: 'OPERATIONS', amount: '', date: '', approvedBy: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(()=>{(async()=>{
    const ex = await apiFetch('/api/expenses').then(r=>r.json().catch(()=>[]));
    setItems(Array.isArray(ex)?ex:[]);
  })();},[]);

  const reset = () => setForm({ category: 'OPERATIONS', amount: '', date: '', approvedBy: '' });

  const submit = async () => {
    const payload:any = { category: form.category, amount: form.amount!==''?Number(form.amount):null, date: form.date, approvedBy: form.approvedBy?.trim() };
    if(!payload.category || payload.amount===null || !payload.date || !payload.approvedBy) return;
    if(editingId){
      const res = await apiFetch('/api/expenses',{ method:'PUT', body: JSON.stringify({ id: editingId, ...payload }) });
      const up = await res.json().catch(()=>null); if(res.ok&&up) setItems(prev=>prev.map(i=>i.id===up.id?up:i));
    } else {
      const res = await apiFetch('/api/expenses',{ method:'POST', body: JSON.stringify(payload) });
      const created = await res.json().catch(()=>null); if(res.ok&&created) setItems(prev=>[created, ...prev]);
    }
    setEditingId(null); reset();
  };

  const edit = (it:any) => { setEditingId(it.id); setForm({ category: it.category, amount: it.amount ?? '', date: it.date?.slice(0,10) ?? '', approvedBy: it.approvedBy ?? '' }); };
  const remove = async (id:number) => { if(!confirm('Delete expense?')) return; const res = await apiFetch('/api/expenses',{ method:'DELETE', body: JSON.stringify({ id }) }); if(res.ok) setItems(prev=>prev.filter(i=>i.id!==id)); };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Expenses</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded border mb-4">
          <select className="border p-2 rounded" value={form.category} onChange={e=>setForm({ ...form, category: e.target.value })}>
            <option>OPERATIONS</option>
            <option>MAINTENANCE</option>
            <option>UTILITIES</option>
            <option>SALARIES</option>
            <option>SUPPLIES</option>
            <option>OTHER</option>
          </select>
          <input className="border p-2 rounded" placeholder="Amount" type="number" value={form.amount} onChange={e=>setForm({ ...form, amount: e.target.value })} />
          <input className="border p-2 rounded" type="date" value={form.date} onChange={e=>setForm({ ...form, date: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Approved By" value={form.approvedBy} onChange={e=>setForm({ ...form, approvedBy: e.target.value })} />
          <div className="flex items-center gap-2"><button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submit}>{editingId?'Update':'Add'}</button>{editingId&&<button className="border px-4 py-2 rounded" onClick={()=>{ setEditingId(null); reset(); }}>Cancel</button>}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse bg-white">
            <thead><tr className="bg-gray-200"><th className="p-2 border">#</th><th className="p-2 border">Category</th><th className="p-2 border">Amount</th><th className="p-2 border">Date</th><th className="p-2 border">Approved By</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {items.map((it:any, idx:number)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx+1}</td>
                  <td className="p-2 border">{it.category}</td>
                  <td className="p-2 border">{it.amount}</td>
                  <td className="p-2 border">{new Date(it.date).toLocaleDateString()}</td>
                  <td className="p-2 border">{it.approvedBy}</td>
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
