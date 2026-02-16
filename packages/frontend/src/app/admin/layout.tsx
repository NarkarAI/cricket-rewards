"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/components/auth/AuthProvider";

const ADMIN_LINKS = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/kyc-review", label: "KYC Review" },
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/fees", label: "Fees" },
  { href: "/admin/aml", label: "AML Flags" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const pathname = usePathname();

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8">Loading...</div>;
  if (!user || user.role !== "admin") {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-red-600">Admin access required.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      <div className="flex gap-2 mb-8 overflow-x-auto">
        {ADMIN_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              pathname === link.href
                ? "bg-primary text-white"
                : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
