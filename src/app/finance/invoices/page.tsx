"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

export default function InvoicesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ studentId: '', academicYearId: '', termId: '', issueDate: '', dueDate: '', totalAmount: '', status: 'UNPAID' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [feeItems, setFeeItems] = useState<any[]>([]);

  const [lineForm, setLineForm] = useState<any>({ invoiceId: '', feeItemId: '', amount: '' });
  const [paymentForm, setPaymentForm] = useState<any>({ invoiceId: '', studentId: '', paymentDate: '', amountPaid: '', method: 'CASH', receiptNo: '' });

  useEffect(() => { (async () => {
    const [inv, st, yr, tr, fi] = await Promise.all([
      apiFetch('/api/invoices').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/students').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/academicyears').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/terms').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/feeitems').then(r=>r.json().catch(()=>[])),
    ]);
    setItems(Array.isArray(inv)?inv:[]); setStudents(Array.isArray(st)?st:[]); setYears(Array.isArray(yr)?yr:[]); setTerms(Array.isArray(tr)?tr:[]); setFeeItems(Array.isArray(fi)?fi:[]);
  })(); }, []);

  const reset = () => setForm({ studentId: '', academicYearId: '', termId: '', issueDate: '', dueDate: '', totalAmount: '', status: 'UNPAID' });
  const submit = async () => {
    const payload: any = { studentId: Number(form.studentId), academicYearId: Number(form.academicYearId), termId: Number(form.termId), issueDate: form.issueDate, dueDate: form.dueDate, totalAmount: form.totalAmount!==''?Number(form.totalAmount):null, status: form.status };
    if (!payload.studentId || !payload.academicYearId || !payload.termId || !payload.issueDate || !payload.dueDate || payload.totalAmount===null || !payload.status) return;
    if (editingId) {
      const res = await apiFetch('/api/invoices', { method:'PUT', body: JSON.stringify({ id: editingId, ...payload }) });
      const up = await res.json().catch(()=>null); if(res.ok&&up) setItems(prev=>prev.map(i=>i.id===up.id?up:i));
    } else {
      const res = await apiFetch('/api/invoices', { method:'POST', body: JSON.stringify(payload) });
      const created = await res.json().catch(()=>null); if(res.ok&&created) setItems(prev=>[created,...prev]);
    }
    setEditingId(null); reset();
  };

  const edit = (it:any) => { setEditingId(it.id); setForm({ studentId: String(it.studentId), academicYearId: String(it.academicYearId), termId: String(it.termId), issueDate: it.issueDate?.slice(0,10) ?? '', dueDate: it.dueDate?.slice(0,10) ?? '', totalAmount: it.totalAmount ?? '', status: it.status }); };
  const remove = async (id:number) => { if(!confirm('Delete invoice?')) return; const res = await apiFetch('/api/invoices',{ method:'DELETE', body: JSON.stringify({ id })}); if(res.ok) setItems(prev=>prev.filter(i=>i.id!==id)); };

  const addLine = async () => {
    const payload:any = { invoiceId: Number(lineForm.invoiceId), feeItemId: Number(lineForm.feeItemId), amount: lineForm.amount!==''?Number(lineForm.amount):null };
    if(!payload.invoiceId || !payload.feeItemId || payload.amount===null) return;
    const res = await apiFetch('/api/invoicelines',{ method:'POST', body: JSON.stringify(payload) });
    const created = await res.json().catch(()=>null); if(res.ok&&created) setItems(prev=>prev.map(inv=> inv.id===payload.invoiceId ? { ...inv, lines: [created, ...(inv.lines||[])] } : inv));
    setLineForm({ invoiceId: '', feeItemId: '', amount: '' });
  };
  const addPayment = async () => {
    const payload:any = { invoiceId: Number(paymentForm.invoiceId), studentId: Number(paymentForm.studentId), paymentDate: paymentForm.paymentDate, amountPaid: paymentForm.amountPaid!==''?Number(paymentForm.amountPaid):null, method: paymentForm.method, receiptNo: paymentForm.receiptNo };
    if(!payload.invoiceId || !payload.studentId || !payload.paymentDate || payload.amountPaid===null || !payload.method || !payload.receiptNo) return;
    const res = await apiFetch('/api/payments',{ method:'POST', body: JSON.stringify(payload) });
    const created = await res.json().catch(()=>null); if(res.ok&&created) setItems(prev=>prev.map(inv=> inv.id===payload.invoiceId ? { ...inv, payments: [created, ...(inv.payments||[])] } : inv));
    setPaymentForm({ invoiceId: '', studentId: '', paymentDate: '', amountPaid: '', method: 'CASH', receiptNo: '' });
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Invoices</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded border mb-4">
          <select className="border p-2 rounded" value={form.studentId} onChange={e=>setForm({ ...form, studentId: e.target.value })}><option value="">Student</option>{students.map(s=>(<option key={s.id} value={s.id}>{s.studentNo?`${s.studentNo} - `:''}{s.firstName}{s.lastName?` ${s.lastName}`:''}</option>))}</select>
          <select className="border p-2 rounded" value={form.academicYearId} onChange={e=>setForm({ ...form, academicYearId: e.target.value })}><option value="">Year</option>{years.map(y=>(<option key={y.id} value={y.id}>{y.yearName??y.name}</option>))}</select>
          <select className="border p-2 rounded" value={form.termId} onChange={e=>setForm({ ...form, termId: e.target.value })}><option value="">Term</option>{terms.map(t=>(<option key={t.id} value={t.id}>{t.name}</option>))}</select>
          <input className="border p-2 rounded" type="date" value={form.issueDate} onChange={e=>setForm({ ...form, issueDate: e.target.value })} />
          <input className="border p-2 rounded" type="date" value={form.dueDate} onChange={e=>setForm({ ...form, dueDate: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Total Amount" type="number" value={form.totalAmount} onChange={e=>setForm({ ...form, totalAmount: e.target.value })} />
          <select className="border p-2 rounded" value={form.status} onChange={e=>setForm({ ...form, status: e.target.value })}><option>UNPAID</option><option>PAID</option><option>PARTIAL</option></select>
          <div className="flex items-center gap-2"><button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submit}>{editingId?'Update':'Add'}</button>{editingId&&<button className="border px-4 py-2 rounded" onClick={()=>{ setEditingId(null); reset(); }}>Cancel</button>}</div>
        </div>

        <div className="bg-white border rounded p-4 mb-4">
          <h3 className="font-semibold mb-2">Add Invoice Line</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select className="border p-2 rounded" value={lineForm.invoiceId} onChange={e=>setLineForm({ ...lineForm, invoiceId: e.target.value })}><option value="">Invoice</option>{items.map(i=>(<option key={i.id} value={i.id}>INV #{i.id} - Student {i.studentId}</option>))}</select>
            <select className="border p-2 rounded" value={lineForm.feeItemId} onChange={e=>setLineForm({ ...lineForm, feeItemId: e.target.value })}><option value="">Fee Item</option>{feeItems.map(f=>(<option key={f.id} value={f.id}>{f.name}</option>))}</select>
            <input className="border p-2 rounded" placeholder="Amount" type="number" value={lineForm.amount} onChange={e=>setLineForm({ ...lineForm, amount: e.target.value })} />
            <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={addLine}>Add Line</button>
          </div>
        </div>

        <div className="bg-white border rounded p-4 mb-6">
          <h3 className="font-semibold mb-2">Record Payment</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select className="border p-2 rounded" value={paymentForm.invoiceId} onChange={e=>setPaymentForm({ ...paymentForm, invoiceId: e.target.value })}><option value="">Invoice</option>{items.map(i=>(<option key={i.id} value={i.id}>INV #{i.id}</option>))}</select>
            <select className="border p-2 rounded" value={paymentForm.studentId} onChange={e=>setPaymentForm({ ...paymentForm, studentId: e.target.value })}><option value="">Student</option>{students.map(s=>(<option key={s.id} value={s.id}>{s.studentNo?`${s.studentNo} - `:''}{s.firstName}{s.lastName?` ${s.lastName}`:''}</option>))}</select>
            <input className="border p-2 rounded" type="date" value={paymentForm.paymentDate} onChange={e=>setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} />
            <input className="border p-2 rounded" placeholder="Amount Paid" type="number" value={paymentForm.amountPaid} onChange={e=>setPaymentForm({ ...paymentForm, amountPaid: e.target.value })} />
            <select className="border p-2 rounded" value={paymentForm.method} onChange={e=>setPaymentForm({ ...paymentForm, method: e.target.value })}><option>CASH</option><option>BANK</option><option>MOBILEMONEY</option></select>
            <input className="border p-2 rounded" placeholder="Receipt No" value={paymentForm.receiptNo} onChange={e=>setPaymentForm({ ...paymentForm, receiptNo: e.target.value })} />
            <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={addPayment}>Record</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse bg-white">
            <thead><tr className="bg-gray-200"><th className="p-2 border">#</th><th className="p-2 border">Student</th><th className="p-2 border">Issue</th><th className="p-2 border">Due</th><th className="p-2 border">Amount</th><th className="p-2 border">Status</th><th className="p-2 border">Lines</th><th className="p-2 border">Payments</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {items.map((it:any, idx:number)=> (
                <tr key={it.id} className="border-t align-top">
                  <td className="p-2 border">{idx+1}</td>
                  <td className="p-2 border">{it.studentId}</td>
                  <td className="p-2 border">{new Date(it.issueDate).toLocaleDateString()}</td>
                  <td className="p-2 border">{new Date(it.dueDate).toLocaleDateString()}</td>
                  <td className="p-2 border">{it.totalAmount}</td>
                  <td className="p-2 border">{it.status}</td>
                  <td className="p-2 border">
                    <ul className="list-disc pl-4">
                      {(it.lines||[]).map((ln:any)=> <li key={ln.id}>Item {ln.feeItemId}: {ln.amount}</li>)}
                    </ul>
                  </td>
                  <td className="p-2 border">
                    <ul className="list-disc pl-4">
                      {(it.payments||[]).map((p:any)=> <li key={p.id}>{new Date(p.paymentDate).toLocaleDateString()} - {p.amountPaid} ({p.method})</li>)}
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
