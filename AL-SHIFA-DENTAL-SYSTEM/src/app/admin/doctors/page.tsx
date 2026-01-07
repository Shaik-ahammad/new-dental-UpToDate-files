"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { KycTable } from "@/components/kyc/KycTable";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/doctors/pending");
      setDoctors(res.data);
    } catch (error) {
      console.error("Failed to load doctors", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      await api.post(`/admin/verify/doctor/${id}?action=${action}`);
      // Optimistic Update: Remove from list immediately
      setDoctors((prev: any) => prev.filter((d: any) => d.id !== id));
    } catch (error) {
      alert("Action failed. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Doctor Verification</h1>
          <p className="text-slate-500 mt-1">Review credentials and approve new practitioners.</p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Pending Queue</CardTitle>
          <CardDescription>Doctors waiting for license verification.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <KycTable data={doctors} type="doctor" onAction={handleAction} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}