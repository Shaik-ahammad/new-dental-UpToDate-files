"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Building2, Search, Plus, Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HospitalSelectProps {
  value: string;
  onSelect: (value: string) => void;
}

// Mock Database of Verified Hospitals
const HOSPITALS = [
  "Al-Shifa Dental Center",
  "City Smile Hospital",
  "Apex Dental Care",
  "Royal Molar Clinic",
  "Dubai Health Authority - Main",
  "Sharjah Medical Center"
];

export default function HospitalSelect({ value, onSelect }: HospitalSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filter Logic
  const filtered = HOSPITALS.filter(h => 
    h.toLowerCase().includes(search.toLowerCase())
  );

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`h-12 w-full rounded-xl border flex items-center px-3 cursor-pointer transition-all ${isOpen ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200 bg-slate-50 hover:bg-white'}`}
      >
        <Building2 className="h-4 w-4 text-emerald-600 mr-2 shrink-0" />
        <span className={`flex-1 text-sm ${value ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
          {value || "Select verified hospital..."}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Search Input */}
          <div className="p-2 border-b border-slate-50">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input 
                autoFocus
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 rounded-lg outline-none focus:bg-white transition-colors placeholder:text-slate-400"
                placeholder="Search facility..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-[200px] overflow-y-auto p-1">
            {filtered.length > 0 ? (
              filtered.map((hospital) => (
                <div
                  key={hospital}
                  onClick={() => { onSelect(hospital); setIsOpen(false); setSearch(""); }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors ${value === hospital ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Building2 className="h-3.5 w-3.5 opacity-50" />
                  {hospital}
                  {value === hospital && <Check className="ml-auto h-3.5 w-3.5 text-emerald-600" />}
                </div>
              ))
            ) : (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-400 mb-2">Hospital not listed?</p>
                <Link href="/auth/organization/signup">
                  <Button size="sm" variant="outline" className="w-full h-8 text-xs border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50">
                    <Plus className="h-3 w-3 mr-1" /> Add Manually
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}