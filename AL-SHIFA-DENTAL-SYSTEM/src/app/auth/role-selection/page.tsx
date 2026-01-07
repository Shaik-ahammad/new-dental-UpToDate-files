"use client";

import Link from "next/link";
import { User, Stethoscope, ShieldCheck, Building2, ArrowRight, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function RoleSelection() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500 w-full max-w-lg mx-auto">
      
      {/* Branding Header */}
      <div className="mb-10 text-center">
        <div className="h-16 w-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30 mb-6">
          <Activity className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
        <p className="text-slate-500 mt-2 text-lg">Please select your portal to continue</p>
      </div>

      {/* Role Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        
        {/* 1. Doctor */}
        <Link href="/auth/doctor/login" className="group">
          <Card className="p-5 border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all cursor-pointer h-full relative overflow-hidden bg-white hover:bg-emerald-50/10">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Stethoscope className="h-24 w-24 text-emerald-600 -mr-8 -mt-8" />
            </div>
            <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
              <Stethoscope className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700">Doctor</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">Manage clinics & patients.</p>
            <div className="flex items-center text-xs font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
              Access Portal <ArrowRight className="ml-1 h-3 w-3" />
            </div>
          </Card>
        </Link>

        {/* 2. Patient */}
        <Link href="/auth/patient/login" className="group">
          <Card className="p-5 border-slate-200 hover:border-teal-500 hover:shadow-xl transition-all cursor-pointer h-full relative overflow-hidden bg-white hover:bg-teal-50/10">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <User className="h-24 w-24 text-teal-600 -mr-8 -mt-8" />
            </div>
            <div className="h-12 w-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 mb-4 group-hover:bg-teal-600 group-hover:text-white transition-colors shadow-sm">
              <User className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700">Patient</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">Book slots & view records.</p>
            <div className="flex items-center text-xs font-bold text-teal-600 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
              Access Portal <ArrowRight className="ml-1 h-3 w-3" />
            </div>
          </Card>
        </Link>

        {/* 3. Organization */}
        <Link href="/auth/organization/login" className="group">
          <Card className="p-5 border-slate-200 hover:border-cyan-500 hover:shadow-xl transition-all cursor-pointer h-full relative overflow-hidden bg-white hover:bg-cyan-50/10">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Building2 className="h-24 w-24 text-cyan-600 -mr-8 -mt-8" />
            </div>
            <div className="h-12 w-12 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-600 mb-4 group-hover:bg-cyan-600 group-hover:text-white transition-colors shadow-sm">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-700">Organization</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">Manage facilities.</p>
            <div className="flex items-center text-xs font-bold text-cyan-600 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
              Access Portal <ArrowRight className="ml-1 h-3 w-3" />
            </div>
          </Card>
        </Link>

         {/* 4. Admin */}
        <Link href="/auth/admin/login" className="group">
          <Card className="p-5 border-slate-200 hover:border-indigo-500 hover:shadow-xl transition-all cursor-pointer h-full relative overflow-hidden bg-white hover:bg-indigo-50/10">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldCheck className="h-24 w-24 text-indigo-600 -mr-8 -mt-8" />
            </div>
            <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700">Admin</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">System control.</p>
            <div className="flex items-center text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
              Secure Login <ArrowRight className="ml-1 h-3 w-3" />
            </div>
          </Card>
        </Link>

      </div>
      
      <p className="mt-12 text-[10px] text-slate-400 font-medium tracking-widest uppercase text-center">
        Secured by Agentic AI • HIPAA Compliant
      </p>
    </div>
  );
}