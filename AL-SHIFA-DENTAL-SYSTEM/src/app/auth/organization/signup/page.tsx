"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Loader2, AlertCircle, MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthAPI } from "@/lib/api";
import dynamic from 'next/dynamic';

// Dynamic Import for Mapbox
const LocationPicker = dynamic(() => import("@/components/location/LocationPicker"), { 
  ssr: false, 
  loading: () => <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs">LOADING MAP...</div>
});

export default function OrganizationSignup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    license: "",
    address: "",
    coordinates: { lat: 0, lng: 0 }
  });

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, 
      coordinates: { lat, lng }
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await AuthAPI.register({
        full_name: formData.name,
        email: formData.email,
        password: formData.password,
        role: "organization",
        specialization: "Hospital Facility", 
        license_number: formData.license
      });
      router.push("/auth/organization/login?registered=true");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // 🟢 CLEAN CONTAINER (Layout handled by AuthLayout wrapper)
    <div className="w-full max-w-xl mx-auto py-8">
      
      {/* ✅ RESTORED HEADER (Icon + Text) */}
      <div className="text-center mb-10">
        <div className="h-16 w-16 bg-cyan-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-cyan-100 shadow-sm">
          <Building2 className="h-8 w-8 text-cyan-600" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Register Facility</h1>
        <p className="text-slate-500 mt-2 font-medium">Join the Al-Shifa Healthcare Network</p>
      </div>

      {/* Form Card */}
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl flex items-center gap-3 border border-red-100 animate-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          
          {/* Credentials Grid */}
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Facility Name</label>
              <Input 
                placeholder="e.g. City General Hospital" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500" 
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Official Email</label>
              <Input 
                type="email" 
                placeholder="admin@hospital.com" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500" 
                required 
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
             <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
              <Input 
                type="password" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500" 
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">License No.</label>
              <Input 
                placeholder="HOSP-202X-000" 
                value={formData.license} 
                onChange={e => setFormData({...formData, license: e.target.value})} 
                className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500" 
                required 
              />
            </div>
          </div>

          {/* Map Section */}
          <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-cyan-600" />
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Location Pin</label>
              </div>
              
              <div className="h-[300px] rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner bg-slate-50 relative">
                <LocationPicker onLocationSelect={handleLocationSelect} />
              </div>

              {formData.coordinates.lat !== 0 && (
                <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center gap-2 mt-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></span>
                  Pinned: <span className="font-medium text-slate-700">{formData.coordinates.lat.toFixed(5)}, {formData.coordinates.lng.toFixed(5)}</span>
                </p>
              )}
          </div>

          <Button 
            className="w-full h-14 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/20 text-lg transition-all active:scale-95" 
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : "Complete Registration"}
          </Button>
        </form>
      </div>

      <div className="text-center mt-8">
        <Link href="/auth/organization/login" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-cyan-600 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Return to Login
        </Link>
      </div>

    </div>
  );
}