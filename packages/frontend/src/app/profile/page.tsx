"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthContext } from "@/components/auth/AuthProvider";



export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuthContext();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    sport: "Cricket",
    teams: [""],
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        display_name: user.display_name || "",
        bio: user.bio || "",
        sport: user.sport || "Cricket",
        teams: user.teams?.length > 0 ? [...user.teams] : [""],
      });
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG, or WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }
    setError("");
    setMessage("");
    setUploading(true);
    try {
      await api.uploadAvatar(file);
      await refreshUser();
      setMessage("Profile picture updated.");
    } catch (err: any) {
      setError(err.message || "Failed to upload picture.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const validTeams = formData.teams.filter((t) => t.trim());
    if (!formData.display_name.trim()) {
      setError("Display name is required.");
      return;
    }
    setSaving(true);
    try {
      await api.updateProfile({
        display_name: formData.display_name.trim(),
        bio: formData.bio.trim(),
        sport: formData.sport,
        teams: validTeams,
      });
      await refreshUser();
      setMessage("Profile updated successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8">Loading...</div>;
  if (!user) return null;

  const isPlayer = user.role === "player";
  const avatarSrc = user.avatar_url || "";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

      {message && (
        <div className="bg-green-50 text-green-700 border border-green-200 p-3 rounded-lg mb-4 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b">
          <div className="relative group">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={user.display_name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                {user.display_name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="font-semibold text-lg">{user.display_name || user.email}</p>
            <p className="text-sm text-gray-500 capitalize">{user.role}</p>
            {uploading && <p className="text-xs text-primary">Uploading...</p>}
          </div>
        </div>

        {!isPlayer ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Profile editing is available for players.</p>
            <Link href="/players" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark">
              Become a Player
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
              <select
                value={formData.sport}
                onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="Cricket">Cricket</option>
                <option value="Football">Football</option>
                <option value="Basketball">Basketball</option>
                <option value="Tennis">Tennis</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teams</label>
              {formData.teams.map((team, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={team}
                    onChange={(e) => {
                      const updated = [...formData.teams];
                      updated[idx] = e.target.value;
                      setFormData({ ...formData, teams: updated });
                    }}
                    className="flex-1 border rounded-lg px-3 py-2"
                    placeholder="e.g., Mumbai Indians"
                  />
                  {formData.teams.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formData.teams.filter((_, i) => i !== idx);
                        setFormData({ ...formData, teams: updated });
                      }}
                      className="text-red-500 text-sm px-2 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, teams: [...formData.teams, ""] })}
                className="text-primary text-sm hover:underline"
              >
                + Add another team
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                rows={4}
                placeholder="Tell fans about yourself, your achievements, your career..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark disabled:opacity-50 font-medium"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
