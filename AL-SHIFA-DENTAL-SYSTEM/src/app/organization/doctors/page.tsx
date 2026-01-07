"use client";

import { useEffect, useState } from "react";
import { 
  Users, Search, Filter, CheckCircle, XCircle, 
  Stethoscope, MoreHorizontal, Loader2, ShieldAlert 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";

export default function OrgDoctors() {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 1. Fetch Real Doctors (Live Data)
  const fetchDoctors = async () => {
    try {
      const res = await api.get("/organization/doctors");
      setDoctors(res.data);
    } catch (e) {
      console.error("Failed to fetch doctors", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // 2. Handle Approval/Rejection
  const handleAction = async (userId: string, action: "approve" | "reject") => {
    setActionLoading(userId);
    try {
      await api.post(`/organization/doctors/${userId}/verify?action=${action}`);
      // Refresh list to update UI immediately
      await fetchDoctors();
    } catch (e) {
      alert("Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // 3. Filter Lists
  const pendingDocs = doctors.filter(d => d.status === "Pending Approval");
  const activeDocs = doctors.filter(d => d.status === "Active");

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-600" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Medical Staff</h1>
          <p className="text-slate-500 mt-1">Manage doctors linked to your facility.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50">
             <Filter className="h-4 w-4 mr-2" /> Filter
           </Button>
           <Button className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/20">
             <Users className="h-4 w-4 mr-2" /> Add Staff Manually
           </Button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card className="p-5 border-l-4 border-l-cyan-500 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Doctors</p>
                  <h3 className="text-2xl font-black text-slate-900">{doctors.length}</h3>
               </div>
               <div className="h-10 w-10 bg-cyan-50 rounded-full flex items-center justify-center">
                  <Stethoscope className="h-5 w-5 text-cyan-600" />
               </div>
            </div>
         </Card>
         <Card className="p-5 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active</p>
                  <h3 className="text-2xl font-black text-slate-900">{activeDocs.length}</h3>
               </div>
               <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
               </div>
            </div>
         </Card>
         <Card className="p-5 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending</p>
                  <h3 className="text-2xl font-black text-slate-900">{pendingDocs.length}</h3>
               </div>
               <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
               </div>
            </div>
         </Card>
      </div>

      {/* MAIN CONTENT TABS */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-12 mb-6 w-full md:w-auto inline-flex shadow-sm">
          <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 font-medium px-6 transition-all">
             Active Staff ({activeDocs.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 font-medium px-6 transition-all relative">
             Pending Requests 
             {pendingDocs.length > 0 && <span className="ml-2 bg-amber-500 text-white text-[10px] px-1.5 rounded-full font-bold">{pendingDocs.length}</span>}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: ACTIVE STAFF */}
        <TabsContent value="active" className="space-y-4 animate-in slide-in-from-left-4 duration-300">
           <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="p-4 pl-6">Doctor Name</th>
                    <th className="p-4">Specialization</th>
                    <th className="p-4">License No.</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeDocs.length > 0 ? activeDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold uppercase shadow-sm">
                            {doc.name.charAt(0)}
                          </div>
                          <div>
                             <p className="font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">{doc.name}</p>
                             <p className="text-xs text-slate-400">{doc.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{doc.specialization}</td>
                      <td className="p-4 font-mono text-xs text-slate-500 bg-slate-50/50 rounded">{doc.license}</td>
                      <td className="p-4">
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 hover:bg-emerald-100 px-2 py-0.5">Active</Badge>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-cyan-600 hover:bg-cyan-50">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400 bg-slate-50/30">
                        <div className="flex flex-col items-center">
                           <Users className="h-8 w-8 text-slate-300 mb-2" />
                           <p>No active doctors found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </TabsContent>

        {/* TAB 2: PENDING REQUESTS */}
        <TabsContent value="pending" className="space-y-4 animate-in slide-in-from-right-4 duration-300">
           {pendingDocs.length > 0 ? pendingDocs.map((doc) => (
             <Card key={doc.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-all border-amber-100 bg-amber-50/30">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg shadow-sm">
                    {doc.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{doc.name}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-600 mt-1">
                       <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-amber-100 shadow-sm text-xs font-medium">
                         <Stethoscope className="h-3 w-3 text-amber-500" /> {doc.specialization}
                       </span>
                       <span className="font-mono text-slate-400 text-xs py-1 px-2 bg-slate-100 rounded">License: {doc.license}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                       <ClockIcon className="h-3 w-3" /> Applied: {new Date(doc.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <Button 
                    variant="outline" 
                    className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 bg-white"
                    onClick={() => handleAction(doc.id, "reject")}
                    disabled={actionLoading === doc.id}
                  >
                    Reject
                  </Button>
                  <Button 
                    className="flex-1 md:flex-none bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/20 font-bold"
                    onClick={() => handleAction(doc.id, "approve")}
                    disabled={actionLoading === doc.id}
                  >
                    {actionLoading === doc.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Approve Doctor
                  </Button>
                </div>
             </Card>
           )) : (
             <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center">
                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                   <ShieldAlert className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No Pending Requests</h3>
                <p className="text-slate-500 text-sm max-w-xs mt-2 leading-relaxed">
                  New doctor registrations linked to your facility will appear here for verification.
                </p>
             </div>
           )}
        </TabsContent>

      </Tabs>
    </div>
  );
}

// Simple Clock Icon for the Date display
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}