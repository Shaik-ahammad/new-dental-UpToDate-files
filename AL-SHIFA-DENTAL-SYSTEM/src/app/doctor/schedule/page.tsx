"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { 
  Clock, RefreshCcw, Loader2, Plus, Bell, Settings, Save, 
  AlertCircle, ChevronLeft, ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format, addDays, differenceInMinutes, setHours } from "date-fns";

export default function DoctorSchedulePage() {
  // --- STATE ---
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [newBookingAlert, setNewBookingAlert] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Settings State
  const [config, setConfig] = useState({
    work_start_time: "09:00",
    work_end_time: "17:00",
    slot_duration: 30,
    break_duration: 5
  });
  const [savingSettings, setSavingSettings] = useState(false);
  
  const prevCountRef = useRef(0);

  // --- HELPERS ---
  const formatDateForAPI = (d: Date) => d.toISOString().split('T')[0];

  // --- LIVE CLOCK & POLLING ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // --- FETCH DATA ---
  const fetchSchedule = async (silent = false) => {
    if (!silent) setLoading(true);
    
    try {
      const dateStr = formatDateForAPI(selectedDate);
      
      const [resAppt, resSettings] = await Promise.all([
         api.get(`/doctor/appointments?date=${dateStr}&view=day`), 
         api.get("/doctor/schedule/settings")
      ]);

      const newAppts = resAppt.data.appointments || [];
      
      if (silent && newAppts.length > prevCountRef.current) {
         setNewBookingAlert(true);
         setTimeout(() => setNewBookingAlert(false), 5000);
      }
      
      setAppointments(newAppts);
      setConfig(resSettings.data);
      prevCountRef.current = newAppts.length;

    } catch (e) {
      console.error("Schedule fetch error:", e);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [selectedDate]);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => fetchSchedule(true), 10000); 
    return () => clearInterval(interval);
  }, [isLive, selectedDate]);

  // --- HANDLERS ---
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put("/doctor/schedule/settings", config);
      alert("Availability updated!");
    } catch (e) {
      alert("Failed to update settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePrev = () => setSelectedDate(prev => addDays(prev, -1));
  const handleNext = () => setSelectedDate(prev => addDays(prev, 1));
  
  // 🟢 NATIVE DATE PICKER HANDLER
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.valueAsDate) {
        setSelectedDate(e.target.valueAsDate);
    }
  };

  // --- GRID CALCULATIONS ---
  const START_HOUR = parseInt(config.work_start_time?.split(':')[0] || "8");
  const END_HOUR = parseInt(config.work_end_time?.split(':')[0] || "18");
  const HOUR_HEIGHT = 100; 
  
  const getTopPosition = (dateStr: string) => {
    const date = new Date(dateStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const minutesFromStart = (hours - START_HOUR) * 60 + minutes;
    return (minutesFromStart / 60) * HOUR_HEIGHT;
  };

  const getHeight = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const durationMins = differenceInMinutes(end, start);
    return Math.max((durationMins / 60) * HOUR_HEIGHT, 40);
  };

  const renderTimeLabels = () => {
    const labels = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      const timeLabel = format(setHours(new Date(), h), "h aa");
      labels.push(
        <div key={h} className="relative w-full text-right pr-4 pt-1" style={{ height: `${HOUR_HEIGHT}px` }}>
          <span className="text-xs font-bold text-slate-400">{timeLabel}</span>
        </div>
      );
    }
    return labels;
  };

  const renderGridLines = () => {
    const lines = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      lines.push(
        <div key={h} className="border-t border-slate-100 w-full" style={{ height: `${HOUR_HEIGHT}px` }}>
           <div className="border-t border-slate-50 border-dashed w-full relative top-1/2"></div>
        </div>
      );
    }
    return lines;
  };

  const renderCurrentTimeLine = () => {
    const now = currentTime;
    const currentHour = now.getHours();
    if (currentHour < START_HOUR || currentHour > END_HOUR) return null;
    
    const top = getTopPosition(now.toISOString());
    return (
      <div className="absolute left-0 right-0 z-30 flex items-center pointer-events-none" style={{ top: `${top}px` }}>
        <div className="w-2 h-2 bg-red-500 rounded-full -ml-1"></div>
        <div className="w-full border-t-2 border-red-500 shadow-sm opacity-50"></div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans relative pb-20">
      
      {newBookingAlert && (
        <div className="fixed top-24 right-8 z-50 bg-slate-900/95 backdrop-blur text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right border border-slate-700">
            <div className="h-10 w-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
               <Bell className="h-5 w-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
               <h4 className="font-bold text-sm">New Appointment!</h4>
               <p className="text-xs text-slate-300">Your schedule has just been updated.</p>
            </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
             Schedule Manager <span className="text-emerald-600 text-3xl">.</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
             Manage your clinical timeline.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100 shadow-sm">
                <div className={`h-2 w-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  {isLive ? "Live Sync Active" : "Offline"}
                </span>
            </div>

            <Button size="icon" variant="outline" className="rounded-full h-10 w-10 border-slate-200 hover:bg-slate-50" onClick={() => fetchSchedule()}>
               <RefreshCcw className={`h-4 w-4 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 rounded-full px-6">
               <Plus className="h-4 w-4 mr-2" /> New Appointment
            </Button>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="bg-slate-100/50 p-1 rounded-xl h-14 mb-6 inline-flex w-full md:w-auto">
          <TabsTrigger value="calendar" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm px-8 font-bold h-10 transition-all">
             Calendar View
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm px-8 font-bold h-10 transition-all">
             Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
           
           {/* 🟢 NATIVE DATE CONTROLS */}
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                 <Button variant="ghost" size="icon" onClick={handlePrev} className="h-9 w-9 rounded-lg hover:bg-slate-100">
                   <ChevronLeft className="h-4 w-4 text-slate-600" />
                 </Button>
                 
                 {/* This is the Normal Browser Calendar */}
                 <div className="relative">
                    <Input 
                        type="date" 
                        value={formatDateForAPI(selectedDate)} 
                        onChange={handleDateChange}
                        className="border-0 focus:ring-0 font-black text-lg text-slate-900 w-[180px] h-9 cursor-pointer"
                    />
                 </div>

                 <Button variant="ghost" size="icon" onClick={handleNext} className="h-9 w-9 rounded-lg hover:bg-slate-100">
                   <ChevronRight className="h-4 w-4 text-slate-600" />
                 </Button>
              </div>
              
              <Button variant="ghost" size="sm" className="text-emerald-600 font-bold hover:bg-emerald-50" onClick={() => setSelectedDate(new Date())}>
                 Jump to Today
              </Button>
           </div>

           {/* PRO GRID (unchanged) */}
           <Card className="border-slate-200 shadow-sm overflow-hidden bg-white min-h-[600px] relative">
             {loading ? (
               <div className="flex flex-col items-center justify-center h-[500px] text-slate-400">
                 <Loader2 className="h-10 w-10 animate-spin mb-4 text-emerald-600" />
                 <p className="text-sm font-medium tracking-wide uppercase">Syncing Schedule...</p>
               </div>
             ) : (
               <div className="flex w-full overflow-y-auto max-h-[800px] custom-scrollbar">
                  
                  <div className="w-20 flex-shrink-0 bg-slate-50/50 border-r border-slate-100 pt-4 sticky left-0 z-20">
                     {renderTimeLabels()}
                  </div>

                  <div className="flex-1 relative bg-white" style={{ height: `${(END_HOUR - START_HOUR + 1) * HOUR_HEIGHT}px` }}>
                     <div className="absolute inset-0 z-0 pointer-events-none">
                        {renderGridLines()}
                     </div>
                     {formatDateForAPI(selectedDate) === formatDateForAPI(currentTime) && renderCurrentTimeLine()}
                     <div className="absolute inset-0 z-10 w-full px-4">
                        {appointments.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                <p className="text-sm font-medium">No appointments</p>
                            </div>
                        )}

                        {appointments.map((appt) => {
                           const top = getTopPosition(appt.start);
                           const height = getHeight(appt.start, appt.end);
                           return (
                              <div
                                 key={appt.id}
                                 className={cn(
                                    "absolute left-4 right-4 rounded-xl border-l-4 p-3 shadow-sm transition-all hover:shadow-lg cursor-pointer group overflow-hidden animate-in zoom-in-95 duration-300",
                                    appt.status === 'confirmed' 
                                       ? "bg-emerald-50/90 border-emerald-500 hover:bg-emerald-100" 
                                       : "bg-slate-50/90 border-slate-300 hover:bg-slate-100"
                                 )}
                                 style={{ top: `${top}px`, height: `${height}px` }}
                              >
                                 <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                       <div className={cn("h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs", 
                                          appt.status === 'confirmed' ? "bg-emerald-200 text-emerald-800" : "bg-slate-200 text-slate-700")}>
                                          {appt.patient_name.charAt(0)}
                                       </div>
                                       <div>
                                          <h4 className={cn(
                                             "text-sm font-bold leading-tight",
                                             appt.status === 'confirmed' ? "text-emerald-900" : "text-slate-700"
                                          )}>
                                             {appt.patient_name}
                                          </h4>
                                          <div className="text-[10px] font-mono text-slate-500 mt-1">
                                             {format(new Date(appt.start), "h:mm")} - {format(new Date(appt.end), "h:mm a")}
                                          </div>
                                       </div>
                                    </div>
                                    <Badge variant="secondary" className="bg-white/50 text-[10px] backdrop-blur-sm shadow-sm">
                                       {appt.status}
                                    </Badge>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               </div>
             )}
           </Card>
        </TabsContent>

        {/* SETTINGS TAB (unchanged) */}
        <TabsContent value="settings">
           <Card className="border-slate-200 shadow-sm max-w-2xl bg-white mx-auto mt-8">
              <CardHeader className="bg-emerald-50/30 border-b border-emerald-100 pb-4">
                 <CardTitle className="flex items-center gap-2 text-emerald-900">
                    <Clock className="h-5 w-5 text-emerald-600" /> 
                    Configure Availability
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Time</label>
                       <Input type="time" value={config.work_start_time} onChange={(e) => setConfig({...config, work_start_time: e.target.value})} className="h-12 bg-slate-50" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Time</label>
                       <Input type="time" value={config.work_end_time} onChange={(e) => setConfig({...config, work_end_time: e.target.value})} className="h-12 bg-slate-50" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Slot Duration</label>
                       <Select value={config.slot_duration.toString()} onValueChange={(val) => setConfig({...config, slot_duration: parseInt(val)})}>
                          <SelectTrigger className="h-12 bg-slate-50"><SelectValue /></SelectTrigger>
                          <SelectContent>
                             <SelectItem value="15">15 Min</SelectItem>
                             <SelectItem value="30">30 Min</SelectItem>
                             <SelectItem value="45">45 Min</SelectItem>
                             <SelectItem value="60">60 Min</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Buffer Time</label>
                       <Select value={config.break_duration.toString()} onValueChange={(val) => setConfig({...config, break_duration: parseInt(val)})}>
                          <SelectTrigger className="h-12 bg-slate-50"><SelectValue /></SelectTrigger>
                          <SelectContent>
                             <SelectItem value="0">0 Min</SelectItem>
                             <SelectItem value="5">5 Min</SelectItem>
                             <SelectItem value="10">10 Min</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>
                 </div>
                 <div className="flex justify-end pt-2">
                    <Button onClick={handleSaveSettings} disabled={savingSettings} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[180px] h-12 shadow-xl shadow-emerald-600/20 text-sm font-bold tracking-wide">
                       {savingSettings ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                       SAVE CHANGES
                    </Button>
                 </div>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}