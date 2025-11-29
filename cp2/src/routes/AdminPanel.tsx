import { useEffect, useState } from "react";
import { auth } from "../firebaseClient";

interface User {
  id: string;
  email: string;
  role: "user" | "therapist" | "admin";
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [role, setRole] = useState<"user" | "therapist" | "admin">("user");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user's role
  const fetchRole = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!auth.currentUser) {
        setRole("user");
        setLoading(false);
        return;
      }
      const token = await auth.currentUser.getIdToken();

      const res = await fetch("http://localhost:3000/auth/get-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || data?.message || "Failed to fetch role");
        setRole("user");
      } else {
        if (data.role) setRole(data.role);
        else setRole("user");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
      setRole("user");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users (admin only)
  const fetchUsers = async () => {
    setError(null);
    try {
      const res = await fetch("http://localhost:3000/admin/users"); // GET
      const data = await res.json();

      // Backend returns an array; but check shape to avoid `map` errors
      if (Array.isArray(data)) {
        setUsers(data as User[]);
      } else if (data && Array.isArray((data as any).users)) {
        setUsers((data as any).users as User[]);
      } else {
        // not an array -> set empty and show helpful message
        setUsers([]);
        console.error("Unexpected users response:", data);
        setError("Unexpected server response when fetching users");
      }
    } catch (err: any) {
      setUsers([]);
      setError(err.message || "Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchRole();
    // Also re-check when auth.currentUser changes — small poll to ensure up to date after login
    // (Optional) You can also wire this to onAuthStateChanged in a global context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (role === "admin") fetchUsers();
  }, [role]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (role !== "admin") return <p className="p-6">Access denied. Admins only.</p>;

  const promote = async (uid: string) => {
    setError(null);
    try {
      const res = await fetch("http://localhost:3000/admin/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || err?.message || "Failed to promote");
      }
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const revoke = async (uid: string) => {
    setError(null);
    try {
      const res = await fetch("http://localhost:3000/admin/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || err?.message || "Failed to revoke");
      }
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}

      {!users ? (
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-2">Email</th>
              <th className="border px-2">Role</th>
              <th className="border px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="border px-2">{u.email}</td>
                <td className="border px-2">{u.role}</td>
                <td className="border px-2 flex gap-2">
                  {u.role === "user" && (
                    <button
                      className="bg-green-500 text-white px-2"
                      onClick={() => promote(u.id)}
                    >
                      Promote
                    </button>
                  )}
                  {u.role === "therapist" && (
                    <button
                      className="bg-red-500 text-white px-2"
                      onClick={() => revoke(u.id)}
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}