"use client";
import React, { useEffect, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

export default function LedgersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState<string>('');

  const load = async (accId?: string) => {
    const qs = accId ? `?accountId=${accId}` : '';
    const list = await apiFetch('/api/ledgers'+qs).then(r=>r.json().catch(()=>[]));
    setItems(Array.isArray(list)?list:[]);
  };

  useEffect(()=>{(async()=>{
    const [ac] = await Promise.all([
      apiFetch('/api/chartofaccounts').then(r=>r.json().catch(()=>[])),
    ]);
    setAccounts(Array.isArray(ac)?ac:[]);
    load();
  })();},[]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Ledgers</h2>
        <div className="bg-white p-4 border rounded mb-4 flex gap-3 items-center">
          <select className="border p-2 rounded" value={accountId} onChange={e=>{ setAccountId(e.target.value); load(e.target.value); }}>
            <option value="">All Accounts</option>
            {accounts.map((a:any)=> (<option key={a.id} value={a.id}>{a.accountCode} - {a.accountName}</option>))}
          </select>
          <button className="border px-3 py-2 rounded" onClick={()=>load(accountId||undefined)}>Refresh</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse bg-white">
            <thead><tr className="bg-gray-200"><th className="p-2 border">#</th><th className="p-2 border">Account</th><th className="p-2 border">Date</th><th className="p-2 border">Debit</th><th className="p-2 border">Credit</th><th className="p-2 border">Balance</th></tr></thead>
            <tbody>
              {items.map((it:any, idx:number)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 border">{idx+1}</td>
                  <td className="p-2 border">{it.account?.accountCode ?? it.accountId}</td>
                  <td className="p-2 border">{new Date(it.date).toLocaleDateString()}</td>
                  <td className="p-2 border">{it.debit}</td>
                  <td className="p-2 border">{it.credit}</td>
                  <td className="p-2 border">{it.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
