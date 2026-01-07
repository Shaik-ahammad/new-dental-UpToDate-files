"use client";

import { useEffect, useState } from "react";
import { 
  Calendar, Search, Filter, CheckCircle, XCircle, 
  Clock, User, FileText, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";

export default function OrgAppointments() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const fetchAppointments = async () => {
    try {
      const res = await api.get("/organization/appointments");
      setAppointments(res.data);
    } catch (e) {
      console.error("Failed to load appointments", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filter Logic
  const filtered = appointments.filter(a => 
    a.patient_name.toLowerCase().includes(search.toLowerCase()) ||
    a.doctor_name.toLowerCase().includes(search.toLowerCase())
  );

  const upcoming = filtered.filter(a => ["scheduled", "confirmed"].includes(a.status));
  const history = filtered.filter(a => ["completed", "cancelled"].includes(a.status));

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-600" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Appointments</h1>
          <p className="text-slate-500 mt-1">Track patient visits and doctor schedules.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search patient or doctor..." 
                className="pl-9 bg-white border-slate-200"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
           </div>
           <Button variant="outline" className="border-slate-200 text-slate-600">
             <Filter className="h-4 w-4 mr-2" /> Filter
           </Button>
        </div>
      </div>

      {/* TABS */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-12 mb-6 inline-flex shadow-sm">
          <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 px-6 font-medium">
             Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 px-6 font-medium">
             History ({history.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB CONTENT: UPCOMING */}
        <TabsContent value="upcoming" className="space-y-4">
           {upcoming.length > 0 ? upcoming.map((appt) => (
             <AppointmentCard key={appt.id} appt={appt} />
           )) : <EmptyState />}
        </TabsContent>

        {/* TAB CONTENT: HISTORY */}
        <TabsContent value="history" className="space-y-4">
           {history.length > 0 ? history.map((appt) => (
             <AppointmentCard key={appt.id} appt={appt} />
           )) : <EmptyState />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-Component for Card
function AppointmentCard({ appt }: { appt: any }) {
  return (
    <Card className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-all border-slate-200">
       <div className="flex gap-4">
          <div className="h-14 w-14 rounded-2xl bg-cyan-50 flex flex-col items-center justify-center text-cyan-700 border border-cyan-100 shadow-sm">
             <span className="text-[10px] font-bold uppercase">{new Date(appt.date).toLocaleString('default', { month: 'short' })}</span>
             <span className="text-xl font-black">{new Date(appt.date).getDate()}</span>
          </div>
          <div>
             <h3 className="font-bold text-slate-900 text-lg">{appt.patient_name}</h3>
             <div className="flex flex-wrap gap-3 text-sm text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                   <Clock className="h-3.5 w-3.5 text-cyan-500" /> {appt.time}
                </span>
                <span className="flex items-center gap-1">
                   <User className="h-3.5 w-3.5 text-cyan-500" /> Dr. {appt.doctor_name}
                </span>
             </div>
             {appt.reason && <p className="text-xs text-slate-400 mt-2 italic">"{appt.reason}"</p>}
          </div>
       </div>
       
       <div className="flex items-center gap-4">
          <Badge className={`
             capitalize border-0 px-3 py-1 
             ${appt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 
               appt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 
               appt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}
          `}>
             {appt.status}
          </Badge>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-cyan-600">
             <FileText className="h-4 w-4" />
          </Button>
       </div>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center">
       <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Calendar className="h-10 w-10 text-slate-300" />
       </div>
       <h3 className="text-xl font-bold text-slate-900">No Appointments</h3>
       <p className="text-slate-500 text-sm max-w-xs mt-2">
         There are no appointments in this category yet.
       </p>
    </div>
  )
}