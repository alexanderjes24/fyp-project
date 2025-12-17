import { useEffect, useState } from "react";
import { auth } from "../firebaseClient";

interface User {
  id: string;
  email: string;
  role: "user" | "therapist" | "admin";
  banned?: boolean;
}

interface TherapistCred {
  id: string;
  name: string;
  university: string;
  license: string;
  dateOfLicense: string;
  approval: "pending" | "approved" | "rejected";
}

interface Stats {
  totalUsers: number;
  therapists: number;
  normalUsers: number;
  banned: number;
}

export default function AdminDashboard() {
  const [role, setRole] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [therapistCreds, setTherapistCreds] = useState<TherapistCred[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch admin role and identify current admin
  const fetchRole = async () => {
    if (!auth.currentUser) return;
    const token = await auth.currentUser.getIdToken();
    try {
      const res = await fetch("http://localhost:3000/auth/get-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      setRole(data.role);
    } catch (err) {
      console.error("Error fetching role:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
  }, []);

  // Fetch data only if role is admin
  const fetchUsers = async () => {
    const res = await fetch("http://localhost:3000/admin/users");
    const data = await res.json();
    setUsers(data);
  };

  const fetchStats = async () => {
    const res = await fetch("http://localhost:3000/admin/stats");
    const data = await res.json();
    setStats(data);
  };

  const fetchTherapistCreds = async () => {
    const res = await fetch("http://localhost:3000/admin/therapist-creds");
    const data = await res.json();
    setTherapistCreds(data);
  };

  useEffect(() => {
    if (role === "admin") {
      fetchUsers();
      fetchStats();
      fetchTherapistCreds();
    }
  }, [role]);

  // Actions
  const promote = async (uid: string) => {
    await fetch("http://localhost:3000/admin/promote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });
    fetchUsers();
    fetchStats();
  };

  const revoke = async (uid: string) => {
    await fetch("http://localhost:3000/admin/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });
    fetchUsers();
    fetchStats();
  };

  

  const approve = async (uid: string) => {
    await fetch("http://localhost:3000/admin/approve-cred", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });
    fetchTherapistCreds();
  };

  const reject = async (uid: string) => {
    await fetch("http://localhost:3000/admin/reject-cred", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });
    fetchTherapistCreds();
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (role !== "admin") return <p className="p-6">Access denied. Admins only.</p>;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white border-l-4 border-blue-500 rounded shadow-sm">
            <h2 className="text-sm font-medium text-slate-500 uppercase">Total Users</h2>
            <p className="text-2xl font-bold text-slate-800">{stats.totalUsers}</p>
          </div>
          <div className="p-4 bg-white border-l-4 border-purple-500 rounded shadow-sm">
            <h2 className="text-sm font-medium text-slate-500 uppercase">Normal Users</h2>
            <p className="text-2xl font-bold text-slate-800">{stats.normalUsers}</p>
          </div>
          <div className="p-4 bg-white border-l-4 border-green-500 rounded shadow-sm">
            <h2 className="text-sm font-medium text-slate-500 uppercase">Therapists</h2>
            <p className="text-2xl font-bold text-slate-800">{stats.therapists}</p>
          </div>
          <div className="p-4 bg-white border-l-4 border-red-500 rounded shadow-sm">
            <h2 className="text-sm font-medium text-slate-500 uppercase">Banned</h2>
            <p className="text-2xl font-bold text-slate-800">{stats.banned}</p>
          </div>
        </div>
      )}

      {/* User Management */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h2 className="text-xl font-bold text-slate-700">User Management</h2>
        </div>
        <table className="min-w-full text-left">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 font-semibold">Email</th>
              <th className="px-6 py-3 font-semibold">Role</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const isSelf = u.id === auth.currentUser?.uid;
              return (
                <tr key={u.id} className={`hover:bg-slate-50 ${isSelf ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-6 py-4 text-slate-700">
                    <div className="flex items-center gap-2">
                      {u.email}
                      {isSelf && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase">
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-sm font-medium px-2.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.banned ? (
                      <span className="text-red-600 text-sm font-semibold flex items-center gap-1">● Banned</span>
                    ) : (
                      <span className="text-green-600 text-sm font-semibold flex items-center gap-1">● Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {!isSelf ? (
                      <div className="flex justify-center gap-2">
                        {u.role === "user" && (
                          <button onClick={() => promote(u.id)} className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-md font-medium transition-colors">Promote</button>
                        )}
                        {u.role === "therapist" && (
                          <button onClick={() => revoke(u.id)} className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-1.5 rounded-md font-medium transition-colors">Revoke</button>
                        )}
                        
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Owner Access Only</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Therapist Credentials */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h2 className="text-xl font-bold text-slate-700">Therapist Verification Queue</h2>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 font-semibold">Name</th>
              <th className="px-6 py-3 font-semibold">University</th>
              <th className="px-6 py-3 font-semibold">License #</th>
              <th className="px-6 py-3 font-semibold">Date</th>
              <th className="px-6 py-3 font-semibold">Approval</th>
              <th className="px-6 py-3 font-semibold text-center ">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {therapistCreds.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No credentials pending review.</td></tr>
            ) : (
              therapistCreds.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-900">{t.name}</td>
                  <td className="px-6 py-4 text-slate-600">{t.university}</td>
                  <td className="px-6 py-4 font-mono text-xs">{t.license}</td>
                  <td className="px-6 py-4 text-slate-500">{t.dateOfLicense}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      t.approval === 'pending' ? 'bg-amber-100 text-amber-700' :
                      t.approval === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {t.approval}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {t.approval === "pending" && (
                      <div className="flex justify-center gap-2">
                        <button onClick={() => approve(t.id)} className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-md transition-colors">Approve</button>
                        <button onClick={() => reject(t.id)} className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-md transition-colors">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}