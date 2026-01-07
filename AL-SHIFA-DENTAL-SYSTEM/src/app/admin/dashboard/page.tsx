"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { 
  Users, Building2, Stethoscope, DollarSign, 
  ArrowUpRight, AlertCircle, Loader2 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/dashboard/stats");
        setStats(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Overview</h1>
        <p className="text-slate-500">Real-time metrics across the Al-Shifa Ecosystem.</p>
      </div>

      {/* 1. KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Revenue Card */}
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ${stats?.financials.revenue.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <span className="text-emerald-600 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" /> +12%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        {/* Doctors Card */}
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Doctors</CardTitle>
            <Stethoscope className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats?.total_users.doctors}</div>
            <p className="text-xs text-slate-500 mt-1">
              Across {stats?.total_users.hospitals} Organizations
            </p>
          </CardContent>
        </Card>

        {/* Patients Card */}
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats?.total_users.patients}</div>
            <p className="text-xs text-slate-500 mt-1">
              {stats?.financials.appointments} Completed Visits
            </p>
          </CardContent>
        </Card>

        {/* Pending Actions Card */}
        <Card className={`border-slate-200 shadow-sm transition-shadow ${stats?.action_items.pending_doctors > 0 ? 'bg-amber-50/50 border-amber-200' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Approvals</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {stats?.action_items.pending_doctors + stats?.action_items.pending_hospitals}
            </div>
            <div className="flex gap-2 mt-2">
               <Link href="/admin/doctors">
                 <Button variant="outline" size="xs" className="h-7 text-xs bg-white">
                    Review Queue
                 </Button>
               </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Quick Actions / Context */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Recent System Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
               No critical system alerts generated in the last 24h.
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 border-slate-200 shadow-sm bg-slate-900 text-white">
          <CardHeader>
            <CardTitle className="text-white">AI Neural Core</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Model Status</span>
                <span className="text-emerald-400 font-mono">ONLINE</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Vector Memory</span>
                <span className="text-white font-mono">14.2 MB</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                 <div className="bg-emerald-500 h-full w-[85%] animate-pulse"></div>
              </div>
              <p className="text-xs text-slate-500 pt-2">Processing Agent requests normally.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}