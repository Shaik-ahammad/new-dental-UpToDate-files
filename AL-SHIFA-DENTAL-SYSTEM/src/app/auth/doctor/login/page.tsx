"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Stethoscope, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthAPI } from "@/lib/api";

export default function DoctorLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Call standard AuthAPI (from Ver A)
      const response = await AuthAPI.login(email, password);
      
      // Strict Role Check
      if (response.data.role !== "doctor") {
        setError("Access Denied: This portal is for Doctors only.");
        return;
      }

      // Session Storage
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("role", response.data.role);
      
      router.push("/doctor/dashboard");

    } catch (err: any) {
      console.error(err);
      setError("Invalid credentials or server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header Branding */}
      <div className="text-center mb-10">
        <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-sm">
          <Stethoscope className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Doctor Portal</h1>
        <p className="text-slate-500 mt-2 font-medium">Clinical Access Point</p>
      </div>

      {/* Login Card (Royal Glassmorphism) */}
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 relative overflow-hidden">
        
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl flex items-center gap-3 border border-red-100 animate-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Professional Email</label>
            <Input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-emerald-500 rounded-xl transition-all"
              required 
            />
          </div>
          
          <div className="space-y-1.5">
             <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                <Link href="/auth/doctor/forgot-password" className="text-xs font-bold text-emerald-600 hover:underline hover:text-emerald-700">Forgot?</Link>
             </div>
             <Input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-emerald-500 rounded-xl transition-all"
              required 
            />
          </div>

          <Button 
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 mt-2" 
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Secure Login"}
          </Button>
        </form>
      </div>

      {/* Footer Links */}
      <div className="mt-8 text-center">
        <div className="text-sm text-slate-500 mb-4">
          Not verified? <Link href="/auth/doctor/signup" className="text-emerald-600 font-bold hover:underline">Apply for Licensing</Link>
        </div>
        <Link href="/auth/role-selection" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Return to Gateway
        </Link>
      </div>
    </div>
  );
}