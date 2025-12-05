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

  // Fetch admin role
  const fetchRole = async () => {
    if (!auth.currentUser) return;
    const token = await auth.currentUser.getIdToken();
    const res = await fetch("http://localhost:3000/auth/get-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setRole(data.role);
  };

  useEffect(() => {
    fetchRole();
  }, []);

  // Fetch users & stats
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

  // Fetch therapist credentials
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

  if (role !== "admin") return <p className="p-6">Access denied. Admins only.</p>;

  // User actions
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

  const ban = async (uid: string) => {
    await fetch("http://localhost:3000/admin/ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });
    fetchUsers();
    fetchStats();
  };

  const unban = async (uid: string) => {
    await fetch("http://localhost:3000/admin/unban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });
    fetchUsers();
    fetchStats();
  };

  // Credential actions
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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-100 rounded shadow">
            <h2 className="text-lg font-semibold">Total Users</h2>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
          </div>
          <div className="p-4 bg-purple-100 rounded shadow">
            <h2 className="text-lg font-semibold">Normal Users</h2>
            <p className="text-2xl font-bold">{stats.normalUsers}</p>
          </div>
          <div className="p-4 bg-green-100 rounded shadow">
            <h2 className="text-lg font-semibold">Therapists</h2>
            <p className="text-2xl font-bold">{stats.therapists}</p>
          </div>
          <div className="p-4 bg-red-100 rounded shadow">
            <h2 className="text-lg font-semibold">Banned Users</h2>
            <p className="text-2xl font-bold">{stats.banned}</p>
          </div>
        </div>
      )}

      {/* User Management */}
      <div>
        <h2 className="text-2xl font-bold mb-3">User Management</h2>
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2">Email</th>
              <th className="border px-3 py-2">Role</th>
              <th className="border px-3 py-2">Status</th>
              <th className="border px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="text-center">
                <td className="border px-3 py-2">{u.email}</td>
                <td className="border px-3 py-2">{u.role}</td>
                <td className="border px-3 py-2">
                  {u.banned ? (
                    <span className="text-red-600 font-semibold">Banned</span>
                  ) : (
                    <span className="text-green-600 font-semibold">Active</span>
                  )}
                </td>
                <td className="border px-3 py-2 space-x-2">
                  {u.role === "user" && (
                    <button onClick={() => promote(u.id)} className="bg-green-500 text-white px-2 py-1 rounded">Promote</button>
                  )}
                  {u.role === "therapist" && (
                    <button onClick={() => revoke(u.id)} className="bg-yellow-500 text-white px-2 py-1 rounded">Revoke</button>
                  )}
                  {!u.banned && (
                    <button onClick={() => ban(u.id)} className="bg-red-500 text-white px-2 py-1 rounded">Ban</button>
                  )}
                  {u.banned && (
                    <button onClick={() => unban(u.id)} className="bg-blue-500 text-white px-2 py-1 rounded">Unban</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Therapist Credentials */}
      <div>
        <h2 className="text-2xl font-bold mt-8 mb-3">Therapist Credentials</h2>
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2">Name</th>
              <th className="border px-3 py-2">University</th>
              <th className="border px-3 py-2">License</th>
              <th className="border px-3 py-2">Date of License</th>
              <th className="border px-3 py-2">Approval</th>
              <th className="border px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {therapistCreds.map((t) => (
              <tr key={t.id} className="text-center">
                <td className="border px-3 py-2">{t.name}</td>
                <td className="border px-3 py-2">{t.university}</td>
                <td className="border px-3 py-2">{t.license}</td>
                <td className="border px-3 py-2">{t.dateOfLicense}</td>
                <td className="border px-3 py-2">{t.approval}</td>
                <td className="border px-3 py-2 space-x-2">
                  {t.approval === "pending" && (
                    <>
                      <button onClick={() => approve(t.id)} className="bg-green-500 text-white px-2 py-1 rounded">Approve</button>
                      <button onClick={() => reject(t.id)} className="bg-red-500 text-white px-2 py-1 rounded">Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
