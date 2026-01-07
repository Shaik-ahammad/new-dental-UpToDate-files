"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users, UserCog, Building, 
  Menu, X, LogOut, ChevronLeft, ChevronRight, 
  Settings, Bell, ShieldCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import api from "@/lib/api";

const ORG_NAV = [
  { label: "Dashboard", href: "/organization/dashboard", icon: LayoutDashboard },
  { label: "My Profile", href: "/organization/profile", icon: Building },
  { label: "Doctors & Staff", href: "/organization/doctors", icon: Users },
  { label: "Appointments", href: "/organization/appointments", icon: UserCog },
];

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Mobile Toggle
  const [isCollapsed, setIsCollapsed] = useState(false);   // Desktop Collapse
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  // 1. Fetch User Info for Sidebar Profile
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data);
      } catch (e) {
        console.error("Failed to load user info", e);
      }
    };
    fetchUser();
  }, []);

  // 2. Live Logout Logic
  const handleLogout = () => {
    localStorage.clear(); // Clear all tokens
    router.push("/auth/role-selection");
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 relative overflow-hidden font-sans">
      
      {/* 📱 Mobile Toggle (Floating) */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button 
          size="icon" 
          className="h-10 w-10 rounded-full shadow-xl bg-cyan-950 text-white hover:bg-cyan-900 transition-all"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* 🏛️ SIDEBAR */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-40 bg-gradient-to-b from-cyan-950 to-slate-950 text-white shadow-2xl 
          transition-all duration-300 ease-in-out border-r border-white/5
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:translate-x-0 lg:relative 
          ${isCollapsed ? "w-20" : "w-72"}
        `}
      >
        {/* Header / Brand */}
        <div className={`h-24 flex items-center ${isCollapsed ? "justify-center" : "px-8"} border-b border-white/10 relative`}>
          {isCollapsed ? (
            <ShieldCheck className="h-8 w-8 text-cyan-400" />
          ) : (
            <div className="animate-in fade-in duration-300">
              <h1 className="text-xl font-bold tracking-tight text-white">Al-Shifa</h1>
              <p className="text-[10px] text-cyan-400 font-bold tracking-[0.2em] uppercase">Partner Portal</p>
            </div>
          )}
          
          {/* Desktop Collapse Toggle */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 bg-cyan-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-cyan-500 transition-all hidden lg:flex"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 py-6 space-y-2 px-3">
          {ORG_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 relative overflow-hidden
                  ${isActive 
                    ? "bg-gradient-to-r from-cyan-600/20 to-transparent text-white shadow-[0_0_20px_rgba(6,182,212,0.15)] border-l-4 border-cyan-500" 
                    : "text-slate-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
                  }
                  ${isCollapsed ? "justify-center" : ""}
                `}
                title={isCollapsed ? item.label : ""}
              >
                <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-cyan-200"}`} />
                
                {!isCollapsed && (
                  <span className="text-sm font-medium tracking-wide animate-in fade-in duration-200">
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        
        {/* Footer: User Profile & Logout */}
        <div className="p-4 border-t border-white/10 bg-black/20">
           {!isCollapsed ? (
             <div className="space-y-4 animate-in fade-in duration-300">
                {/* Profile Card */}
                <Link href="/organization/profile">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                    <Avatar className="h-10 w-10 border-2 border-cyan-500/30 group-hover:border-cyan-400">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name || "Org"}`} />
                      <AvatarFallback className="bg-cyan-900 text-cyan-200">OR</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{user?.full_name || "Loading..."}</p>
                      <p className="text-xs text-slate-400 truncate">{user?.email || "organization@alshifa.com"}</p>
                    </div>
                    <Settings className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                </Link>

                {/* Logout Button */}
                <button 
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all border border-red-500/10 hover:border-red-500/50"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
             </div>
           ) : (
             <div className="flex flex-col items-center gap-4">
                <Link href="/organization/profile">
                  <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 ring-cyan-500 transition-all">
                    <AvatarFallback className="bg-cyan-900 text-xs">OR</AvatarFallback>
                  </Avatar>
                </Link>
                <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors" title="Logout">
                  <LogOut className="h-5 w-5" />
                </button>
             </div>
           )}
        </div>
      </aside>

      {/* 📄 MAIN CONTENT AREA */}
      <main className="flex-1 h-screen overflow-y-auto bg-slate-50 transition-all duration-300">
        <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto pb-20">
           {children}
        </div>
      </main>
      
      {/* Mobile Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}