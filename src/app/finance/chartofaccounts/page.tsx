"use client";
import React, { useEffect, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

export default function ChartOfAccountsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ accountCode: '', accountName: '', accountTypeId: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [types, setTypes] = useState<any[]>([]);

  useEffect(()=>{(async()=>{
    const [ac, tp] = await Promise.all([
      apiFetch('/api/chartofaccounts').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/accounttypes').then(r=>r.json().catch(()=>[])),
    ]);
    setItems(Array.isArray(ac)?ac:[]); setTypes(Array.isArray(tp)?tp:[]);
  })();},[]);

  const reset = () => setForm({ accountCode: '', accountName: '', accountTypeId: '' });
  const submit = async () => {
    const payload:any = { accountCode: form.accountCode?.trim(), accountName: form.accountName?.trim(), accountTypeId: Number(form.accountTypeId) };
    if(!payload.accountCode || !payload.accountName || !payload.accountTypeId) return;
    if(editingId){ const res = await apiFetch('/api/chartofaccounts',{ method:'PUT', body: JSON.stringify({ id: editingId, ...payload })}); const up=await res.json().catch(()=>null); if(res.ok&&up) setItems(prev=>prev.map(i=>i.id===up.id?up:i)); }
    else { const res = await apiFetch('/api/chartofaccounts',{ method:'POST', body: JSON.stringify(payload)}); const created=await res.json().catch(()=>null); if(res.ok&&created) setItems(prev=>[created,...prev]); }
    setEditingId(null); reset();
  };
  const edit = (it:any) => { setEditingId(it.id); setForm({ accountCode: it.accountCode ?? '', accountName: it.accountName ?? '', accountTypeId: String(it.accountTypeId) }); };
  const remove = async (id:number) => { if(!confirm('Delete account?')) return; const res = await apiFetch('/api/chartofaccounts',{ method:'DELETE', body: JSON.stringify({ id })}); if(res.ok) setItems(prev=>prev.filter(i=>i.id!==id)); };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Chart of Accounts</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded border mb-4">
          <input className="border p-2 rounded" placeholder="Account Code" value={form.accountCode} onChange={e=>setForm({ ...form, accountCode: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Account Name" value={form.accountName} onChange={e=>setForm({ ...form, accountName: e.target.value })} />
          <select className="border p-2 rounded" value={form.accountTypeId} onChange={e=>setForm({ ...form, accountTypeId: e.target.value })}><option value="">Account Type</option>{types.map(t=>(<option key={t.id} value={t.id}>{t.name} ({t.code})</option>))}</select>
          <div className="flex items-center gap-2"><button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submit}>{editingId?'Update':'Add'}</button>{editingId&&<button className="border px-4 py-2 rounded" onClick={()=>{ setEditingId(null); reset(); }}>Cancel</button>}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse bg-white">
            <thead><tr className="bg-gray-200"><th className="p-2 border">#</th><th className="p-2 border">Code</th><th className="p-2 border">Name</th><th className="p-2 border">Type</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {items.map((it:any, idx:number)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx+1}</td>
                  <td className="p-2 border">{it.accountCode}</td>
                  <td className="p-2 border">{it.accountName}</td>
                  <td className="p-2 border">{it.accountTypeId}</td>
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
