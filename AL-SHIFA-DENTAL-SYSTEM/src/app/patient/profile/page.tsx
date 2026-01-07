"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, User, Mail, Phone, MapPin, 
  Save, Loader2, Edit2, ShieldCheck, HeartPulse, 
  Calendar, FileText, AlertTriangle, PhoneCall 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

export default function PatientProfile() {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    blood_type: "O+", 
    allergies: "None",
    
    // Insurance Fields
    insurance_provider: "",
    insurance_policy_no: "",
    insurance_expiry: "",
    // 🟢 NEW: Status Field (Default: Pending if data exists, else Unlinked)
    insurance_status: "unlinked" as "unlinked" | "pending" | "approved" | "rejected"
  });

  // 1. Fetch Profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data);
        
        // Mocking Status Logic based on data existence (Real app would fetch this from DB)
        // If provider exists but not verified -> Pending
        let status = "unlinked";
        if (res.data.insurance_provider) {
             // Simulate backend status (For Demo purposes: Randomly assign or default to Pending)
             // In real app: status = res.data.insurance_status
             status = "pending"; 
        }

        setFormData({
            full_name: res.data.full_name || "",
            email: res.data.email || "",
            phone: res.data.phone || "",
            address: res.data.address || "",
            blood_type: res.data.blood_type || "O+",
            allergies: res.data.allergies || "None",
            insurance_provider: res.data.insurance_provider || "",
            insurance_policy_no: res.data.insurance_policy_no || "",
            insurance_expiry: res.data.insurance_expiry || "",
            insurance_status: status as any
        });
      } catch (e) {
        console.error("Failed to load profile", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // 2. Save Changes (Trigger Verification Workflow)
  const handleSave = async () => {
    setLoading(true);
    try {
      // Logic: If insurance details changed, reset status to "Pending" for re-verification
      const newStatus = (formData.insurance_provider && formData.insurance_policy_no) ? "pending" : "unlinked";
      
      const payload = { ...formData, insurance_status: newStatus };
      
      // await api.put("/auth/me", payload);
      
      setTimeout(() => {
        setIsEditing(false);
        setLoading(false);
        setFormData(prev => ({ ...prev, insurance_status: newStatus as any }));
        setUser({ ...user, ...formData }); 
      }, 800);
    } catch (e) {
        setLoading(false);
    }
  };

  // Helper to render Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
        case "approved":
            return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">Verified</Badge>;
        case "rejected":
            return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">Rejected</Badge>;
        case "pending":
            return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 flex gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Verifying</Badge>;
        default:
            return null;
    }
  };

  if (loading && !user) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-teal-600 h-8 w-8" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10">
      
      {/* HEADER */}
      <div className="bg-teal-700 h-64 w-full relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        
        {/* 🟢 CHANGE HERE: Added 'relative z-10' to bring this layer to the front */}
        <div className="max-w-4xl mx-auto px-6 pt-8 relative z-10">
            <Link href="/patient/dashboard">
               <Button variant="ghost" className="text-teal-100 hover:text-white hover:bg-white/10 transition-colors group">
                  <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
               </Button>
            </Link>
        </div>
      </div>

      {/* CARD CONTENT */}
      <div className="max-w-4xl mx-auto px-6 -mt-32 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            
            {/* AVATAR & HEADER (Same as before) */}
            <div className="flex flex-col md:flex-row gap-6 p-8 border-b border-slate-100 items-center md:items-end">
                <div className="h-32 w-32 rounded-full bg-white p-1 shadow-lg -mt-16 md:-mt-0">
                    <div className="h-full w-full rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-4xl font-bold uppercase">
                        {user?.full_name?.charAt(0) || "U"}
                    </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-2xl font-bold text-slate-900">{formData.full_name}</h1>
                    <p className="text-slate-500">{formData.email}</p>
                    <div className="flex gap-2 justify-center md:justify-start mt-2">
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 px-3 py-1">Verified Patient</Badge>
                    </div>
                </div>
                <div>
                    {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)} variant="outline" className="border-slate-200 hover:bg-slate-50 hover:text-teal-700">
                            <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button onClick={() => setIsEditing(false)} variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600">Cancel</Button>
                            <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20">
                                {loading ? <Loader2 className="animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Submit Changes</>}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* FORM FIELDS */}
            <div className="p-8 grid md:grid-cols-2 gap-10">
                
                {/* LEFT COL: Personal Info (Same as before) */}
                <div className="space-y-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                        <User className="h-4 w-4" /> Personal Info
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase">Full Name</label>
                            <Input disabled={!isEditing} value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="bg-slate-50 border-slate-200 focus:ring-teal-500 h-10" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase">Phone Number</label>
                            <Input disabled={!isEditing} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-slate-50 border-slate-200 focus:ring-teal-500 h-10" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase">Address</label>
                            <Input disabled={!isEditing} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="bg-slate-50 border-slate-200 focus:ring-teal-500 h-10" />
                        </div>
                    </div>
                </div>

                {/* RIGHT COL: Insurance & Medical */}
                <div className="space-y-8">
                    
                    {/* Medical Data */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                            <HeartPulse className="h-4 w-4" /> Medical Data
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center">
                                <p className="text-[10px] text-red-600 font-bold uppercase mb-1">Blood Type</p>
                                <p className="text-2xl font-black text-red-900">{formData.blood_type}</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                                <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">Allergies</p>
                                <p className="text-lg font-bold text-blue-900 truncate">{formData.allergies}</p>
                            </div>
                        </div>
                    </div>

                    {/* 🟢 2. INSURANCE WORKFLOW */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                               <ShieldCheck className="h-4 w-4" /> Insurance Status
                           </h3>
                           {/* Status Badge */}
                           {renderStatusBadge(formData.insurance_status)}
                        </div>

                        {!isEditing ? (
                            // VIEW MODE
                            <div className={`p-6 rounded-2xl border ${formData.insurance_status === 'rejected' ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"}`}>
                                {formData.insurance_provider ? (
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-start mb-2">
                                           <div>
                                             <p className="text-xs text-slate-500 uppercase font-bold">Provider</p>
                                             <p className="text-base font-bold text-slate-900">{formData.insurance_provider}</p>
                                           </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold">Policy Number</p>
                                            <p className="text-sm font-medium text-slate-700">{formData.insurance_policy_no}</p>
                                        </div>
                                        
                                        {/* 🟢 Status Specific Messages */}
                                        {formData.insurance_status === 'pending' && (
                                            <div className="mt-3 bg-amber-50 p-3 rounded-xl border border-amber-100 flex gap-2 items-start">
                                                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                                <p className="text-xs text-amber-800 leading-tight">Your details have been sent to the hospital for verification. This usually takes 24-48 hours.</p>
                                            </div>
                                        )}
                                        
                                        {formData.insurance_status === 'rejected' && (
                                            <div className="mt-3 bg-white p-3 rounded-xl border border-red-100">
                                                <div className="flex items-center gap-2 mb-1 text-red-700 font-bold text-xs">
                                                    <AlertTriangle className="h-4 w-4" /> Verification Failed
                                                </div>
                                                <p className="text-xs text-red-600 leading-tight mb-2">Policy details could not be verified.</p>
                                                <Button size="sm" variant="outline" className="w-full h-8 text-xs border-red-200 text-red-700 hover:bg-red-50">
                                                    <PhoneCall className="h-3 w-3 mr-2" /> Contact Support
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-sm font-medium text-slate-500">No insurance linked.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // EDIT MODE
                            <div className="bg-slate-50 p-5 rounded-2xl border border-teal-200 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Provider Name</label>
                                    <Input placeholder="e.g. Daman Health" value={formData.insurance_provider} onChange={(e) => setFormData({...formData, insurance_provider: e.target.value})} className="bg-white border-slate-200 h-9 text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Policy Number</label>
                                    <Input placeholder="Policy #123456" value={formData.insurance_policy_no} onChange={(e) => setFormData({...formData, insurance_policy_no: e.target.value})} className="bg-white border-slate-200 h-9 text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Expiry Date</label>
                                    <Input type="date" value={formData.insurance_expiry} onChange={(e) => setFormData({...formData, insurance_expiry: e.target.value})} className="bg-white border-slate-200 h-9 text-sm text-slate-600" />
                                </div>
                                <p className="text-[10px] text-slate-400 italic mt-2">* Updates will trigger re-verification.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}