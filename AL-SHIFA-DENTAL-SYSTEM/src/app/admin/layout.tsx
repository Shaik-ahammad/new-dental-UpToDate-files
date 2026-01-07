"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  LayoutDashboard, Stethoscope, Building2, FileText, 
  Menu, X, LogOut, ShieldAlert, ShieldCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Approvals", href: "/admin/approvals", icon: ShieldAlert }, // 🟢 NEW LINK
  { label: "Doctor Queue", href: "/admin/doctors", icon: Stethoscope },
  { label: "Hospital Queue", href: "/admin/organizations", icon: Building2 },
  { label: "Audit Logs", href: "/admin/audit", icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const pathname = usePathname();

  // Auth Check (From Ver B)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "admin") {
      router.push("/auth/admin/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/auth/role-selection");
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-100 relative overflow-hidden font-sans">
      
      {/* 1. MOBILE TOGGLE (Floating) */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button 
          size="icon" 
          aria-label="Toggle Navigation Menu"
          className="h-10 w-10 rounded-full shadow-xl bg-indigo-950 hover:bg-indigo-900 text-white transition-all duration-300"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* 2. SIDEBAR (Responsive) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-indigo-950 text-indigo-100 shadow-2xl transform transition-transform duration-500 ease-out 
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:relative`}
      >
        <div className="h-24 flex items-center px-8 border-b border-indigo-900/50 bg-indigo-950">
          <ShieldCheck className="h-8 w-8 text-indigo-400 mr-3" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Super Admin</h1>
            <p className="text-xs text-indigo-400 font-medium tracking-wider">SYSTEM CONTROL</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setSidebarOpen(false)} // Close on click (mobile)
                className={`group flex items-center justify-between px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200
                  ${isActive 
                    ? "bg-indigo-600/20 text-white shadow-[0_0_20px_rgba(79,70,229,0.2)] border border-indigo-500/30" 
                    : "text-indigo-300 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <div className="flex items-center gap-3">
                    <item.icon className={`h-5 w-5 ${isActive ? "text-indigo-400" : "text-indigo-300 group-hover:text-white"}`} />
                    {item.label}
                </div>
              </Link>
            )
          })}
        </nav>
        
        <div className="p-6 border-t border-indigo-900/50">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-300 hover:bg-red-950/20 rounded-xl transition-colors"
          >
            <LogOut className="h-5 w-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* 3. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
         {/* Mobile Header Bar */}
         <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-6 lg:hidden shrink-0">
            <span className="font-bold text-slate-900 text-sm">Admin Console</span>
         </header>

         {/* Content Scroll Area */}
         <main className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-20">
               {children}
            </div>
         </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}