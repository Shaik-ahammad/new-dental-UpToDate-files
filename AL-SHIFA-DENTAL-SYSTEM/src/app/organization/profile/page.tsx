"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import LocationPicker from "@/components/location/LocationPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { 
  Building2, Loader2, Save, FileText, MapPin, 
  Phone, Mail, ShieldCheck, Edit2, AlertCircle 
} from "lucide-react";

interface OrgProfile {
  id: string;
  name: string;
  location: string;
  contact_email: string;
  contact_number: string;
  license_number?: string;
  is_verified: boolean;
  lat?: number;
  lng?: number;
}

export default function OrgProfilePage() {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Data State
  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });
  
  // 🟢 FIX: Explicitly type the coordinates state
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });

  // 1. Fetch Data
  const loadProfile = async () => {
    try {
      const res = await api.get("/organization/profile");
      const data = res.data;
      setProfile(data);
      setFormData({
        name: data.name,
        email: data.contact_email || "",
        phone: data.contact_number || "",
        address: data.location || ""
      });
      
      // 🟢 FIX: Handle potential undefined values safely
      if (data.lat && data.lng) {
        setCoords({ lat: data.lat, lng: data.lng });
      } else {
        // Fallback to default if no location set yet
        setCoords({ lat: 25.2048, lng: 55.2708 }); // Default: Dubai
      }
      
    } catch (e: any) {
      console.error("Failed to load profile", e);
      if (e.response && e.response.status === 404) {
         alert("Organization profile incomplete. Please contact Admin.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // 2. Save Updates
  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        api.put("/organization/profile", {
            name: formData.name,
            contact_email: formData.email,
            contact_number: formData.phone
        }),
        api.put("/organization/location", {
            lat: coords.lat,
            lng: coords.lng,
            address: formData.address
        })
      ]);
      
      setIsEditing(false);
      setProfile(prev => prev ? ({ 
          ...prev, 
          name: formData.name, 
          contact_email: formData.email, 
          contact_number: formData.phone,
          location: formData.address,
          lat: coords.lat,
          lng: coords.lng
      }) : null);
      
      alert("Facility profile updated successfully!");
    } catch (e) {
      alert("Update failed. Please check your connection.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-cyan-600" /></div>;
  if (!profile) return <div className="p-8 text-center text-red-500">Failed to load profile.</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6 animate-in fade-in duration-500 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-200">
             <Building2 className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{profile.name}</h1>
            <div className="flex items-center gap-2 mt-2">
                <Badge 
                className={`px-3 py-1 text-xs font-bold border ${
                    profile.is_verified 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
                variant="secondary"
                >
                {profile.is_verified ? <ShieldCheck className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                {profile.is_verified ? "Verified Facility" : "Verification Pending"}
                </Badge>
                <span className="text-slate-400 text-xs">ID: {profile.id.slice(0,8).toUpperCase()}</span>
            </div>
          </div>
        </div>
        
        <div>
            {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                    <Edit2 className="h-4 w-4 mr-2" /> Edit Details
                </Button>
            ) : (
                <div className="flex gap-2">
                    <Button onClick={() => setIsEditing(false)} variant="ghost" className="text-red-600 hover:bg-red-50">Cancel</Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700 text-white min-w-[140px]">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                    </Button>
                </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: IDENTITY & CONTACT */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* Identity Card */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Identity</h3>
                    <LockIcon className="h-3 w-3 text-slate-400" />
                </div>
                <CardContent className="p-5 space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Facility Name</label>
                        <Input 
                            disabled={!isEditing} 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="bg-white font-bold text-slate-900 border-slate-200 focus:ring-cyan-500" 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">License Number</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input 
                                disabled 
                                value={profile.license_number || "NOT_PROVIDED"} 
                                className="pl-9 bg-slate-50 text-slate-500 border-transparent font-mono text-xs" 
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 italic">* Contact Admin to update license.</p>
                    </div>
                </CardContent>
            </Card>

            {/* Contact Card */}
            <Card className="border-slate-200 shadow-sm">
                <div className="bg-slate-50 p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Contact Info</h3>
                </div>
                <CardContent className="p-5 space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Official Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input 
                                disabled={!isEditing} 
                                value={formData.email} 
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                className="pl-9 bg-white border-slate-200 focus:ring-cyan-500" 
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Hotline / Phone</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input 
                                disabled={!isEditing} 
                                value={formData.phone} 
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                className="pl-9 bg-white border-slate-200 focus:ring-cyan-500" 
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* RIGHT COLUMN: LOCATION MAP */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm flex flex-col h-full">
            <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                    <MapPin className="w-5 h-5 text-cyan-600" />
                    Facility Location
                </CardTitle>
                <CardDescription>
                    {isEditing ? "Drag the pin to update your entrance location." : "Public location visible to patients."}
                </CardDescription>
            </CardHeader>
            
            <div className="p-4 bg-slate-50/50 space-y-2 border-b border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Display Address</label>
                <Input 
                    disabled={!isEditing}
                    value={formData.address} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})} 
                    className="bg-white border-slate-200 focus:ring-cyan-500"
                    placeholder="e.g. Building 4, Healthcare City, Dubai"
                />
            </div>

            <CardContent className="flex-1 min-h-[400px] p-0 relative bg-slate-100">
                <div className={`absolute inset-0 ${!isEditing ? "pointer-events-none opacity-90" : ""}`}>
                   <LocationPicker 
                       initialLat={coords.lat} 
                       initialLng={coords.lng} 
                       onLocationSelect={(lat, lng) => isEditing && setCoords({ lat, lng })} 
                   />
                </div>
                {!isEditing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px]">
                        <Badge className="bg-white text-slate-700 shadow-lg pointer-events-auto">
                            <LockIcon className="h-3 w-3 mr-1" /> View Only Mode
                        </Badge>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}