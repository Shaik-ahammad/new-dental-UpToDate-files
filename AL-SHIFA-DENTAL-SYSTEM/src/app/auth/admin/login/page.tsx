"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthAPI } from "@/lib/api";

export default function AdminLogin() {
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
      const response = await AuthAPI.login(email, password);
      
      // Strict Admin Check
      if (response.data.role !== "admin") {
        setError("Access Restricted: Unauthorized Personnel.");
        return;
      }

      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("role", response.data.role);
      router.push("/admin/dashboard");

    } catch (err) {
      setError("Invalid Security Credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-10">
        <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-100 shadow-sm">
          <ShieldCheck className="h-8 w-8 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Portal</h1>
        <p className="text-slate-500 mt-2 font-medium">System Level Access Control</p>
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl flex items-center gap-3 border border-red-100">
            <AlertCircle className="h-5 w-5 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Admin ID</label>
            <Input 
              type="email" 
              placeholder="admin@alshifa.system"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-xl"
              required 
            />
          </div>
          
          <div className="space-y-1.5">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Secure Key</label>
             <Input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-xl"
              required 
            />
          </div>

          <Button 
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95" 
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Authenticate Access"}
          </Button>
        </form>
      </div>

      <div className="mt-8 text-center">
        <Link href="/auth/role-selection" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Return to Gateway
        </Link>
      </div>
    </div>
  );
}