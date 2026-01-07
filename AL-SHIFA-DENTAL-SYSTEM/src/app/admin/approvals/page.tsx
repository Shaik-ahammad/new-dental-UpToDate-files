"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  CheckCircle, XCircle, ShieldAlert, FileText, 
  Building2, Stethoscope, Loader2, MapPin 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminApprovals() {
  const [activeTab, setActiveTab] = useState("doctors");
  const [loading, setLoading] = useState(true);
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);
  const [pendingOrgs, setPendingOrgs] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch both queues
      const [docsRes, orgsRes] = await Promise.all([
        api.get("/admin/doctors/pending"),
        api.get("/admin/hospitals/pending")
      ]);
      setPendingDocs(docsRes.data);
      setPendingOrgs(orgsRes.data);
    } catch (e) {
      console.error("Failed to fetch pending items", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HANDLE ACTION (Approve/Reject) ---
  const handleAction = async (entityType: "doctor" | "hospital", id: string, action: "approve" | "reject") => {
    setActionLoading(id);
    try {
      await api.post(`/admin/verify/${entityType}/${id}?action=${action}`);
      // Refresh list locally
      if (entityType === "doctor") {
        setPendingDocs(prev => prev.filter(d => d.id !== id));
      } else {
        setPendingOrgs(prev => prev.filter(o => o.id !== id));
      }
    } catch (e) {
      alert("Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Access Control</h1>
          <p className="text-slate-500">Verify new registrations required by compliance.</p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
           <ShieldAlert className="h-4 w-4" />
           {pendingDocs.length + pendingOrgs.length} Pending Actions
        </div>
      </div>

      <Tabs defaultValue="doctors" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-12 mb-6">
          <TabsTrigger value="doctors" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white flex gap-2">
            <Stethoscope className="h-4 w-4" /> Pending Doctors ({pendingDocs.length})
          </TabsTrigger>
          <TabsTrigger value="organizations" className="rounded-lg data-[state=active]:bg-cyan-600 data-[state=active]:text-white flex gap-2">
            <Building2 className="h-4 w-4" /> Pending Organizations ({pendingOrgs.length})
          </TabsTrigger>
        </TabsList>

        {/* --- DOCTORS TAB --- */}
        <TabsContent value="doctors" className="space-y-4">
          {pendingDocs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-400">
               <CheckCircle className="h-12 w-12 mx-auto mb-2 text-slate-200" />
               <p>All doctors verified.</p>
            </div>
          ) : (
            pendingDocs.map((doc) => (
              <Card key={doc.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">
                    {doc.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{doc.name}</h3>
                    <div className="flex gap-3 text-sm text-slate-500 mt-1">
                       <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> License: {doc.license_number}</span>
                       <span className="bg-slate-100 px-2 rounded text-xs py-0.5">{doc.specialization}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{doc.email}</p>
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <Button 
                    variant="outline" 
                    className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleAction("doctor", doc.id, "reject")}
                    disabled={actionLoading === doc.id}
                  >
                    Reject
                  </Button>
                  <Button 
                    className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                    onClick={() => handleAction("doctor", doc.id, "approve")}
                    disabled={actionLoading === doc.id}
                  >
                    {actionLoading === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve License"}
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* --- ORGANIZATIONS TAB --- */}
        <TabsContent value="organizations" className="space-y-4">
           {pendingOrgs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-400">
               <Building2 className="h-12 w-12 mx-auto mb-2 text-slate-200" />
               <p>All facilities verified.</p>
            </div>
          ) : (
            pendingOrgs.map((org) => (
              <Card key={org.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{org.name}</h3>
                    <div className="flex flex-col gap-1 text-sm text-slate-500 mt-1">
                       <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> License: {org.license_number || "Pending"}</span>
                       <span className="flex items-center gap-1 text-xs"><MapPin className="h-3 w-3" /> Location: {org.lat?.toFixed(4)}, {org.lng?.toFixed(4)}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{org.contact_email}</p>
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <Button 
                    variant="outline" 
                    className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleAction("hospital", org.id, "reject")}
                    disabled={actionLoading === org.id}
                  >
                    Reject
                  </Button>
                  <Button 
                    className="flex-1 md:flex-none bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/20"
                    onClick={() => handleAction("hospital", org.id, "approve")}
                    disabled={actionLoading === org.id}
                  >
                    {actionLoading === org.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Facility"}
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}