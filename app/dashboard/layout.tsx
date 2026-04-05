"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/designs", label: "My Designs" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="dashboard">
      <aside className="dashboard__sidebar">
        <h2>Dashboard</h2>
        <nav className="dashboard__nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`dashboard__nav-item ${pathname === item.href ? "dashboard__nav-item--active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="dashboard__sidebar-bottom">
          <Link href="/catalog" className="btn btn--primary btn--sm" style={{ width: "100%" }}>
            Browse catalog
          </Link>
        </div>
      </aside>
      <main className="dashboard__main">{children}</main>
    </div>
  );
}
