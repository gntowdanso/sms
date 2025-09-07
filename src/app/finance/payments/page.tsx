"use client";
import React, { useEffect, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

export default function PaymentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ invoiceId: '', studentId: '', paymentDate: '', amountPaid: '', method: 'CASH', receiptNo: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(()=>{(async()=>{
    const [pay, inv, st] = await Promise.all([
      apiFetch('/api/payments').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/invoices').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/students').then(r=>r.json().catch(()=>[])),
    ]);
    setItems(Array.isArray(pay)?pay:[]); setInvoices(Array.isArray(inv)?inv:[]); setStudents(Array.isArray(st)?st:[]);
  })();},[]);

  const reset = () => setForm({ invoiceId: '', studentId: '', paymentDate: '', amountPaid: '', method: 'CASH', receiptNo: '' });

  const submit = async () => {
    const payload:any = { invoiceId: Number(form.invoiceId), studentId: Number(form.studentId), paymentDate: form.paymentDate, amountPaid: form.amountPaid!==''?Number(form.amountPaid):null, method: form.method, receiptNo: form.receiptNo };
    if(!payload.invoiceId || !payload.studentId || !payload.paymentDate || payload.amountPaid===null || !payload.method || !payload.receiptNo) return;
    if(editingId){
      const res = await apiFetch('/api/payments',{ method:'PUT', body: JSON.stringify({ id: editingId, ...payload }) });
      const up = await res.json().catch(()=>null); if(res.ok&&up) setItems(prev=>prev.map(i=>i.id===up.id?up:i));
    } else {
      const res = await apiFetch('/api/payments',{ method:'POST', body: JSON.stringify(payload) });
      const created = await res.json().catch(()=>null); if(res.ok&&created) setItems(prev=>[created, ...prev]);
    }
    setEditingId(null); reset();
  };

  const edit = (it:any) => { setEditingId(it.id); setForm({ invoiceId: String(it.invoiceId), studentId: String(it.studentId), paymentDate: it.paymentDate?.slice(0,10) ?? '', amountPaid: it.amountPaid ?? '', method: it.method, receiptNo: it.receiptNo ?? '' }); };
  const remove = async (id:number) => { if(!confirm('Delete payment?')) return; const res = await apiFetch('/api/payments',{ method:'DELETE', body: JSON.stringify({ id }) }); if(res.ok) setItems(prev=>prev.filter(i=>i.id!==id)); };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Payments</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white p-4 rounded border mb-4">
          <select className="border p-2 rounded" value={form.invoiceId} onChange={e=>setForm({ ...form, invoiceId: e.target.value })}><option value="">Invoice</option>{invoices.map(i=>(<option key={i.id} value={i.id}>INV #{i.id}</option>))}</select>
          <select className="border p-2 rounded" value={form.studentId} onChange={e=>setForm({ ...form, studentId: e.target.value })}><option value="">Student</option>{students.map(s=>(<option key={s.id} value={s.id}>{s.studentNo?`${s.studentNo} - `:''}{s.firstName}{s.lastName?` ${s.lastName}`:''}</option>))}</select>
          <input className="border p-2 rounded" type="date" value={form.paymentDate} onChange={e=>setForm({ ...form, paymentDate: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Amount Paid" type="number" value={form.amountPaid} onChange={e=>setForm({ ...form, amountPaid: e.target.value })} />
          <select className="border p-2 rounded" value={form.method} onChange={e=>setForm({ ...form, method: e.target.value })}><option>CASH</option><option>BANK</option><option>MOBILEMONEY</option></select>
          <input className="border p-2 rounded" placeholder="Receipt No" value={form.receiptNo} onChange={e=>setForm({ ...form, receiptNo: e.target.value })} />
          <div className="flex items-center gap-2"><button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submit}>{editingId?'Update':'Add'}</button>{editingId&&<button className="border px-4 py-2 rounded" onClick={()=>{ setEditingId(null); reset(); }}>Cancel</button>}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse bg-white">
            <thead><tr className="bg-gray-200"><th className="p-2 border">#</th><th className="p-2 border">Invoice</th><th className="p-2 border">Student</th><th className="p-2 border">Date</th><th className="p-2 border">Amount</th><th className="p-2 border">Method</th><th className="p-2 border">Receipt</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {items.map((it:any, idx:number)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx+1}</td>
                  <td className="p-2 border">{it.invoiceId}</td>
                  <td className="p-2 border">{it.studentId}</td>
                  <td className="p-2 border">{new Date(it.paymentDate).toLocaleDateString()}</td>
                  <td className="p-2 border">{it.amountPaid}</td>
                  <td className="p-2 border">{it.method}</td>
                  <td className="p-2 border">{it.receiptNo}</td>
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
