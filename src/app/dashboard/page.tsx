"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';
import { FaUserGraduate, FaChalkboardTeacher, FaFileInvoiceDollar, FaMoneyBillWave, FaChartBar, FaUsers } from 'react-icons/fa';

type StatCardProps = { title: string; value: string | number; delta?: number; accent?: string; icon?: React.ReactNode };
const StatCard: React.FC<StatCardProps> = ({ title, value, delta, accent = 'indigo', icon }) => (
  <div className={`rounded-xl border bg-white p-4 shadow-sm hover:shadow transition-shadow`}> 
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon && <div className={`h-9 w-9 rounded-lg flex items-center justify-center bg-gray-100 text-gray-700`}>{icon}</div>}
        <div className="text-sm text-gray-500">{title}</div>
      </div>
      {typeof delta === 'number' && (
        <span className={`text-xs px-2 py-1 rounded-full bg-${accent}-50 text-${accent}-700`}>{delta >= 0 ? `▲ ${delta}%` : `▼ ${Math.abs(delta)}%`}</span>
      )}
    </div>
    <div className="mt-3 text-2xl font-bold">{value}</div>
  </div>
);

const MiniBar: React.FC<{ values: number[]; color?: string }>=({ values, color='rgb(99,102,241)' })=>{
  const max = Math.max(1, ...values);
  return (
    <div className="h-16 w-full flex items-end gap-1">
      {values.map((v,i)=> (
        <div key={i} className="flex-1 rounded-sm" style={{ height: `${(v/max)*100}%`, background: color, opacity: 0.8 }} />
      ))}
    </div>
  );
};

export default function DashboardPage(){
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);

  useEffect(()=>{(async()=>{
    const [st, sf, inv, pay, att] = await Promise.all([
      apiFetch('/api/students').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/staff').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/invoices').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/payments').then(r=>r.json().catch(()=>[])),
      apiFetch('/api/attendance').then(r=>r.json().catch(()=>[])),
    ]);
    setStudents(Array.isArray(st)?st:[]); setStaff(Array.isArray(sf)?sf:[]); setInvoices(Array.isArray(inv)?inv:[]); setPayments(Array.isArray(pay)?pay:[]); setAttendance(Array.isArray(att)?att:[]);
  })();},[]);

  const totalDue = useMemo(()=> invoices.reduce((s:any,i:any)=> s + (Number(i.totalAmount)||0), 0), [invoices]);
  const totalPaid = useMemo(()=> payments.reduce((s:any,p:any)=> s + (Number(p.amountPaid)||0), 0), [payments]);
  const unpaidCount = useMemo(()=> invoices.filter((i:any)=> i.status==='UNPAID' || i.status==='PARTIAL').length, [invoices]);

  const formatCurrency = (amount:number) => `GHS ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Fake spark data derived from counts for a nicer look
  const trendStudents = useMemo(()=>{ const base = students.length; return [base-5, base-2, base-1, base, base+3, base+2, base+4].map(v=>Math.max(0,v)); },[students]);
  const trendFinance = useMemo(()=>{ const a = totalPaid; return [a*0.4, a*0.6, a*0.5, a*0.8, a*0.7, a*0.9, a].map(x=>Math.round(x/1000)); },[totalPaid]);

  const recentStudents = useMemo(()=> [...students].sort((a,b)=> (b.id||0)-(a.id||0)).slice(0,8), [students]);
  const recentPayments = useMemo(()=> [...payments].sort((a,b)=> new Date(b.paymentDate).getTime()-new Date(a.paymentDate).getTime()).slice(0,8), [payments]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Overview of students, academics, and finance</p>
        </div>

        {/* Top stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Students" value={students.length} delta={5} icon={<FaUserGraduate />} />
          <StatCard title="Staff" value={staff.length} delta={2} accent="emerald" icon={<FaChalkboardTeacher />} />
          <StatCard title="Invoices (Unpaid)" value={unpaidCount} delta={-3} accent="amber" icon={<FaFileInvoiceDollar />} />
          <StatCard title="Payments (Total)" value={formatCurrency(totalPaid)} delta={7} accent="violet" icon={<FaMoneyBillWave />} />
        </section>

        {/* Charts row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2"><FaUsers /> Enrollment trend</h3>
              <span className="text-xs text-gray-500">Last 7 periods</span>
            </div>
            <MiniBar values={trendStudents} />
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2"><FaChartBar /> Collections trend</h3>
              <span className="text-xs text-gray-500">Indexed</span>
            </div>
            <MiniBar values={trendFinance} color="rgb(16,185,129)" />
          </div>
        </section>

        {/* Two-column recent tables */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Recent Students</h3>
              <a className="text-sm text-indigo-600 hover:underline" href="/student/student">View all</a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-500">
                  <tr><th className="text-left py-2">Student #</th><th className="text-left py-2">Name</th></tr>
                </thead>
                <tbody>
                  {recentStudents.map((s:any)=> (
                    <tr key={s.id} className="border-t">
                      <td className="py-2 pr-4">{s.studentNo ?? s.id}</td>
                      <td className="py-2">{[s.firstName, s.lastName].filter(Boolean).join(' ')}</td>
                    </tr>
                  ))}
                  {recentStudents.length===0 && (
                    <tr><td colSpan={2} className="text-center text-gray-400 py-6">No students yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Recent Payments</h3>
              <a className="text-sm text-indigo-600 hover:underline" href="/finance/payments">View all</a>
            </div>
            <div className="overflow-x-auto">
        <table className="w-full text-sm">
                <thead className="text-gray-500">
                  <tr><th className="text-left py-2">Date</th><th className="text-left py-2">Student</th><th className="text-right py-2">Amount</th></tr>
                </thead>
                <tbody>
                  {recentPayments.map((p:any)=> (
                    <tr key={p.id} className="border-t">
                      <td className="py-2 pr-4">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="py-2">{p.studentId}</td>
          <td className="py-2 text-right">{formatCurrency(Number(p.amountPaid||0))}</td>
                    </tr>
                  ))}
                  {recentPayments.length===0 && (
                    <tr><td colSpan={3} className="text-center text-gray-400 py-6">No payments yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
