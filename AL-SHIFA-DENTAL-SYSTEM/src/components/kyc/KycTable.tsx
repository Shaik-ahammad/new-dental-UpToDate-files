"use client";

import React from "react";
// Ensure you have these UI components or replace with standard HTML/Tailwind if missing
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, FileText, MapPin } from "lucide-react";

interface KycRecord {
  id: string;
  name: string;
  email?: string;
  license_number?: string; // For Doctors
  location?: string;       // For Hospitals
  specialization?: string; // For Doctors
  joined_at?: string;
}

interface KycTableProps {
  data: KycRecord[];
  type: "doctor" | "hospital";
  onAction: (id: string, action: "approve" | "reject") => void;
}

export function KycTable({ data, type, onAction }: KycTableProps) {
  // 1. Empty State Handling
  if (data.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">All Caught Up!</h3>
        <p className="text-slate-500 mt-1">No pending {type} verifications.</p>
      </div>
    );
  }

  // 2. Data Table
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
          <tr>
            <th className="px-6 py-4">Name / Entity</th>
            <th className="px-6 py-4">Credentials</th>
            <th className="px-6 py-4">Details</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((record) => (
            <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
              {/* Column 1: Identity */}
              <td className="px-6 py-4">
                <div className="font-semibold text-slate-900">{record.name}</div>
                <div className="text-xs text-slate-500">{record.email}</div>
              </td>
              
              {/* Column 2: License Info */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                    {record.license_number || "N/A"}
                  </span>
                </div>
              </td>
              
              {/* Column 3: Context (Spec or Location) */}
              <td className="px-6 py-4">
                {type === "doctor" ? (
                  <Badge variant="outline" className="text-teal-700 bg-teal-50 border-teal-200">
                    {record.specialization}
                  </Badge>
                ) : (
                  <div className="flex items-center gap-1 text-slate-600">
                    <MapPin className="w-3 h-3" />
                    <span>{record.location}</span>
                  </div>
                )}
              </td>
              
              {/* Column 4: Actions */}
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => onAction(record.id, "reject")}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200"
                    onClick={() => onAction(record.id, "approve")}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Verify
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}