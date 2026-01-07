"use client";

import Link from "next/link";
import { ArrowLeft, Phone, MapPin, Ambulance, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function EmergencyPage() {
  
  const handleCall = () => {
    window.location.href = "tel:911"; // Or Clinic Number
  };

  return (
    <div className="min-h-screen bg-red-50 flex flex-col items-center relative font-sans">
      
      {/* Top Bar */}
      <div className="w-full p-6 flex items-center">
        <Link href="/patient/dashboard">
           <Button variant="ghost" className="rounded-full hover:bg-red-100 text-red-900">
             <ArrowLeft className="h-6 w-6" />
           </Button>
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full px-6 -mt-20">
         
         <div className="mb-8 relative">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
            <div className="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-xl relative z-10 border-4 border-white">
               <AlertOctagon className="h-12 w-12" />
            </div>
         </div>

         <h1 className="text-3xl font-black text-red-900 mb-2">Emergency Help</h1>
         <p className="text-red-700/80 text-center mb-10">
           If you are experiencing severe pain, bleeding, or trauma, please contact us immediately.
         </p>

         <div className="w-full space-y-4">
            {/* CALL BUTTON */}
            <Button 
               onClick={handleCall}
               className="w-full h-16 text-xl bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
               <Phone className="h-6 w-6 animate-pulse" /> Call Hotline
            </Button>

            {/* AMBULANCE */}
            <Button 
               variant="outline"
               className="w-full h-14 bg-white border-red-200 text-red-800 hover:bg-red-50 rounded-2xl flex items-center justify-center gap-3"
            >
               <Ambulance className="h-5 w-5" /> Request Ambulance
            </Button>
         </div>

         <Card className="mt-8 p-6 bg-white border-red-100 w-full shadow-sm">
            <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
               <MapPin className="h-4 w-4 text-red-500" /> Clinic Location
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
               Al-Shifa Dental Center <br/>
               Building 4, Healthcare City <br/>
               Dubai, UAE
            </p>
            <div className="mt-4 h-32 bg-slate-100 rounded-xl overflow-hidden relative">
               {/* Mock Map View */}
               <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 bg-[url('https://assets.website-files.com/5a8e04094e029f0001007a34/5b21609800d0e6556517a618_maps.jpg')] bg-cover opacity-50">
               </div>
               <Button size="sm" className="absolute bottom-2 right-2 bg-white text-slate-900 hover:bg-slate-50 shadow-sm text-xs h-8">
                  Get Directions
               </Button>
            </div>
         </Card>

      </div>
    </div>
  );
}