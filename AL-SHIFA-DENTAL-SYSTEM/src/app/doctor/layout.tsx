"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Calendar, Users, Package, DollarSign, 
  Menu, X, LogOut, Bot, ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    router.push("/auth/role-selection");
  };

  const navItems = [
    { name: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
    { name: "AI Agents", href: "/doctor/agents", icon: Bot },
    { name: "Schedule", href: "/doctor/schedule", icon: Calendar },
    { name: "Patients", href: "/doctor/patients", icon: Users },
    { name: "Inventory", href: "/doctor/inventory", icon: Package },
    { name: "Finance", href: "/doctor/finance", icon: DollarSign },
  ];

  return (
    <div className="flex min-h-screen w-full bg-slate-50 relative overflow-hidden">
      
      {/* 🟣 1. FLOATING TOGGLE (No Top Bar) */}
      <div className="fixed top-6 left-6 z-50">
        <Button 
          size="icon" 
          aria-label="Toggle Navigation Menu"
          className="h-12 w-12 rounded-full shadow-xl bg-slate-900 hover:bg-slate-800 text-white transition-all duration-300 hover:scale-105"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* 🟣 2. SIDEBAR (Fixed) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-white shadow-2xl transform transition-transform duration-500 ease-out 
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-24 flex items-center px-8 border-b border-slate-800/50 bg-slate-950/30 pl-24">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Al-Shifa</h1>
            <p className="text-xs text-emerald-400 font-medium tracking-wider">DOCTOR PORTAL</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center justify-between px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200
                  ${isActive 
                    ? "bg-emerald-600/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <div className="flex items-center gap-3">
                    <item.icon className={`h-5 w-5 ${isActive ? "text-emerald-400" : "group-hover:text-white transition-colors"}`} />
                    {item.name}
                </div>
                {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-6 border-t border-slate-800/50 bg-slate-950/30">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-950/30 rounded-xl transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* 🟣 3. MAIN CONTENT (No Header!) */}
      <main 
        className={`flex-1 min-h-screen transition-all duration-500 ease-in-out p-6 md:p-12
        ${isSidebarOpen ? "ml-0 md:ml-0 opacity-50 blur-sm pointer-events-none" : "ml-0"}`}
      >
        {/* Invisible Spacer: Pushes content down so it doesn't hide behind the floating button */}
        <div className="h-12 w-full mb-8" /> 

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
           {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}