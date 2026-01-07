"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { 
  Calendar, User, Clock, ChevronRight, CheckCircle2, 
  MapPin, Loader2, ArrowLeft, Bot, Search, Send, AlertTriangle, Building2, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function NewAppointmentPage() {
  const router = useRouter();
  
  // --- GLOBAL STATES ---
  const [mode, setMode] = useState<"selection" | "ai" | "manual">("selection");
  
  // --- MANUAL WIZARD STATES (From Ver B) ---
  const [step, setStep] = useState(1); // 1: Doctor, 2: Slot, 3: Confirm
  const [doctors, setDoctors] = useState<any[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Selection Data
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  // --- AI CHAT STATES (From Ver A) ---
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "agent", text: string, isUrgent?: boolean }[]>([
    { role: "agent", text: "Salam! I am Dr. AI. Please describe your symptoms (e.g., 'Sharp pain in lower molar')." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // --- 1. FETCH DOCTORS (Merged Logic) ---
  useEffect(() => {
    if (mode === "manual") {
      const fetchDocs = async () => {
        try {
          // Use standard endpoint, fallback to mock if needed
          const res = await api.get("/patient/doctors").catch(() => ({ data: [] }));
          if (res.data.length > 0) {
             setDoctors(res.data);
          } else {
             // Mock Data for Demo if API fails/empty
             setDoctors([
                { id: 1, name: "Dr. Ayesha Siddiqui", specialization: "Orthodontist", hospital: "Al-Shifa Main", image: "/avatars/doc1.png" },
                { id: 2, name: "Dr. Rahul Verma", specialization: "Oral Surgeon", hospital: "City Care", image: "/avatars/doc2.png" }
             ]);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchDocs();
    }
  }, [mode]);

  // --- 2. FETCH SLOTS ---
  useEffect(() => {
    if (mode === "manual" && step === 2 && selectedDoc) {
      const fetchSlots = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/patient/slots?doctor_id=${selectedDoc.id}&date_str=${selectedDate}`);
          setSlots(res.data);
        } catch (e) {
          // Fallback slots for demo
          setSlots(["10:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"]);
        } finally {
          setLoading(false);
        }
      };
      fetchSlots();
    }
  }, [step, selectedDoc, selectedDate, mode]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // --- ACTIONS ---

  // Manual Booking Submit
  const handleBooking = async () => {
    setLoading(true);
    try {
      const isoDateTime = `${selectedDate}T${selectedTime}:00`; // Approximate ISO
      
      await api.post("/patient/book", {
        doctor_id: selectedDoc.id,
        slot_time: isoDateTime,
        reason: reason || "General Checkup"
      });
      
      // Save for Dashboard Demo
      localStorage.setItem("latestAppointment", JSON.stringify({
        treatment: reason || "General Checkup",
        doctor: selectedDoc.name,
        date: selectedDate,
        time: selectedTime,
        status: "confirmed"
      }));
      
      router.push("/patient/dashboard");
    } catch (e) {
      alert("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // AI Chat Submit
  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setChatLoading(true);

    try {
      const response = await api.post("/agent/appointment", {
        user_query: userMsg,
        session_id: "PATIENT_SESSION" 
      });

      const agentData = response.data;
      const isUrgent = agentData.action_taken === "triaged";

      setChatMessages(prev => [...prev, { 
        role: "agent", 
        text: agentData.response_text,
        isUrgent: isUrgent
      }]);

    } catch (error) {
      // Mock Response for Demo
      setTimeout(() => {
          setChatMessages(prev => [...prev, { 
            role: "agent", 
            text: "Based on your description, I recommend seeing a Specialist immediately. Would you like me to find an available slot?" 
          }]);
          setChatLoading(false);
      }, 1500);
    } 
  };

  // --- RENDER VIEWS ---

  // VIEW 1: MODE SELECTION (Restored from Ver A, Styled like Ver B)
  if (mode === "selection") {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center animate-in fade-in duration-500 font-sans">
        <div className="text-center mb-10 max-w-lg">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">New Appointment</h1>
            <p className="text-slate-500 mt-3 text-lg">How would you like to schedule your visit today?</p>
        </div>
        
        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-6">
           {/* AI Option */}
           <div onClick={() => setMode("ai")} className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-2xl cursor-pointer border border-slate-200 hover:border-purple-500 transition-all text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-wider">AI POWERED</div>
             <div className="h-20 w-20 mx-auto bg-purple-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Bot className="h-10 w-10 text-purple-600" />
             </div>
             <h3 className="text-xl font-bold text-slate-900">Symptom Match</h3>
             <p className="text-sm text-slate-500 mt-3 leading-relaxed">
               Describe how you feel. Our AI Agent will triage urgency and find the perfect specialist for you.
             </p>
           </div>

           {/* Manual Option */}
           <div onClick={() => setMode("manual")} className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-2xl cursor-pointer border border-slate-200 hover:border-blue-500 transition-all text-center">
             <div className="h-20 w-20 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="h-10 w-10 text-blue-600" />
             </div>
             <h3 className="text-xl font-bold text-slate-900">Manual Booking</h3>
             <p className="text-sm text-slate-500 mt-3 leading-relaxed">
               Know who you want to see? Browse hospitals, filter by location, and pick your time slot directly.
             </p>
           </div>
        </div>
        
        <Button variant="ghost" className="mt-12 text-slate-400 hover:text-slate-600" onClick={() => router.back()}>
            Cancel
        </Button>
      </div>
    );
  }

  // VIEW 2: AI CHAT (Restored & Styled)
  if (mode === "ai") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans animate-in slide-in-from-right duration-500">
        {/* Chat Header */}
        <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 flex items-center gap-4 shadow-sm">
          <Button variant="ghost" size="icon" onClick={() => setMode("selection")}>
             <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" /> Dr. AI Assistant
            </h2>
            <p className="text-xs text-slate-500 font-medium">Al-Shifa Neural Engine • Online</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={chatScrollRef}>
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed shadow-sm ${
                msg.role === "user" 
                  ? "bg-purple-600 text-white rounded-br-none shadow-purple-200" 
                  : msg.isUrgent 
                    ? "bg-red-50 text-red-900 border border-red-200 rounded-bl-none" 
                    : "bg-white text-slate-700 border border-slate-200 rounded-bl-none"
              }`}>
                {msg.isUrgent && (
                  <div className="flex items-center gap-2 font-bold mb-2 text-red-600 uppercase text-xs tracking-wider">
                    <AlertTriangle className="h-4 w-4" /> Urgency Detected
                  </div>
                )}
                {msg.text}
              </div>
            </div>
          ))}
          {chatLoading && (
             <div className="flex justify-start">
               <div className="bg-white p-4 rounded-3xl rounded-bl-none border border-slate-200 shadow-sm flex gap-2 items-center">
                 <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                 <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
               </div>
             </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input 
              className="flex-1 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-purple-500 transition-all text-slate-800 placeholder:text-slate-400"
              placeholder="Describe your symptoms..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
            />
            <Button onClick={handleChatSend} className="h-auto w-14 rounded-2xl bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200" disabled={chatLoading}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // VIEW 3: MANUAL WIZARD (Version B Logic)
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans animate-in slide-in-from-right duration-500">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => step > 1 ? setStep(step-1) : setMode("selection")}>
             <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Book Appointment</h1>
            <p className="text-slate-500 text-sm">Step {step} of 3</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out" 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* --- STEP 1: SELECT DOCTOR --- */}
        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            {doctors.map((doc) => (
              <Card 
                key={doc.id} 
                onClick={() => { setSelectedDoc(doc); setStep(2); }}
                className="cursor-pointer hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all group border-slate-200 overflow-hidden"
              >
                <div className="p-5 flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center text-xl font-bold text-blue-600 border border-blue-100">
                     {doc.name ? doc.name.charAt(0) : "D"}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors text-lg">{doc.name}</h3>
                    <p className="text-sm text-slate-500 font-medium">{doc.specialization}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                        <MapPin className="h-3 w-3" /> {doc.hospital}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 ml-auto group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* --- STEP 2: SELECT SLOT --- */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                    {selectedDoc?.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Booking with</p>
                    <p className="font-bold text-slate-900 text-lg">{selectedDoc?.name}</p>
                  </div>
               </div>
               <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">Change</Button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-3 block">Select Date</label>
                  <Input 
                    type="date" 
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full h-12 text-lg px-4"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 mb-3 block">Available Slots</label>
                  {loading ? (
                    <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                        <Loader2 className="animate-spin h-5 w-5" /> Checking doctor's schedule...
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 text-slate-500">
                        No slots available. Please select another date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                       {slots.map((time) => (
                         <button
                           key={time}
                           onClick={() => setSelectedTime(time)}
                           className={`px-4 py-3 rounded-xl text-sm font-bold transition-all border
                             ${selectedTime === time 
                               ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200 scale-105" 
                               : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"}
                           `}
                         >
                           {time}
                         </button>
                       ))}
                    </div>
                  )}
                </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={() => setStep(3)} 
                disabled={!selectedTime}
                size="lg"
                className="bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-200 rounded-full px-8 h-12 text-base"
              >
                Continue <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* --- STEP 3: CONFIRMATION --- */}
        {step === 3 && (
          <div className="space-y-6">
            <Card className="border-blue-100 bg-blue-50/50 overflow-hidden">
               <div className="p-8 text-center bg-gradient-to-b from-white to-blue-50/50">
                  <div className="h-20 w-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                     <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Confirm Booking</h2>
                  <p className="text-slate-500 mt-2">Please review your appointment details.</p>
               </div>
               
               <div className="border-t border-blue-100 p-6 space-y-4 text-sm bg-white/50">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                     <span className="text-slate-500 font-medium">Doctor</span>
                     <span className="font-bold text-slate-900 text-base">{selectedDoc?.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                     <span className="text-slate-500 font-medium">Date & Time</span>
                     <span className="font-bold text-slate-900 text-base">{selectedDate} at {selectedTime}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                     <span className="text-slate-500 font-medium">Location</span>
                     <span className="font-bold text-slate-900 text-base">{selectedDoc?.hospital || "Main Center"}</span>
                  </div>
               </div>
            </Card>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <label className="text-sm font-bold text-slate-700 mb-3 block">Reason for Visit (Optional)</label>
               <Input 
                 placeholder="e.g., Toothache, Routine Checkup..." 
                 value={reason}
                 onChange={(e) => setReason(e.target.value)}
                 className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
               />
            </div>

            <Button 
              className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/20 rounded-2xl"
              onClick={handleBooking}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : "Confirm Appointment"}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}