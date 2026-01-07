"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, ShieldCheck, Lock } from "lucide-react";

export default function DoctorForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Mock API Call
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/20">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-white tracking-tight">
          Doctor Security
        </h2>
        <p className="mt-2 text-center text-sm text-blue-200">
          Recover access to your clinical dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-10 shadow-2xl rounded-xl">
          
          {!isSent ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-900">
                  Registered Medical Email
                </label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-3 border focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="dr.name@hospital.com"
                  />
                </div>
              </div>

              <Button 
                className="w-full h-12 text-lg font-bold bg-blue-700 hover:bg-blue-800 text-white" 
                disabled={isLoading}
              >
                {isLoading ? <span className="flex items-center gap-2"><Lock className="h-4 w-4 animate-pulse"/> Verifying...</span> : "Send Recovery Link"}
              </Button>
            </form>
          ) : (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-50 mb-6">
                <Mail className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Recovery Email Sent</h3>
              <p className="text-sm text-slate-500 mt-2 mb-8 leading-relaxed">
                Please check your medical email inbox. We have sent secure instructions to reset your credentials.
              </p>
              <Button 
                variant="outline" 
                className="w-full border-slate-200 text-slate-600 hover:bg-slate-50"
                onClick={() => setIsSent(false)}
              >
                Try different email
              </Button>
            </div>
          )}

          <div className="mt-8 border-t border-slate-100 pt-6">
            <Link href="/auth/doctor/login" className="flex items-center justify-center text-sm font-medium text-slate-500 hover:text-blue-700 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Secure Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}