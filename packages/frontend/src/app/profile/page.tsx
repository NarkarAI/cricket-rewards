"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthContext } from "@/components/auth/AuthProvider";
import {
  COUNTRIES,
  BACKGROUND_THEMES,
  countryCodeToFlag,
  getBackgroundStyle,
} from "@/lib/profileThemes";

type BgTab = "gradients" | "color" | "image" | "flag";

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuthContext();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    sport: "Cricket",
    teams: [""],
    nationality: "",
    profile_background: "",
  });
  const [saving, setSaving] = useState(false);
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [bgTab, setBgTab] = useState<BgTab>("gradients");
  const [colorInput, setColorInput] = useState("#2563eb");

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
        nationality: user.nationality || "",
        profile_background: user.profile_background || "",
      });
      if (user.profile_background?.startsWith("#")) {
        setColorInput(user.profile_background);
        setBgTab("color");
      } else if (user.profile_background === "custom") {
        setBgTab("image");
      } else if (user.profile_background === "flag") {
        setBgTab("flag");
      }
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

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setUploadingBanner(true);
    try {
      await api.uploadBanner(file);
      await refreshUser();
      setFormData((prev) => ({ ...prev, profile_background: "custom" }));
      setMessage("Banner image uploaded.");
    } catch (err: any) {
      setError(err.message || "Failed to upload banner.");
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const handleSaveAppearance = async () => {
    setError("");
    setMessage("");
    setSavingAppearance(true);
    try {
      await api.updateProfile({
        nationality: formData.nationality,
        profile_background: formData.profile_background,
      });
      await refreshUser();
      setMessage("Appearance updated.");
    } catch (err: any) {
      setError(err.message || "Failed to update appearance.");
    } finally {
      setSavingAppearance(false);
    }
  };

  const handleSavePlayerInfo = async (e: React.FormEvent) => {
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
  const previewBg = getBackgroundStyle(
    formData.profile_background,
    formData.nationality,
    user.banner_url
  );

  const bgTabs: { key: BgTab; label: string }[] = [
    { key: "gradients", label: "Gradients" },
    { key: "color", label: "Color" },
    { key: "image", label: "Image" },
    { key: "flag", label: "Flag" },
  ];

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

      {/* ===== APPEARANCE SECTION (ALL USERS) ===== */}
      <div className="bg-white rounded-xl border overflow-hidden mb-6">
        {/* Banner Preview */}
        <div
          className="h-32 relative"
          style={{ background: previewBg }}
        >
          <div className="absolute -bottom-10 left-6">
            <div className="relative group">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={user.display_name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-primary font-bold text-2xl border-4 border-white shadow-lg">
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
          </div>
        </div>

        <div className="pt-14 px-6 pb-6">
          <div className="mb-5">
            <p className="font-semibold text-lg">
              {formData.nationality && (
                <span className="mr-2">{countryCodeToFlag(formData.nationality)}</span>
              )}
              {user.display_name || user.email}
            </p>
            <p className="text-sm text-gray-500 capitalize">{user.role}</p>
            {uploading && <p className="text-xs text-primary">Uploading picture...</p>}
          </div>

          <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">Customize Appearance</h3>

          {/* Nationality */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
            <select
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {countryCodeToFlag(c.code)} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Background Theme Picker */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Background</label>

            {/* Tabs */}
            <div className="flex border-b mb-3">
              {bgTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setBgTab(tab.key)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    bgTab === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Gradients Tab */}
            {bgTab === "gradients" && (
              <div className="grid grid-cols-4 gap-2">
                {BACKGROUND_THEMES.filter((t) => t.key !== "flag").map((theme) => {
                  const isSelected = formData.profile_background === theme.key;
                  return (
                    <button
                      key={theme.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, profile_background: theme.key })}
                      className={`h-16 rounded-lg relative overflow-hidden transition-all ${
                        isSelected ? "ring-2 ring-primary ring-offset-2 scale-105" : "hover:scale-105"
                      }`}
                      style={{ background: theme.style }}
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium drop-shadow-md">
                        {theme.label}
                      </span>
                      {isSelected && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Color Tab */}
            {bgTab === "color" && (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={colorInput}
                    onChange={(e) => {
                      setColorInput(e.target.value);
                      setFormData({ ...formData, profile_background: e.target.value });
                    }}
                    className="w-16 h-12 rounded-lg border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={colorInput}
                    onChange={(e) => {
                      const v = e.target.value;
                      setColorInput(v);
                      if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
                        setFormData({ ...formData, profile_background: v });
                      }
                    }}
                    placeholder="#2563eb"
                    className="border rounded-lg px-3 py-2 w-32 font-mono text-sm"
                    maxLength={7}
                  />
                  <span className="text-sm text-gray-500">Pick any color</span>
                </div>
                {/* Quick color swatches */}
                <div className="flex flex-wrap gap-2">
                  {["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#ea580c", "#0891b2", "#db2777", "#ca8a04", "#4f46e5", "#000000"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setColorInput(c);
                        setFormData({ ...formData, profile_background: c });
                      }}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.profile_background === c ? "ring-2 ring-primary ring-offset-2 scale-110" : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Image Tab */}
            {bgTab === "image" && (
              <div className="space-y-3">
                {user.banner_url ? (
                  <div className="relative rounded-lg overflow-hidden h-24">
                    <div
                      className="w-full h-full"
                      style={{ background: `url(${user.banner_url}) center/cover no-repeat` }}
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <span className="text-white text-xs font-medium drop-shadow-md">Current Banner</span>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg h-24 flex items-center justify-center text-gray-400 text-sm">
                    No banner image uploaded
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                  className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50"
                >
                  {uploadingBanner ? "Uploading..." : "Upload Banner Image"}
                </button>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
                <p className="text-xs text-gray-500">JPEG, PNG, or WebP. Max 5MB. Recommended: 1200x400px.</p>
                {user.banner_url && formData.profile_background !== "custom" && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, profile_background: "custom" })}
                    className="text-primary text-sm hover:underline"
                  >
                    Use uploaded banner as background
                  </button>
                )}
              </div>
            )}

            {/* Flag Tab */}
            {bgTab === "flag" && (
              <div>
                {formData.nationality ? (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, profile_background: "flag" })}
                    className={`h-20 w-full rounded-lg relative overflow-hidden transition-all ${
                      formData.profile_background === "flag" ? "ring-2 ring-primary ring-offset-2" : "hover:scale-[1.02]"
                    }`}
                    style={{
                      background: getBackgroundStyle("flag", formData.nationality),
                    }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-3xl drop-shadow-lg">
                      {countryCodeToFlag(formData.nationality)}
                    </span>
                    {formData.profile_background === "flag" && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                ) : (
                  <p className="text-sm text-gray-500 py-4 text-center">
                    Select a nationality above to use a flag-inspired background.
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSaveAppearance}
            disabled={savingAppearance}
            className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary-dark disabled:opacity-50 font-medium text-sm"
          >
            {savingAppearance ? "Saving..." : "Save Appearance"}
          </button>
        </div>
      </div>

      {/* ===== PLAYER INFO SECTION (PLAYERS ONLY) ===== */}
      {isPlayer ? (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide">Player Info</h3>
          <form onSubmit={handleSavePlayerInfo} className="space-y-5">
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
              {saving ? "Saving..." : "Save Player Info"}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-6 text-center">
          <p className="text-gray-600 mb-4">Want to receive rewards from fans?</p>
          <Link href="/players" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark">
            Become a Player
          </Link>
        </div>
      )}
    </div>
  );
}
