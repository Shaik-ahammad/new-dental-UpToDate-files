"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Stethoscope, Loader2, AlertCircle, ArrowLeft, UploadCloud, 
  Clock, Zap, CheckCircle2, Building2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthAPI } from "@/lib/api";
import HospitalSelect from "@/components/auth/HospitalSelect"; // Keeps custom select

export default function DoctorSignup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Custom Hospital Toggle State (Merged from Ver A)
  const [isCustomHospital, setIsCustomHospital] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    hospital: "", // Stores either ID (from select) or Name (from input)
    license: "",
    workMode: "continuous", // continuous | interleaved
    workDuration: "30"
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    
    if (!formData.hospital) {
      setError("Please select or enter a valid hospital.");
      setLoading(false);
      return;
    }

    try {
      await AuthAPI.register({
        full_name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        role: "doctor",
        specialization: "General Dentist",
        license_number: formData.license,
        hospital_name: isCustomHospital ? formData.hospital : undefined, // Send as name if custom
        hospital_id: !isCustomHospital ? formData.hospital : undefined,  // Send as ID if selected
        
        // AI Config
        schedule_config: {
          mode: formData.workMode,
          duration: parseInt(formData.workDuration)
        }
      });

      router.push("/auth/doctor/login?registered=true");

    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Header */}
      <div className="text-center mb-10">
        <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-sm">
          <Stethoscope className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Doctor Registration</h1>
        <p className="text-slate-500 mt-2 font-medium">Complete your profile to access the AI dashboard.</p>
      </div>

      {/* Form Card */}
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 relative overflow-hidden">
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl flex items-center gap-3 border border-red-100 animate-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-8">
          
          {/* SECTION 1: PERSONAL DETAILS */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Personal Details</h3>
            
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">First Name</label>
                <Input placeholder="Sarah" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-emerald-500 rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Last Name</label>
                <Input placeholder="Smith" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-emerald-500 rounded-xl" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Professional Email</label>
              <Input type="email" placeholder="dr.sarah@clinic.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-emerald-500 rounded-xl" required />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-emerald-500 rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm Password</label>
                <Input type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-emerald-500 rounded-xl" required />
              </div>
            </div>
          </div>

          {/* SECTION 2: CREDENTIALS */}
          <div className="space-y-4">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Professional Credentials</h3>
             
             {/* 🏥 HOSPITAL SELECTION LOGIC */}
             <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hospital / Clinic</label>
                   
                   {/* Toggle Link */}
                   <button 
                     type="button" 
                     onClick={() => {
                        setIsCustomHospital(!isCustomHospital);
                        setFormData({...formData, hospital: ""}); // Reset on toggle
                     }}
                     className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                   >
                     {isCustomHospital ? "Select from list" : "Hospital not listed?"}
                   </button>
                </div>

                {isCustomHospital ? (
                   // Manual Input Mode
                   <div className="animate-in fade-in zoom-in-95 duration-200">
                      <Input 
                        placeholder="Enter full hospital name..." 
                        value={formData.hospital} 
                        onChange={e => setFormData({...formData, hospital: e.target.value})} 
                        className="h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-emerald-500 rounded-xl"
                      />
                      <p className="mt-2 text-[10px] text-slate-400 pl-1">
                        * Facility not found? <Link href="/auth/organization/signup" className="text-emerald-600 font-bold hover:underline">Register it manually here.</Link>
                      </p>
                   </div>
                ) : (
                   // Dropdown Mode (Using Custom Component)
                   <HospitalSelect value={formData.hospital} onSelect={(val) => setFormData({...formData, hospital: val})} />
                )}
             </div>

             <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Medical License Number</label>
                <Input placeholder="DHA-892-XXXX" value={formData.license} onChange={e => setFormData({...formData, license: e.target.value})} className="h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-emerald-500 rounded-xl" required />
             </div>

             {/* Visual Upload Area */}
             <div className="pt-2">
               <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-emerald-200 transition-all cursor-pointer group bg-slate-50/30">
                  <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-sm">
                     <UploadCloud className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 group-hover:text-emerald-700">Click to upload License (e-KYC)</p>
                  <p className="text-xs text-slate-400">PDF, JPG up to 5MB</p>
               </div>
             </div>
          </div>

          {/* SECTION 3: AI PREFERENCES */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Scheduling Preferences</h3>
               <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm border border-emerald-200">
                 <Zap className="h-3 w-3 fill-emerald-700" /> New
               </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div 
                 onClick={() => setFormData({...formData, workMode: "continuous"})}
                 className={`p-4 rounded-xl border cursor-pointer transition-all relative overflow-hidden ${formData.workMode === "continuous" ? "bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
               >
                  {formData.workMode === "continuous" && <div className="absolute top-2 right-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div>}
                  <div className="font-bold text-sm text-slate-900 mb-1">Continuous</div>
                  <div className="text-[11px] text-slate-500 leading-tight">Back-to-back patients. Max efficiency.</div>
               </div>

               <div 
                 onClick={() => setFormData({...formData, workMode: "interleaved"})}
                 className={`p-4 rounded-xl border cursor-pointer transition-all relative overflow-hidden ${formData.workMode === "interleaved" ? "bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
               >
                  {formData.workMode === "interleaved" && <div className="absolute top-2 right-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div>}
                  <div className="font-bold text-sm text-slate-900 mb-1">Interleaved</div>
                  <div className="text-[11px] text-slate-500 leading-tight">Work + Scheduled Breaks mixed in.</div>
               </div>
            </div>

            <div className="space-y-1.5">
               <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Slot Duration (mins)</label>
               <div className="relative">
                  <Clock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <select 
                    value={formData.workDuration}
                    onChange={(e) => setFormData({...formData, workDuration: e.target.value})}
                    className="w-full h-12 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer hover:bg-white transition-colors"
                  >
                     <option value="15">15 Minutes</option>
                     <option value="30">30 Minutes (Standard)</option>
                     <option value="45">45 Minutes</option>
                     <option value="60">60 Minutes</option>
                  </select>
                  <div className="absolute right-3 top-4 pointer-events-none">
                     <div className="border-l border-slate-300 h-4 mx-2"></div>
                  </div>
               </div>
            </div>
          </div>

          <Button 
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 text-lg" 
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Submit for Verification"}
          </Button>
        </form>
      </div>

      <div className="mt-8 text-center pb-8">
        <Link href="/auth/doctor/login" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Already registered? Login here
        </Link>
      </div>
    </div>
  );
}