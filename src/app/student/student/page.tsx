"use client";
import React, { useEffect, useMemo, useState } from "react";
import SidebarMenu from "@/components/SidebarMenu";
import LoadingSpinner from "@/components/LoadingSpinner";
import LogoutButton from "@/components/LogoutButton";
import { apiFetch } from "@/utils/apiFetch";
import { getAuth } from "@/utils/auth";

// This page follows the management pages pattern.
// Student API auto-generates username and studentNo on create.
// We only send fields the API supports today.

type Student = {
  id: number;
  username: string;
  studentNo: string;
  firstName: string;
  lastName: string;
  otherNames?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  email?: string | null;
  contactNumber?: string | null;
  nationality?: string | null;
  placeOfBirth?: string | null;
  previousSchool?: string | null;
};

const defaultForm = {
  firstName: "",
  lastName: "",
  otherNames: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  email: "",
  contactNumber: "",
  nationality: "",
  placeOfBirth: "",
  previousSchool: "",
};

const StudentPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<typeof defaultForm>({ ...defaultForm });
  const [editingId, setEditingId] = useState<number | null>(null);

  // table UX controls
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [filterName, setFilterName] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [message, setMessage] = useState<
    | { type: "success" | "error" | "info"; text: string }
    | null
  >(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/students");
      const data = await res.json().catch(() => []);
      setStudents(Array.isArray(data) ? data : []);
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    // Ensure dev header fallback if needed
    try { getAuth(); } catch {}
    fetchStudents();
  }, []);

  const safeServerMessage = (resObj: any) => {
    if (!resObj) return "";
    if (typeof resObj === "string") return resObj;
    if (typeof resObj === "object")
      return resObj.error || (resObj as any).message || JSON.stringify(resObj);
    return String(resObj);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setMessage({ type: "error", text: "First and last name are required" });
      setLoading(false);
      return;
    }

    const payload: any = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      otherNames: form.otherNames || null,
      dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth) : null,
      gender: form.gender || null,
      address: form.address || null,
      email: form.email || null,
      contactNumber: form.contactNumber || null,
      nationality: form.nationality || null,
      placeOfBirth: form.placeOfBirth || null,
      previousSchool: form.previousSchool || null,
    };

    setMessage({ type: "info", text: editingId ? "Updating..." : "Creating..." });

    try {
      const res = await apiFetch("/api/students", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        const serverMsg = safeServerMessage(result) || "Server error";
        setMessage({ type: "error", text: serverMsg });
        setLoading(false);
        return;
      }
      setMessage({ type: "success", text: editingId ? "Student updated" : "Student created" });
      setForm({ ...defaultForm });
      setEditingId(null);
      await fetchStudents();
    } catch (e) {
      setMessage({ type: "error", text: "Request failed" });
    }
    setLoading(false);
  };

  const handleEdit = (s: Student) => {
    setForm({
      firstName: s.firstName || "",
      lastName: s.lastName || "",
      otherNames: s.otherNames || "",
      dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().slice(0, 10) : "",
      gender: s.gender || "",
      address: s.address || "",
      email: s.email || "",
      contactNumber: s.contactNumber || "",
      nationality: s.nationality || "",
      placeOfBirth: s.placeOfBirth || "",
      previousSchool: s.previousSchool || "",
    });
    setEditingId(s.id);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete student?")) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/students", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        const serverMsg = safeServerMessage(result) || "Delete failed";
        setMessage({ type: "error", text: serverMsg });
      } else {
        setMessage({ type: "success", text: "Deleted successfully" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Delete failed" });
    }
    await fetchStudents();
    setLoading(false);
  };

  // memoized filtered/sorted/paginated lists
  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (filterName) {
        const q = filterName.toLowerCase();
        const full = `${s.firstName || ""} ${s.otherNames || ""} ${s.lastName || ""}`.trim().toLowerCase();
        if (!full.includes(q) && !String(s.studentNo || "").toLowerCase().includes(q)) return false;
      }
      if (filterGender && (s.gender || "") !== filterGender) return false;
      return true;
    });
  }, [students, filterName, filterGender]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a: any, b: any) => {
      const aV = a[sortColumn];
      const bV = b[sortColumn];
      if (aV == null && bV == null) return 0;
      if (aV == null) return sortDir === "asc" ? -1 : 1;
      if (bV == null) return sortDir === "asc" ? 1 : -1;
      if (typeof aV === "string")
        return sortDir === "asc"
          ? String(aV).localeCompare(String(bV))
          : String(bV).localeCompare(String(aV));
      return sortDir === "asc" ? aV - bV : bV - aV;
    });
    return copy;
  }, [filtered, sortColumn, sortDir]);

  const totalFiltered = filtered.length;
  const start = (page - 1) * pageSize;
  const pageItems = useMemo(() => sorted.slice(start, start + pageSize), [sorted, start, pageSize]);
  const showingStart = totalFiltered === 0 ? 0 : start + 1;
  const showingEnd = Math.min(start + pageSize, totalFiltered);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8 relative">
        <h2 className="text-2xl font-bold mb-4">Students</h2>
        {loading && <LoadingSpinner />}

        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First Name" className="border p-2 rounded" required />
          <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last Name" className="border p-2 rounded" required />
          <input value={form.otherNames} onChange={(e) => setForm({ ...form, otherNames: e.target.value })} placeholder="Other Names" className="border p-2 rounded" />
          <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className="border p-2 rounded" />
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="border p-2 rounded">
            <option value="">Gender</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="border p-2 rounded" />
          <input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} placeholder="Contact Number" className="border p-2 rounded" />
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className="border p-2 rounded" />
          <input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} placeholder="Nationality" className="border p-2 rounded" />
          <input value={form.placeOfBirth} onChange={(e) => setForm({ ...form, placeOfBirth: e.target.value })} placeholder="Place of Birth" className="border p-2 rounded" />
          <input value={form.previousSchool} onChange={(e) => setForm({ ...form, previousSchool: e.target.value })} placeholder="Previous School" className="border p-2 rounded" />
          <div className="flex gap-2 md:col-span-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">
              {editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button
                type="button"
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => {
                  setEditingId(null);
                  setForm({ ...defaultForm });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="mt-4">
          <div className="flex gap-2 items-center mb-2">
            <input
              placeholder="Filter by name or student no..."
              className="border p-2 rounded"
              value={filterName}
              onChange={(e) => {
                setFilterName(e.target.value);
                setPage(1);
              }}
            />
            <select
              value={filterGender}
              onChange={(e) => {
                setFilterGender(e.target.value);
                setPage(1);
              }}
              className="border p-2 rounded"
            >
              <option value="">All genders</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
            <div className="ml-auto flex items-center gap-2">
              <div className="text-sm text-gray-600">Page size</div>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="border p-2 rounded"
              >
                <option value={5}>5</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
              </select>
            </div>
          </div>

          {message && (
            <div
              className={`mb-2 p-2 rounded ${
                message.type === "success"
                  ? "bg-green-100 text-green-800"
                  : message.type === "error"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse bg-white">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 border">
                    <button
                      onClick={() => {
                        if (sortColumn === "id") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                        else {
                          setSortColumn("id");
                          setSortDir("asc");
                        }
                      }}
                    >
                      ID {sortColumn === "id" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </button>
                  </th>
                  <th className="p-2 border">
                    <button
                      onClick={() => {
                        if (sortColumn === "studentNo") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                        else {
                          setSortColumn("studentNo");
                          setSortDir("asc");
                        }
                      }}
                    >
                      Student No {sortColumn === "studentNo" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </button>
                  </th>
                  <th className="p-2 border">
                    <button
                      onClick={() => {
                        if (sortColumn === "firstName") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                        else {
                          setSortColumn("firstName");
                          setSortDir("asc");
                        }
                      }}
                    >
                      Name {sortColumn === "firstName" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </button>
                  </th>
                  <th className="p-2 border">Gender</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Contact</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-2 border">{s.id}</td>
                    <td className="p-2 border">{s.studentNo}</td>
                    <td className="p-2 border">{s.firstName} {s.otherNames ? `${s.otherNames} ` : ""}{s.lastName}</td>
                    <td className="p-2 border">{s.gender || ""}</td>
                    <td className="p-2 border">{s.email || ""}</td>
                    <td className="p-2 border">{s.contactNumber || ""}</td>
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
            <div className="text-sm text-gray-600">
              Showing {showingStart} - {showingEnd} of {totalFiltered}
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Prev
              </button>
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setPage((p) => (page * pageSize < totalFiltered ? p + 1 : p))}
                disabled={page * pageSize >= totalFiltered}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentPage;
