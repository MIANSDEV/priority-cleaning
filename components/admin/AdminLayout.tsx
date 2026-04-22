"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, Tag, Star, CalendarCheck, LogOut } from "lucide-react";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/dashboard/bookings", label: "Bookings", icon: CalendarCheck },
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

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1A1A1A] text-white flex flex-col fixed h-full">
        <div className="px-4 py-5 border-b border-gray-700">
          <div className="text-[#F5A000] font-bold text-sm">CLEANING QUOTE</div>
          <div className="text-gray-400 text-xs mt-0.5">Admin Panel</div>
        </div>

        <nav className="flex-1 py-4">
          {NAV.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                  ${isActive
                    ? "bg-[#F5A000] text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }
                `}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

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

      {/* Main content */}
      <main className="flex-1 ml-56">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
