"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/", icon: "📊", label: "Dashboard" },
  { href: "/expenses", icon: "💸", label: "Gastos" },
  { href: "/installments", icon: "📅", label: "Cuotas" },
  { href: "/categories", icon: "🏷️", label: "Categorías" },
];

const configItems = [
  { href: "/profile", icon: "👤", label: "Perfil" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{
    email?: string;
    display_name?: string;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({
          email: user.email,
          display_name:
            user.user_metadata?.display_name || user.email?.split("@")[0],
        });
      }
    });
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">💰</div>
          <span className="sidebar-logo-text">FinanzApp</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section">Principal</div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${
                isActive(item.href) ? "sidebar-link-active" : ""
              }`}
              onClick={closeSidebar}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          <div className="sidebar-section">Configuración</div>
          {configItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${
                isActive(item.href) ? "sidebar-link-active" : ""
              }`}
              onClick={closeSidebar}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {getInitials(user?.display_name)}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user?.display_name || "Cargando..."}
              </div>
              <div className="sidebar-user-email">
                {user?.email || ""}
              </div>
            </div>
          </div>
          <form action={logout} style={{ marginTop: "12px" }}>
            <button
              type="submit"
              className="btn btn-ghost btn-sm btn-full"
            >
              <span>🚪</span>
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* Main content */}
      <div className="main-content">
        {/* Navbar */}
        <header className="navbar">
          <div className="navbar-left">
            <button
              className="navbar-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <h1 className="navbar-title">
              {navItems.find((item) => isActive(item.href))?.label ||
                configItems.find((item) => isActive(item.href))?.label ||
                "FinanzApp"}
            </h1>
          </div>
          <div className="navbar-right">
            <span
              style={{
                fontSize: "13px",
                color: "var(--color-text-muted)",
              }}
            >
              {new Date().toLocaleDateString("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
