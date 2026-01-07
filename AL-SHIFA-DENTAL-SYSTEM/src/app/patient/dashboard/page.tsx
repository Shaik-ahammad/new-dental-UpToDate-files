"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { 
  Calendar, FileText, Clock, User, LogOut, 
  Loader2, Phone, Sparkles, Scan, Activity, 
  Bone, Stethoscope, ChevronRight 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PatientChatWidget from "@/components/chat/PatientChatWidget";

export default function PatientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]); // 🟢 Real Records Data
  const [loading, setLoading] = useState(true);
  
  // Timer State
  const [countdown, setCountdown] = useState({ h: 24, m: 0, s: 0 });

  // 1. Data Fetching
  useEffect(() => {
    const initDashboard = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/patient/login");
        return;
      }

      try {
        // Fetch User, Appointments, AND Records in parallel
        const [profileRes, apptRes, recordRes] = await Promise.all([
            api.get("/auth/me"),
            api.get("/patient/appointments"),
            api.get("/patient/records").catch(() => ({ data: [] })) // Handle if endpoint empty
        ]);
        
        setUser(profileRes.data);
        setAppointments(apptRes.data || []); 
        setRecords(recordRes.data || []);

      } catch (e) {
        console.error("Session invalid", e);
        localStorage.removeItem("token");
        router.push("/auth/patient/login");
      } finally {
        setLoading(false);
      }
    };

    initDashboard();

    const timer = setInterval(() => {
      setCountdown(prev => ({ ...prev, s: prev.s === 0 ? 59 : prev.s - 1 }));
    }, 1000);
    return () => clearInterval(timer);

  }, [router]);

  // 2. Handlers
  const handleLogout = () => {
    localStorage.clear();
    router.push("/auth/role-selection");
  };

  const handleCancel = async (apptId: string) => {
    if (confirm("Are you sure you want to cancel this appointment?")) {
      // In real app: await api.delete(...)
      setAppointments(prev => prev.filter(a => a.id !== apptId));
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
      </div>
    );
  }

  // --- 🟢 LOGIC: REAL DATA CALCULATION ---
  
  // 1. Next Appointment
  const nextAppointment = appointments
    .filter(a => new Date(a.date) >= new Date() && a.status === 'confirmed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  // 2. Case Track Logic (Derived from History)
  const pastAppointments = appointments.filter(a => new Date(a.date) < new Date());
  let caseStage = 1; // Default: Consultation
  if (pastAppointments.length > 0) caseStage = 2; // Treatment
  if (pastAppointments.length > 5) caseStage = 3; // Recovery/Maintenance
  
  const progressPercent = caseStage === 1 ? 25 : caseStage === 2 ? 60 : 90;

  // 3. Medical Insights Data
  const latestXray = records.find(r => r.type === 'xray') || null;
  const prescriptionCount = records.filter(r => r.type === 'prescription').length;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      
      {/* HEADER */}
      <header className="relative overflow-hidden bg-gradient-to-br from-teal-800 to-teal-600 pb-28 pt-10 px-6 shadow-2xl rounded-b-[40px]">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute top-10 -left-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-teal-100 text-xs font-bold uppercase tracking-widest">Patient Portal</p>
            </div>
            <h1 className="text-3xl font-extrabold text-white capitalize">
              Hello, {user?.full_name?.split(' ')[0] || "Patient"}
            </h1>
            <p className="text-sm text-teal-100/80">Your smile journey continues today.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={handleLogout} className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-white border border-white/20 shadow-lg group">
               <LogOut className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
             </button>
             <Link href="/patient/profile">
               <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md border-2 border-white/30 cursor-pointer hover:bg-white/30 transition-all shadow-xl">
                  <User className="h-6 w-6 text-white" />
               </div>
             </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 -mt-20 relative z-20 space-y-8">
        
        {/* --- HERO SECTION --- */}
        <div className="grid md:grid-cols-3 gap-6">
            
            {/* Next Appointment */}
            <div className="md:col-span-2">
                {nextAppointment ? (
                    <Card className="border-none shadow-xl bg-white overflow-hidden relative h-full">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full z-0"></div>
                        <CardContent className="p-8 relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 border-0 mb-2">
                                        UPCOMING VISIT
                                    </Badge>
                                    <h2 className="text-2xl font-bold text-slate-900">{nextAppointment.treatment}</h2>
                                    <p className="text-slate-500 flex items-center gap-2 mt-1">
                                        <User className="h-4 w-4" /> Dr. {nextAppointment.doctor}
                                    </p>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <div className="text-3xl font-mono font-bold text-teal-600">
                                        {countdown.h}:{countdown.m}<span className="text-sm text-slate-400">h</span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Time Remaining</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4 items-center pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl">
                                    <Calendar className="h-5 w-5 text-teal-600" />
                                    <span className="text-sm font-bold text-slate-700">{nextAppointment.date}</span>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl">
                                    <Clock className="h-5 w-5 text-teal-600" />
                                    <span className="text-sm font-bold text-slate-700">{nextAppointment.time}</span>
                                </div>
                                <Button onClick={() => handleCancel(nextAppointment.id)} variant="ghost" className="ml-auto text-red-500 hover:text-red-600 hover:bg-red-50">Cancel</Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-none shadow-lg bg-white h-full flex flex-col items-center justify-center p-8 text-center">
                        <div className="h-14 w-14 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="h-7 w-7 text-teal-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No Upcoming Visits</h3>
                        <p className="text-slate-500 text-sm mb-4">Your schedule is clear.</p>
                        <Link href="/patient/appointments/new">
                            <Button className="bg-teal-600 hover:bg-teal-700 rounded-full">Book Appointment</Button>
                        </Link>
                    </Card>
                )}
            </div>

            {/* 🟢 DYNAMIC CASE TRACKER */}
            <div className="md:col-span-1">
                <Card className="h-full border-none shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
                    <CardContent className="p-6 h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="h-5 w-5 text-teal-400" />
                            <h3 className="font-bold text-lg">Case Track</h3>
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-center space-y-6 relative">
                            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-700 z-0"></div>

                            {/* Stage 1: Consultation */}
                            <div className="relative z-10 flex gap-4">
                                <div className={`h-6 w-6 rounded-full border-4 border-slate-800 shrink-0 ${caseStage >= 1 ? 'bg-teal-500' : 'bg-slate-700'}`}></div>
                                <div>
                                    <p className={`text-sm font-bold ${caseStage >= 1 ? 'text-teal-400' : 'text-slate-500'}`}>Consultation</p>
                                    <p className="text-xs text-slate-400">{caseStage > 1 ? "Completed" : "Current Step"}</p>
                                </div>
                            </div>
                            
                            {/* Stage 2: Treatment */}
                            <div className="relative z-10 flex gap-4">
                                <div className={`h-6 w-6 rounded-full border-4 border-slate-800 shrink-0 ${caseStage >= 2 ? 'bg-teal-500' : caseStage === 2 ? 'bg-white animate-pulse' : 'bg-slate-700'}`}></div>
                                <div>
                                    <p className={`text-sm font-bold ${caseStage >= 2 ? 'text-white' : 'text-slate-500'}`}>Treatment</p>
                                    <p className="text-xs text-slate-400">{caseStage === 2 ? "In Progress" : "Pending"}</p>
                                </div>
                            </div>
                            
                            {/* Stage 3: Recovery */}
                            <div className="relative z-10 flex gap-4">
                                <div className={`h-6 w-6 rounded-full border-4 border-slate-800 shrink-0 ${caseStage >= 3 ? 'bg-teal-500' : 'bg-slate-700'}`}></div>
                                <div>
                                    <p className={`text-sm font-bold ${caseStage >= 3 ? 'text-white' : 'text-slate-500'}`}>Recovery</p>
                                    <p className="text-xs text-slate-500">Pending</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-700">
                             <div className="text-xs text-slate-400 flex justify-between">
                                <span>Overall Progress</span>
                                <span>{progressPercent}%</span>
                             </div>
                             <div className="h-1.5 w-full bg-slate-700 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-teal-500 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                             </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* --- 3. MEDICAL INSIGHTS (REAL DATA) --- */}
        <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" /> Medical Insights
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
                
                {/* 🟢 LATEST X-RAY CARD */}
                <Link href="/patient/records?tab=xrays">
                  <Card className="group border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden h-full">
                      <CardContent className="p-0 flex h-full">
                          <div className="w-1/3 bg-slate-900 flex items-center justify-center relative">
                              <Bone className="h-8 w-8 text-slate-600" />
                              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10"></div>
                          </div>
                          <div className="w-2/3 p-5 flex flex-col justify-between">
                              <div>
                                  <h4 className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">Latest X-Ray</h4>
                                  {latestXray ? (
                                    <p className="text-xs text-slate-500 mt-1">Uploaded {latestXray.date}</p>
                                  ) : (
                                    <p className="text-xs text-slate-400 mt-1">No recent scans found.</p>
                                  )}
                              </div>
                              <div className="flex items-center text-xs font-bold text-teal-600 mt-3">
                                  View Scan <Scan className="h-3 w-3 ml-1" />
                              </div>
                          </div>
                      </CardContent>
                  </Card>
                </Link>

                {/* 🟢 PRESCRIPTIONS CARD */}
                <Link href="/patient/records?tab=prescriptions">
                  <Card className="group border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden h-full">
                      <CardContent className="p-0 flex h-full">
                          <div className="w-1/3 bg-teal-50 flex items-center justify-center">
                              <Stethoscope className="h-8 w-8 text-teal-600" />
                          </div>
                          <div className="w-2/3 p-5 flex flex-col justify-between">
                              <div>
                                  <h4 className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">Prescriptions</h4>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {prescriptionCount > 0 ? `${prescriptionCount} Active Files` : "No active prescriptions"}
                                  </p>
                              </div>
                              <div className="flex items-center text-xs font-bold text-teal-600 mt-3">
                                  View List <ChevronRight className="h-3 w-3 ml-1" />
                              </div>
                          </div>
                      </CardContent>
                  </Card>
                </Link>
            </div>
        </div>

        {/* --- 4. QUICK ACTIONS --- */}
        <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" /> Quick Actions
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                <Link href="/patient/appointments/new">
                    <div className="group h-40 rounded-3xl bg-gradient-to-br from-teal-500 to-teal-600 p-6 text-white shadow-xl shadow-teal-500/20 hover:shadow-teal-500/40 hover:-translate-y-1 transition-all flex flex-col justify-between relative overflow-hidden">
                        <Calendar className="h-8 w-8 text-white relative z-10" />
                        <div>
                            <p className="font-bold text-lg">Book New</p>
                            <p className="text-teal-100 text-xs">Find a doctor</p>
                        </div>
                    </div>
                </Link>

                <Link href="/patient/appointments">
                    <div className="group h-40 rounded-3xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between">
                        <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                             <Clock className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                            <p className="font-bold text-lg text-slate-900">History</p>
                            <p className="text-slate-400 text-xs">Past visits</p>
                        </div>
                    </div>
                </Link>

                <Link href="/patient/emergency">
                    <div className="group h-40 rounded-3xl bg-red-50 border border-red-100 p-6 shadow-sm hover:shadow-red-500/10 hover:border-red-200 hover:-translate-y-1 transition-all flex flex-col justify-between">
                         <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                             <Phone className="h-5 w-5 animate-pulse" />
                        </div>
                        <div>
                            <p className="font-bold text-lg text-red-900">Emergency</p>
                            <p className="text-red-600/70 text-xs">Immediate help</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
      </div>
      <PatientChatWidget />
    </div>
  );
}