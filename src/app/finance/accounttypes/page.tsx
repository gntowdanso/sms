"use client";
import React, { useEffect, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

export default function AccountTypesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ name: '', code: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(()=>{(async()=>{ const it = await apiFetch('/api/accounttypes').then(r=>r.json().catch(()=>[])); setItems(Array.isArray(it)?it:[]); })();},[]);

  const reset = () => setForm({ name: '', code: '' });
  const submit = async () => {
    const payload:any = { name: form.name?.trim(), code: form.code?.trim() };
    if(!payload.name || !payload.code) return;
    if(editingId){ const res = await apiFetch('/api/accounttypes',{ method:'PUT', body: JSON.stringify({ id: editingId, ...payload })}); const up=await res.json().catch(()=>null); if(res.ok&&up) setItems(prev=>prev.map(i=>i.id===up.id?up:i)); }
    else { const res = await apiFetch('/api/accounttypes',{ method:'POST', body: JSON.stringify(payload)}); const created=await res.json().catch(()=>null); if(res.ok&&created) setItems(prev=>[created,...prev]); }
    setEditingId(null); reset();
  };
  const edit = (it:any) => { setEditingId(it.id); setForm({ name: it.name ?? '', code: it.code ?? '' }); };
  const remove = async (id:number) => { if(!confirm('Delete account type?')) return; const res = await apiFetch('/api/accounttypes',{ method:'DELETE', body: JSON.stringify({ id })}); if(res.ok) setItems(prev=>prev.filter(i=>i.id!==id)); };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Account Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-4 rounded border mb-4">
          <input className="border p-2 rounded" placeholder="Name" value={form.name} onChange={e=>setForm({ ...form, name: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Code" value={form.code} onChange={e=>setForm({ ...form, code: e.target.value })} />
          <div className="flex items-center gap-2"><button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submit}>{editingId?'Update':'Add'}</button>{editingId&&<button className="border px-4 py-2 rounded" onClick={()=>{ setEditingId(null); reset(); }}>Cancel</button>}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse bg-white">
            <thead><tr className="bg-gray-200"><th className="p-2 border">#</th><th className="p-2 border">Name</th><th className="p-2 border">Code</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {items.map((it:any, idx:number)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx+1}</td>
                  <td className="p-2 border">{it.name}</td>
                  <td className="p-2 border">{it.code}</td>
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
