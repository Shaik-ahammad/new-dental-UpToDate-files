"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { ArrowLeft, Calendar, Clock, MapPin, User, Loader2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AppointmentHistory() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);

  // 🟢 LIVE BACKEND CONNECTION
  useEffect(() => {
    const fetchAppts = async () => {
      try {
        const res = await api.get("/patient/appointments");
        setAppointments(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAppts();
  }, []);

  // Sort: Newest First
  const sortedAppts = [...appointments].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
         <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
            <Link href="/patient/dashboard">
               <Button size="icon" variant="ghost" className="rounded-full hover:bg-slate-100">
                  <ArrowLeft className="h-5 w-5 text-slate-600" />
               </Button>
            </Link>
            <h1 className="text-lg font-bold text-slate-900">Appointment History</h1>
         </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
         
         {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-teal-600" /></div>
         ) : sortedAppts.length > 0 ? (
            sortedAppts.map((appt) => {
               // Determine Status Color
               const isPast = new Date(appt.date) < new Date();
               const statusColor = appt.status === "confirmed" ? "bg-emerald-100 text-emerald-700" 
                               : appt.status === "cancelled" ? "bg-red-100 text-red-700" 
                               : "bg-blue-100 text-blue-700";

               return (
                  <Card key={appt.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden">
                     <div className={`h-1.5 w-full ${appt.status === 'confirmed' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                     <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                              <h3 className="text-lg font-bold text-slate-900">{appt.treatment}</h3>
                              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                 <User className="h-3 w-3" /> Dr. {appt.doctor}
                              </p>
                           </div>
                           <Badge className={`${statusColor} border-0 capitalize`}>
                              {isPast && appt.status !== 'cancelled' ? 'Completed' : appt.status}
                           </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-600">
                           <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg">
                              <Calendar className="h-4 w-4 text-teal-600" />
                              {appt.date}
                           </div>
                           <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg">
                              <Clock className="h-4 w-4 text-teal-600" />
                              {appt.time}
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               );
            })
         ) : (
            // EMPTY STATE
            <div className="text-center py-20">
               <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="h-10 w-10 text-slate-300" />
               </div>
               <h3 className="text-lg font-bold text-slate-900">No Appointments</h3>
               <p className="text-slate-500 text-sm mb-6">You haven't visited us yet.</p>
               <Link href="/patient/appointments/new">
                  <Button className="bg-teal-600 hover:bg-teal-700 rounded-full px-8">Book First Visit</Button>
               </Link>
            </div>
         )}

      </div>
    </div>
  );
}