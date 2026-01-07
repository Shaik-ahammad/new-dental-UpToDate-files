"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Search, User, ChevronRight, Loader2, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function PatientRegistry() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 1. Fetch Patients on Load
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get("/doctor/patients");
        setPatients(res.data);
      } catch (e) {
        console.error("Failed to load registry", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // 2. Client-Side Search Logic
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans p-6">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Patient Registry <span className="text-emerald-600 text-3xl">.</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Access case files and medical histories.</p>
        </div>
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
                placeholder="Search by name or email..." 
                className="pl-10 bg-slate-50 border-slate-200 h-10 shadow-sm focus:ring-emerald-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
      </div>

      {/* Patient Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 className="h-10 w-10 animate-spin mb-2 text-emerald-600" />
            <p>Loading Registry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                <Card key={patient.id} className="group hover:shadow-xl transition-all border-slate-200 hover:border-emerald-200 cursor-pointer bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl border-2 border-white shadow-md">
                                {patient.name.charAt(0)}
                            </div>
                            <Badge variant="outline" className="bg-slate-50 text-slate-400 text-[10px] tracking-widest font-mono">
                                ID: {patient.id.slice(0, 4)}
                            </Badge>
                        </div>
                        
                        <div className="mt-5 space-y-1">
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                {patient.name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Mail className="h-3 w-3" /> {patient.email}
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Status</span>
                                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Active
                                </span>
                            </div>
                            <Link href={`/doctor/patients/${patient.id}`}>
                                <Button size="sm" className="bg-slate-900 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-slate-900/10">
                                    View Case <ChevronRight className="ml-1 h-3 w-3" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )) : (
                <div className="col-span-full text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                    <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No patients found matching "{search}"</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
}