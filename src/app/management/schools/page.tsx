"use client";
import React, { useEffect, useState, useMemo } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { getAuth } from '@/utils/auth';
import { apiFetch } from '@/utils/apiFetch';
import LogoutButton from '@/components/LogoutButton';

const SchoolPage: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ username: '', name: '', address: '', contactInfo: '', type: 'BASIC', accreditationNo: '', establishedDate: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [filterName, setFilterName] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [message, setMessage] = useState<{ type: 'success'|'error'|'info', text: string } | null>(null);

  const fetchSchools = () => {
    setLoading(true);
    fetch('/api/schools')
      .then(r => r.json())
      .then(data => { setSchools(data || []); setLoading(false); })
      .catch(() => { setLoading(false); });
  };

  useEffect(() => {
    // read userName and role from localStorage auth helper
    try {
      const auth = getAuth();
      if (auth) {
        setUserName(auth.username || auth.userName || null);
        if (typeof auth.roleId === 'number') setRoleId(auth.roleId);
        else if (auth.role) setRoleId(Number(auth.role));
      }
    } catch (e) {
      // ignore
    }
    fetchSchools();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // simple client-side validation
    const user = getAuth();

    if (!form.name || !form.name.trim()) 
      {
      setMessage({ type: 'error', text: 'School name is required' });
      return;
    }
    const payload = { ...form, establishedDate: form.establishedDate || null };
     
  setMessage({ type: 'info', text: editingId ? 'Updating...' : 'Creating...' });
  payload.username = user.username;
  const res = await apiFetch('/api/schools', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload) });
   
  
  const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      const serverMsg = result && typeof result === 'object' ? ((result as any).error || (result as any).message || JSON.stringify(result)) : String(result);
      setMessage({ type: 'error', text: serverMsg || 'Invalid data, check and try again' });
      setLoading(false);
      return;
    }
    setMessage({ type: 'success', text: editingId ? 'School updated' : 'School created' });
    if (res.ok) { setForm({ username: '', name: '', address: '', contactInfo: '', type: 'BASIC', accreditationNo: '', establishedDate: '' }); setEditingId(null); fetchSchools(); }
    setLoading(false);
  };

  const handleEdit = (s: any) => { setForm({ username: s.username, name: s.name, address: s.address, contactInfo: s.contactInfo, type: s.type, accreditationNo: s.accreditationNo, establishedDate: s.establishedDate ? new Date(s.establishedDate).toISOString().slice(0,10) : '' }); setEditingId(s.id); };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete school?')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/schools', { method: 'DELETE', body: JSON.stringify({ id }) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        const serverMsg = result && typeof result === 'object' ? ((result as any).error || (result as any).message || JSON.stringify(result)) : String(result);
        setMessage({ type: 'error', text: serverMsg || 'Delete failed' });
      } else setMessage({ type: 'success', text: 'Deleted successfully' });
    } catch (e) {
      setMessage({ type: 'error', text: 'Delete failed' });
    }
    await fetchSchools();
    setLoading(false);
  };

  // memoized filtered/sorted/paginated lists
  const filtered = useMemo(() => {
    return schools.filter(s => {
      if (filterName) {
        const q = filterName.toLowerCase();
        if (!String(s.name || '').toLowerCase().includes(q) && !String(s.username || '').toLowerCase().includes(q)) return false;
      }
      if (filterType && s.type !== filterType) return false;
      return true;
    });
  }, [schools, filterName, filterType]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a,b) => {
      const aV = (a as any)[sortColumn];
      const bV = (b as any)[sortColumn];
      if (aV == null && bV == null) return 0;
      if (aV == null) return sortDir === 'asc' ? -1 : 1;
      if (bV == null) return sortDir === 'asc' ? 1 : -1;
      if (typeof aV === 'string') return sortDir === 'asc' ? String(aV).localeCompare(String(bV)) : String(bV).localeCompare(String(aV));
      return sortDir === 'asc' ? (aV - bV) : (bV - aV);
    });
    return copy;
  }, [filtered, sortColumn, sortDir]);

  const totalFiltered = filtered.length;
  const start = (page-1)*pageSize;
  const pageItems = useMemo(() => sorted.slice(start, start + pageSize), [sorted, start, pageSize]);
  const showingStart = totalFiltered === 0 ? 0 : start + 1;
  const showingEnd = Math.min(start + pageSize, totalFiltered);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8 relative">
        <h2 className="text-2xl font-bold mb-4">Schools</h2>
        {loading && <LoadingSpinner />}
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
      
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" className="border p-2 rounded" required />
          <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Address" className="border p-2 rounded" />
          <input value={form.contactInfo} onChange={e => setForm({ ...form, contactInfo: e.target.value })} placeholder="Contact Info" className="border p-2 rounded" />
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="border p-2 rounded">
            <option value="BASIC">Basic</option>
            <option value="SECONDARY">Secondary</option>
            <option value="TERTIARY">Tertiary</option>
          </select>
          <input value={form.accreditationNo} onChange={e => setForm({ ...form, accreditationNo: e.target.value })} placeholder="Accreditation No" className="border p-2 rounded" />
          <input type="date" value={form.establishedDate} onChange={e => setForm({ ...form, establishedDate: e.target.value })} className="border p-2 rounded" />
          <div className="flex gap-2 md:col-span-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={() => { setEditingId(null); setForm({ username: '', name: '', address: '', contactInfo: '', type: 'BASIC', accreditationNo: '', establishedDate: '' }); }}>Cancel</button>}
          </div>
        </form>

        <div className="mt-4">
          <div className="flex gap-2 items-center mb-2">
            <input placeholder="Filter name or username..." className="border p-2 rounded" value={filterName} onChange={e => { setFilterName(e.target.value); setPage(1); }} />
            <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }} className="border p-2 rounded">
              <option value="">All types</option>
              <option value="BASIC">Basic</option>
              <option value="SECONDARY">Secondary</option>
              <option value="TERTIARY">Tertiary</option>
            </select>
            <div className="ml-auto flex items-center gap-2">
              <div className="text-sm text-gray-600">Page size</div>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded">
                <option value={5}>5</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
              </select>
            </div>
          </div>

          {message && (
            <div className={`mb-2 p-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
              {message.text}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse bg-white">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 border"><button onClick={() => { if (sortColumn === 'id') setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortColumn('id'); setSortDir('asc'); } }}>ID {sortColumn === 'id' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</button></th>
                  <th className="p-2 border"><button onClick={() => { if (sortColumn === 'username') setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortColumn('username'); setSortDir('asc'); } }}>Username {sortColumn === 'username' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</button></th>
                  <th className="p-2 border"><button onClick={() => { if (sortColumn === 'name') setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortColumn('name'); setSortDir('asc'); } }}>Name {sortColumn === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</button></th>
                  <th className="p-2 border"><button onClick={() => { if (sortColumn === 'type') setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortColumn('type'); setSortDir('asc'); } }}>Type {sortColumn === 'type' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</button></th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(s => (
                  <tr key={s.id} className="border-t">
                    <td className="p-2 border">{s.id}</td>
                    <td className="p-2 border">{s.username}</td>
                    <td className="p-2 border">{s.name}</td>
                    <td className="p-2 border">{s.type}</td>
                    <td className="p-2 border">
                      <div className="flex gap-2">
                        <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => handleEdit(s)}>Edit</button>
                        <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => handleDelete(s.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">Showing {showingStart} - {showingEnd} of {totalFiltered}</div>
            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>Prev</button>
              <button className="px-3 py-1 border rounded" onClick={() => setPage(p => (page*pageSize < totalFiltered ? p+1 : p))} disabled={page*pageSize >= totalFiltered}>Next</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SchoolPage;
