"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { PaginatedResponse, User } from "@/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<PaginatedResponse<User> | null>(null);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState("");

  const fetchUsers = () =>
    api.admin.listUsers(page, roleFilter).then(setUsers).catch(() => {});

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);

  const handleRoleChange = async (userId: string) => {
    if (!newRole) return;
    try {
      await api.admin.updateUserRole(userId, { role: newRole });
      setEditingUser(null);
      setNewRole("");
      fetchUsers();
    } catch (e: any) {
      alert(e.message || "Failed to update role");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">User Management</h2>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Roles</option>
          <option value="spectator">Spectator</option>
          <option value="player">Player</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">KYC</th>
              <th className="text-left p-3">Verified</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users?.items?.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium">{u.display_name}</td>
                <td className="p-3 text-gray-500">{u.email}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{u.role}</span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    u.kyc_status === "approved" ? "bg-green-100 text-green-700" :
                    u.kyc_status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {u.kyc_status}
                  </span>
                </td>
                <td className="p-3">{u.is_verified_player ? "Yes" : "No"}</td>
                <td className="p-3">
                  {editingUser === u.id ? (
                    <div className="flex gap-1">
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        <option value="">Select</option>
                        <option value="spectator">Spectator</option>
                        <option value="player">Player</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleRoleChange(u.id)}
                        className="text-xs bg-primary text-white px-2 py-1 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="text-xs text-gray-500 px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingUser(u.id); setNewRole(u.role); }}
                      className="text-xs text-primary hover:underline"
                    >
                      Change Role
                    </button>
                  )}
                </td>
              </tr>
            )) || (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No users found.</td></tr>
            )}
          </tbody>
        </table>

        {users && users.total_pages > 1 && (
          <div className="p-3 border-t flex justify-between items-center">
            <span className="text-xs text-gray-500">Page {page} of {users.total_pages} ({users.total} total)</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 border rounded text-xs disabled:opacity-50">Previous</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= users.total_pages}
                className="px-3 py-1 border rounded text-xs disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
