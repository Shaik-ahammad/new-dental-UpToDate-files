"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, User, Stethoscope, Building2, ShieldCheck, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FloatingAuthMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  // Menu Items Configuration
  const menuItems = [
    {
      role: "Doctor",
      icon: <Stethoscope className="h-4 w-4" />,
      links: [
        { label: "Login", href: "/auth/doctor/login", icon: <LogIn className="h-3 w-3" /> },
        { label: "Sign Up", href: "/auth/doctor/signup", icon: <UserPlus className="h-3 w-3" /> },
      ]
    },
    {
      role: "Patient",
      icon: <User className="h-4 w-4" />,
      links: [
        { label: "Login", href: "/auth/patient/login", icon: <LogIn className="h-3 w-3" /> },
        { label: "Sign Up", href: "/auth/patient/signup", icon: <UserPlus className="h-3 w-3" /> },
      ]
    },
    {
      role: "Organization",
      icon: <Building2 className="h-4 w-4" />,
      links: [
        { label: "Login", href: "/auth/organization/login", icon: <LogIn className="h-3 w-3" /> },
        { label: "Sign Up", href: "/auth/organization/signup", icon: <UserPlus className="h-3 w-3" /> },
      ]
    },
    {
      role: "Admin",
      icon: <ShieldCheck className="h-4 w-4" />,
      links: [
        { label: "Login Only", href: "/auth/admin/login", icon: <LogIn className="h-3 w-3" /> },
      ]
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Expanded Menu */}
      <div className={`transition-all duration-300 origin-bottom-right ${isOpen ? "scale-100 opacity-100 mb-4" : "scale-0 opacity-0 mb-0 h-0 overflow-hidden"}`}>
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 w-64">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Select Portal</h3>
          <div className="space-y-4">
            {menuItems.map((item) => (
              <div key={item.role} className="group">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1.5 px-2">
                  <div className="p-1 bg-slate-100 rounded-md text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                    {item.icon}
                  </div>
                  {item.role}
                </div>
                <div className="grid grid-cols-2 gap-2 pl-9">
                  {item.links.map((link) => (
                    <Link key={link.label} href={link.href}>
                      <div className="text-xs flex items-center gap-1.5 py-1.5 px-2 rounded-md hover:bg-slate-50 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                         {link.icon}
                         {link.label}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={toggleMenu}
        className={`h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95
          ${isOpen ? "bg-slate-900 rotate-90" : "bg-blue-600 hover:bg-blue-500"}
        `}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Menu className="h-6 w-6 text-white" />
        )}
      </button>
    </div>
  );
}