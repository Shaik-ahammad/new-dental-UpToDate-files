"use client";

import { useEffect, useState } from "react";
import { 
  DollarSign, TrendingUp, CreditCard, 
  Download, Filter, ArrowUpRight 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

export default function OrgFinance() {
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/organization/dashboard/stats")
       .then(res => setRevenue(res.data.revenue))
       .catch(err => console.error(err))
       .finally(() => setLoading(false));
  }, []);

  const formatter = new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Financial Overview</h1>
          <p className="text-slate-500 mt-1">Revenue streams and transaction history.</p>
        </div>
        <Button variant="outline" className="border-slate-200 text-slate-600">
           <Download className="h-4 w-4 mr-2" /> Export Report
        </Button>
      </div>

      {/* BIG STAT CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="md:col-span-2 bg-slate-900 text-white border-0 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <CardContent className="p-8 relative z-10 flex flex-col justify-between h-full">
               <div>
                  <p className="text-emerald-400 font-bold uppercase tracking-wider text-xs mb-2">Total Revenue (YTD)</p>
                  <h2 className="text-5xl font-black tracking-tight mb-4">
                     {loading ? "..." : formatter.format(revenue)}
                  </h2>
                  <div className="inline-flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-full text-emerald-300 text-sm font-medium">
                     <TrendingUp className="h-4 w-4" /> +12.5% vs last month
                  </div>
               </div>
               
               {/* Visual Bar Chart (CSS Only) */}
               <div className="mt-8 flex items-end gap-2 h-24 opacity-80">
                  {[40, 65, 45, 80, 55, 90, 70, 85].map((h, i) => (
                     <div key={i} className="flex-1 bg-emerald-500/30 hover:bg-emerald-500 transition-colors rounded-t-sm" style={{ height: `${h}%` }}></div>
                  ))}
               </div>
            </CardContent>
         </Card>

         <Card className="border-slate-200 shadow-sm flex flex-col justify-center items-center text-center p-6">
             <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600">
                <CreditCard className="h-8 w-8" />
             </div>
             <h3 className="font-bold text-slate-900">Pending Payouts</h3>
             <p className="text-2xl font-black text-slate-900 mt-2 mb-1">AED 0.00</p>
             <p className="text-xs text-slate-500 mb-6">No pending settlements</p>
             <Button className="w-full bg-slate-900 text-white">Manage Bank Info</Button>
         </Card>
      </div>

      {/* RECENT TRANSACTIONS (Mock List for UI) */}
      <Card className="border-slate-200 shadow-sm">
         <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
         </CardHeader>
         <CardContent>
            <div className="space-y-4">
               {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border border-slate-100 text-emerald-600">
                           <ArrowUpRight className="h-5 w-5" />
                        </div>
                        <div>
                           <p className="font-bold text-slate-900">Consultation Fee</p>
                           <p className="text-xs text-slate-500">Patient #{8902 + i} • Dr. Sarah</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="font-bold text-emerald-700">+ AED 150.00</p>
                        <p className="text-xs text-slate-400">Just now</p>
                     </div>
                  </div>
               ))}
               <div className="text-center pt-2">
                  <Button variant="ghost" className="text-slate-500 text-xs">View All Transactions</Button>
               </div>
            </div>
         </CardContent>
      </Card>

    </div>
  );
}