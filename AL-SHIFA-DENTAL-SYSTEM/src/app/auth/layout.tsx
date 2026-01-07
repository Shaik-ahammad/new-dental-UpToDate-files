"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, X, Home, Activity, Globe, 
  Layers, User, LayoutGrid 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // 🎨 DYNAMIC THEMING ENGINE
  const isDoctor = pathname.includes("doctor");
  const isAdmin = pathname.includes("admin");
  const isOrg = pathname.includes("organization");
  const isPatient = pathname.includes("patient");

  // 1. DEFAULT STATE (Role Selection / Home)
  let accentColor = "bg-blue-600";
  let bgGradient = "from-slate-900 to-blue-950";
  let roleLabel = "WELCOME HOME";
  let HeroIcon = Home;

  // 2. SPECIFIC PORTAL OVERRIDES
  if (isDoctor) {
    accentColor = "bg-emerald-600";
    bgGradient = "from-slate-950 to-emerald-950"; 
    roleLabel = "DOCTOR PORTAL";
    HeroIcon = Activity;
  } else if (isAdmin) {
    accentColor = "bg-indigo-600";
    bgGradient = "from-indigo-950 to-slate-950";
    roleLabel = "SYSTEM CONTROL";
    HeroIcon = Layers;
  } else if (isOrg) {
    accentColor = "bg-cyan-600";
    bgGradient = "from-cyan-950 to-slate-900";
    roleLabel = "ORGANIZATION";
    HeroIcon = Globe;
  } else if (isPatient) {
    accentColor = "bg-teal-600";
    bgGradient = "from-slate-900 to-teal-950";
    roleLabel = "PATIENT PORTAL";
    HeroIcon = User;
  }

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-slate-50">
      
      {/* 1. FLOATING TOGGLE */}
      <div className="fixed top-6 left-6 z-50 animate-in fade-in zoom-in duration-500">
        <Button 
          size="icon" 
          className={`h-12 w-12 rounded-full shadow-2xl text-white transition-all duration-300 hover:scale-110 ${isMenuOpen ? "bg-slate-800" : "bg-black"}`}
          onClick={() => setMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* 2. DRAWER MENU */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-80 bg-white shadow-2xl transform transition-transform duration-500 ease-in-out border-r border-slate-100 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-32 flex items-center px-8 pl-24 border-b border-slate-50 bg-slate-50/50">
          <span className="text-2xl font-black tracking-tight text-slate-900">Al-Shifa</span>
        </div>
        <nav className="p-6 space-y-3">
          {/* 🟢 CHANGE: Added onClick={() => setMenuOpen(false)} to auto-close menu */}
          <Link 
            href="/" 
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-4 px-4 py-4 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all"
          >
            <Home className="h-5 w-5" /> Home
          </Link>
          
          <Link 
            href="/auth/role-selection" 
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-4 px-4 py-4 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all"
          >
            <LayoutGrid className="h-5 w-5" /> Portals
          </Link>
        </nav>
      </aside>

      {/* 3. SPLIT SCREEN LAYOUT */}
      
      {/* LEFT: VISUAL (Fixed Desktop) */}
      <div className={`hidden lg:flex lg:w-5/12 relative bg-gradient-to-br ${bgGradient} items-center justify-center overflow-hidden border-r border-white/5`}>
         <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 mix-blend-overlay ${accentColor} -translate-y-1/2 translate-x-1/2`}></div>
         <div className={`absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 mix-blend-overlay ${accentColor} translate-y-1/2 -translate-x-1/2`}></div>
         
         <div className="relative z-10 p-12 text-white max-w-lg animate-in slide-in-from-left duration-700">
            <div className="mb-8">
                <HeroIcon className={`h-16 w-16 text-white opacity-80`} />
            </div>
            
            <div className={`inline-block px-4 py-1.5 mb-6 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-[10px] font-bold tracking-[0.2em] uppercase shadow-lg`}>
              {roleLabel}
            </div>
            
            <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight drop-shadow-xl">
              Healthcare <br/> Reimagined.
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed font-light border-l-2 border-white/20 pl-6">
              Experience the power of Neural Intelligence in dental care. Secure, efficient, and tailored for you.
            </p>
         </div>
      </div>

      {/* RIGHT: CONTENT (Scrollable) */}
      <div className="w-full lg:w-7/12 h-screen overflow-y-auto bg-slate-50 flex flex-col p-6 md:p-12 relative">
         
         {/* Mobile Top Gradient Bar */}
         <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${isDoctor ? "from-emerald-500 to-teal-500" : isPatient ? "from-teal-500 to-blue-500" : "from-blue-500 to-indigo-500"} lg:hidden z-10`}></div>

         <main className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 my-auto mx-auto">
            {children}
         </main>
      </div>

      {/* Overlay */}
      {isMenuOpen && <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-300" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}