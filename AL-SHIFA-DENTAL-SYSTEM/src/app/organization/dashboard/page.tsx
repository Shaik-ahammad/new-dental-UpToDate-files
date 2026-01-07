"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, Calendar, DollarSign, Package, 
  ArrowUpRight, Activity, AlertTriangle, 
  Plus, FileText, Loader2 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

export default function OrgDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    doctors: 0,
    appointments_today: 0,
    revenue: 0,
    low_stock_alerts: 0
  });

  // 🟢 Live Data Fetching
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/organization/dashboard/stats");
        setStats(res.data);
      } catch (e) {
        console.error("Dashboard sync failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-600" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hospital Overview</h1>
          <p className="text-slate-500 mt-1">Real-time operational insights.</p>
        </div>
        <div className="flex gap-2">
           <Link href="/organization/doctors">
             <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50">
               <Users className="h-4 w-4 mr-2" /> Manage Staff
             </Button>
           </Link>
           <Link href="/organization/inventory">
             <Button className="bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-600/20">
               <Plus className="h-4 w-4 mr-2" /> Add Inventory
             </Button>
           </Link>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Revenue Card */}
        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</CardTitle>
            <div className="h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
               <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">
               {new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(stats.revenue)}
            </div>
            <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +12% this month
            </p>
          </CardContent>
        </Card>

        {/* Doctors Card */}
        <Card className="border-l-4 border-l-cyan-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Staff</CardTitle>
            <div className="h-8 w-8 bg-cyan-50 rounded-lg flex items-center justify-center text-cyan-600">
               <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{stats.doctors}</div>
            <p className="text-xs text-slate-500 mt-1">Doctors on duty</p>
          </CardContent>
        </Card>

        {/* Appointments Card */}
        <Card className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visits Today</CardTitle>
            <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
               <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{stats.appointments_today}</div>
            <p className="text-xs text-indigo-600 font-bold mt-1">Live updates</p>
          </CardContent>
        </Card>

        {/* Inventory Alert Card */}
        <Card className={`border-l-4 shadow-sm hover:shadow-md transition-all ${stats.low_stock_alerts > 0 ? 'border-l-red-500 bg-red-50/10' : 'border-l-slate-300'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inventory Alerts</CardTitle>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${stats.low_stock_alerts > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
               <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-black ${stats.low_stock_alerts > 0 ? 'text-red-600' : 'text-slate-900'}`}>
               {stats.low_stock_alerts}
            </div>
            <p className="text-xs text-slate-500 mt-1">Items below threshold</p>
          </CardContent>
        </Card>
      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         
         {/* System Health / Shortcuts */}
         <Card className="shadow-sm border-slate-200">
            <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-cyan-600" /> System Shortcuts
               </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
               <Link href="/organization/doctors">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-cyan-200 hover:bg-cyan-50 transition-all cursor-pointer group">
                     <div className="font-bold text-slate-700 group-hover:text-cyan-700">Verify Doctors</div>
                     <div className="text-xs text-slate-500">Approve new registrations</div>
                  </div>
               </Link>
               <Link href="/organization/inventory">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-cyan-200 hover:bg-cyan-50 transition-all cursor-pointer group">
                     <div className="font-bold text-slate-700 group-hover:text-cyan-700">Restock Items</div>
                     <div className="text-xs text-slate-500">Update supply counts</div>
                  </div>
               </Link>
               <Link href="/organization/finance">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-cyan-200 hover:bg-cyan-50 transition-all cursor-pointer group">
                     <div className="font-bold text-slate-700 group-hover:text-cyan-700">View Finance</div>
                     <div className="text-xs text-slate-500">Revenue reports</div>
                  </div>
               </Link>
               <Link href="/organization/profile">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-cyan-200 hover:bg-cyan-50 transition-all cursor-pointer group">
                     <div className="font-bold text-slate-700 group-hover:text-cyan-700">Update Profile</div>
                     <div className="text-xs text-slate-500">Facility settings</div>
                  </div>
               </Link>
            </CardContent>
         </Card>

         {/* Promo / Upgrade (Visual Filler for "Pro" look) */}
         <div className="rounded-xl bg-gradient-to-br from-cyan-900 to-slate-900 p-8 text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
               <Badge className="bg-cyan-500/20 text-cyan-200 border-0 mb-4">Enterprise Feature</Badge>
               <h3 className="text-2xl font-bold mb-2">AI Analytics</h3>
               <p className="text-cyan-100/70 text-sm mb-6 max-w-xs">
                  Unlock predictive insights on patient flow and inventory consumption with our new Neural Engine.
               </p>
               <Button className="bg-white text-slate-900 hover:bg-cyan-50 border-0 w-fit">
                  View Report <ArrowUpRight className="ml-2 h-4 w-4" />
               </Button>
            </div>
         </div>

      </div>
    </div>
  );
}