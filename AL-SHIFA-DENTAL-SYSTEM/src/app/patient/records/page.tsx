"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, FileText, Bone, Download, Pill, 
  Search, Filter, FolderOpen 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

export default function PatientRecords() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]); // Prescriptions
  const [scans, setScans] = useState<any[]>([]);   // X-Rays

  // 🟢 FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Mocking API calls for now (Replace with real endpoints if available)
        // const res = await api.get("/patient/records");
        // setRecords(res.data);
        
        // Simulating Empty State for "Live" demo (or remove setTimeout to see empty immediately)
        setTimeout(() => setLoading(false), 1000);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* HEADER */}
      <div className="bg-teal-700 pb-20 pt-10 px-6 shadow-xl rounded-b-[40px]">
        <div className="max-w-5xl mx-auto">
          <Link href="/patient/dashboard">
            <Button variant="ghost" className="text-teal-100 hover:text-white hover:bg-white/10 -ml-4 mb-4">
              <ArrowLeft className="h-5 w-5 mr-2" /> Back to Dashboard
            </Button>
          </Link>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-white">Medical Records</h1>
              <p className="text-teal-200 mt-1">Access your digital health file.</p>
            </div>
            <div className="hidden md:block">
               <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                 <FolderOpen className="h-6 w-6 text-white" />
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-10">
        <Tabs defaultValue="prescriptions" className="w-full">
          
          <TabsList className="bg-white p-1 h-14 rounded-2xl shadow-lg border border-slate-100 grid grid-cols-2 mb-8">
            <TabsTrigger value="prescriptions" className="rounded-xl h-12 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:font-bold transition-all">
               <Pill className="h-4 w-4 mr-2" /> Prescriptions
            </TabsTrigger>
            <TabsTrigger value="xrays" className="rounded-xl h-12 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:font-bold transition-all">
               <Bone className="h-4 w-4 mr-2" /> X-Rays & Scans
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PRESCRIPTIONS */}
          <TabsContent value="prescriptions" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {records.length > 0 ? (
               records.map((rec) => (
                 <Card key={rec.id} className="border-l-4 border-l-teal-500 hover:shadow-md transition-all">
                   {/* Map your record data here */}
                 </Card>
               ))
            ) : (
               <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center">
                  <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                     <Pill className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No Prescriptions Found</h3>
                  <p className="text-slate-500 text-sm max-w-xs mt-2">
                    Doctors haven't prescribed any medication yet. Once they do, it will appear here.
                  </p>
               </div>
            )}
          </TabsContent>

          {/* TAB 2: X-RAYS */}
          <TabsContent value="xrays" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {scans.length > 0 ? (
               // Render Scans
               <div></div>
             ) : (
               <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center">
                  <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                     <Bone className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No Scans Uploaded</h3>
                  <p className="text-slate-500 text-sm max-w-xs mt-2">
                    X-Rays, OPGs, and other imaging files will be listed here after your checkup.
                  </p>
               </div>
             )}
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}