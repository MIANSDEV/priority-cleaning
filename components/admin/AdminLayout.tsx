"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tag,
  Star,
  CalendarCheck,
  Clock,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/dashboard/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/dashboard/availability", label: "Availability", icon: Clock },
  { href: "/admin/dashboard/services", label: "Services & Pricing", icon: Package },
  { href: "/admin/dashboard/promo", label: "Promo Codes", icon: Tag },
  { href: "/admin/dashboard/specials", label: "Online Specials", icon: Star },
];

interface Props {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
    } finally {
      router.push("/admin/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-12 bg-[#1A1A1A] text-white flex items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-gray-300 hover:text-white p-1 -ml-1"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="text-[#F5A000] font-bold text-sm tracking-wide">CLEANING QUOTE</div>
        <div className="w-7" />
      </div>

      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed top-0 left-0 h-full z-50 w-56 bg-[#1A1A1A] text-white flex flex-col",
          "transition-transform duration-200 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        ].join(" ")}
      >
        {/* Header */}
        <div className="px-4 py-5 border-b border-gray-700 flex items-center justify-between">
          <div>
            <div className="text-[#F5A000] font-bold text-sm">CLEANING QUOTE</div>
            <div className="text-gray-400 text-xs mt-0.5">Admin Panel</div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white p-1"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href !== "/admin/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-brand text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content — offset by sidebar on desktop, top bar on mobile */}
      <main className="lg:ml-56 pt-12 lg:pt-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
