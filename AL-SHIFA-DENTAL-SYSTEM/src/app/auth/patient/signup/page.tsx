"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Loader2, AlertCircle, ArrowLeft, HeartPulse, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthAPI } from "@/lib/api";

export default function PatientSignup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    gender: "Male" // Default
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await AuthAPI.register({
        full_name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        role: "patient",
        // Patient Specific Fields
        age: parseInt(formData.age),
        gender: formData.gender
      });

      router.push("/auth/patient/login?registered=true");

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
        <div className="h-16 w-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-teal-100 shadow-sm">
          <HeartPulse className="h-8 w-8 text-teal-600" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">New Patient Registration</h1>
        <p className="text-slate-500 mt-2 font-medium">Join us for a smarter dental experience.</p>
      </div>

      {/* Form Card */}
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 relative overflow-hidden">
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl flex items-center gap-3 border border-red-100 animate-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-8">
          
          {/* SECTION 1: IDENTITY */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Basic Information</h3>
            
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">First Name</label>
                <Input placeholder="John" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-teal-500 rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Last Name</label>
                <Input placeholder="Doe" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-teal-500 rounded-xl" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
              <Input type="email" placeholder="john.doe@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-teal-500 rounded-xl" required />
            </div>
          </div>

          {/* SECTION 2: SECURITY & DETAILS */}
          <div className="space-y-4">
             <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Age</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <Input type="number" placeholder="25" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="h-12 pl-10 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-teal-500 rounded-xl" required />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Gender</label>
                    <div className="relative">
                        <Users className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <select 
                            value={formData.gender}
                            onChange={(e) => setFormData({...formData, gender: e.target.value})}
                            className="w-full h-12 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer hover:bg-white transition-colors"
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
             </div>

             <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                    <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-teal-500 rounded-xl" required />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm Password</label>
                    <Input type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-teal-500 rounded-xl" required />
                </div>
             </div>
          </div>

          <Button 
            className="w-full h-14 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 transition-all active:scale-95 text-lg" 
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Complete Registration"}
          </Button>
        </form>
      </div>

      <div className="mt-8 text-center pb-8">
        <Link href="/auth/patient/login" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-teal-600 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Already registered? Login here
        </Link>
      </div>
    </div>
  );
}