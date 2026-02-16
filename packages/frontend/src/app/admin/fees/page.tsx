"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface FeeConfig {
  id: string;
  rate: string;
  min_fee: string;
  max_fee: string | null;
  currency: string;
  is_active: boolean;
  effective_from: string;
  created_by: string;
}

export default function AdminFeesPage() {
  const [configs, setConfigs] = useState<FeeConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rate: "0.05", min_fee: "0", max_fee: "", currency: "USD" });
  const [saving, setSaving] = useState(false);

  const fetchFees = () =>
    api.admin.listFees().then((data: any) => setConfigs(data.items || data || [])).catch(() => {});

  useEffect(() => { fetchFees(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await api.admin.createFee({
        rate: parseFloat(form.rate),
        min_fee: parseFloat(form.min_fee),
        max_fee: form.max_fee ? parseFloat(form.max_fee) : null,
        currency: form.currency,
      });
      setShowForm(false);
      setForm({ rate: "0.05", min_fee: "0", max_fee: "", currency: "USD" });
      fetchFees();
    } catch (e: any) {
      alert(e.message || "Failed to create fee config");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Fee Configuration</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm"
        >
          {showForm ? "Cancel" : "New Config"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h3 className="font-bold mb-4">Create Fee Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Rate (0-1)</label>
              <input
                type="number"
                min="0" max="1" step="0.01"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
              <p className="text-xs text-gray-400 mt-1">{(parseFloat(form.rate || "0") * 100).toFixed(1)}% commission</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="USD">USD</option>
                <option value="INR">INR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Min Fee</label>
              <input
                type="number"
                min="0" step="0.01"
                value={form.min_fee}
                onChange={(e) => setForm({ ...form, min_fee: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Max Fee (optional)</label>
              <input
                type="number"
                min="0" step="0.01"
                value={form.max_fee}
                onChange={(e) => setForm({ ...form, max_fee: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="No limit"
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create"}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">Currency</th>
              <th className="text-left p-3">Rate</th>
              <th className="text-left p-3">Min Fee</th>
              <th className="text-left p-3">Max Fee</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Effective From</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {configs.map((c) => (
              <tr key={c.id} className={`hover:bg-gray-50 ${!c.is_active ? "opacity-50" : ""}`}>
                <td className="p-3 font-medium">{c.currency}</td>
                <td className="p-3">{(parseFloat(c.rate) * 100).toFixed(1)}%</td>
                <td className="p-3">{c.currency} {c.min_fee}</td>
                <td className="p-3">{c.max_fee ? `${c.currency} ${c.max_fee}` : "No limit"}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {c.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3 text-gray-400 text-xs">
                  {new Date(c.effective_from).toLocaleString()}
                </td>
              </tr>
            ))}
            {configs.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No fee configurations.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
