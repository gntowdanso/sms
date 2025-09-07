"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

type FeeItem = { id: number; name: string; description?: string | null; defaultAmount: number; isOptional: boolean };

export default function FeeItemsPage() {
  const [items, setItems] = useState<FeeItem[]>([]);
  const [form, setForm] = useState<any>({ name: '', description: '', defaultAmount: '', isOptional: false });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => { (async () => { const res = await apiFetch('/api/feeitems'); const data = await res.json().catch(() => []); setItems(Array.isArray(data) ? data : []); })(); }, []);
  const reset = () => setForm({ name: '', description: '', defaultAmount: '', isOptional: false });

  const submit = async () => {
    const payload: any = { name: form.name?.trim(), description: form.description?.trim() || null, defaultAmount: form.defaultAmount !== '' ? Number(form.defaultAmount) : null, isOptional: !!form.isOptional };
    if (!payload.name || payload.defaultAmount === null) return;
    if (editingId) {
      const res = await apiFetch('/api/feeitems', { method: 'PUT', body: JSON.stringify({ id: editingId, ...payload }) });
      const up = await res.json().catch(() => null); if (res.ok && up) setItems(prev => prev.map(i => i.id === up.id ? up : i));
    } else {
      const res = await apiFetch('/api/feeitems', { method: 'POST', body: JSON.stringify(payload) });
      const created = await res.json().catch(() => null); if (res.ok && created) setItems(prev => [created, ...prev]);
    }
    setEditingId(null); reset();
  };

  const edit = (it: FeeItem) => { setEditingId(it.id); setForm({ name: it.name, description: it.description ?? '', defaultAmount: it.defaultAmount, isOptional: it.isOptional }); };
  const remove = async (id: number) => { if (!confirm('Delete fee item?')) return; const res = await apiFetch('/api/feeitems', { method: 'DELETE', body: JSON.stringify({ id }) }); if (res.ok) setItems(prev => prev.filter(i => i.id !== id)); };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Fee Items</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded border mb-4">
          <input className="border p-2 rounded" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <input className="border p-2 rounded" type="number" placeholder="Default Amount" value={form.defaultAmount} onChange={e => setForm({ ...form, defaultAmount: e.target.value })} />
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isOptional} onChange={e => setForm({ ...form, isOptional: e.target.checked })} /> Optional</label>
          <div className="flex items-center gap-2"><button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submit}>{editingId ? 'Update' : 'Add'}</button>{editingId && <button className="border px-4 py-2 rounded" onClick={() => { setEditingId(null); reset(); }}>Cancel</button>}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse bg-white">
            <thead><tr className="bg-gray-200"><th className="p-2 border">#</th><th className="p-2 border">Name</th><th className="p-2 border">Amount</th><th className="p-2 border">Optional</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx + 1}</td>
                  <td className="p-2 border">{it.name}</td>
                  <td className="p-2 border">{it.defaultAmount}</td>
                  <td className="p-2 border">{it.isOptional ? 'Yes' : 'No'}</td>
                  <td className="p-2 border"><div className="flex gap-2"><button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => edit(it)}>Edit</button><button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => remove(it.id)}>Delete</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
