import React, { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

export default function AppLayout({ children, role = "doctor" }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">
      {/* The Navigation Layer */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        role={role} 
      />

      {/* Main Content Area */}
      <div className="flex flex-col min-h-screen transition-all duration-300">
        
        {/* Sticky Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          title={role.charAt(0).toUpperCase() + role.slice(1) + " Portal"}
        />

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500 slide-in-from-bottom-4">
          {children}
        </main>
      </div>
    </div>
  );
}