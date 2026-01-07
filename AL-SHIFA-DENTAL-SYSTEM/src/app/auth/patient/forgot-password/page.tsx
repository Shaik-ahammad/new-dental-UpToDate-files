"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, CheckCircle, KeyRound, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api"; // API Helper Import

export default function PatientForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // API Call
      await api.post("/forgot-password", { email });
      setIsSent(true);
    } catch (err: any) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-patient/10 flex items-center justify-center animate-pulse">
            <KeyRound className="h-8 w-8 text-patient" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Forgot Password?
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 max-w-xs mx-auto">
          Enter your registered email to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-10 shadow-xl rounded-2xl border border-slate-100">
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          {!isSent ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus:ring-patient focus:border-patient block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-3 border outline-none transition-all"
                    placeholder="ali@example.com"
                  />
                </div>
              </div>

              <Button 
                variant="patient" 
                className="w-full h-12 text-lg font-bold shadow-lg shadow-patient/20" 
                disabled={isLoading}
              >
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Sending...</> : "Reset Password"}
              </Button>
            </form>
          ) : (
            <div className="text-center animate-in zoom-in duration-300">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Check your inbox</h3>
              <p className="text-sm text-slate-500 mt-2 mb-6">
                We have sent a password reset link to <strong>{email}</strong>.
              </p>
              <Button 
                variant="outline" 
                className="w-full border-slate-200"
                onClick={() => setIsSent(false)}
              >
                Resend Email
              </Button>
            </div>
          )}

          <div className="mt-8 border-t border-slate-100 pt-6">
            <Link href="/auth/patient/login" className="flex items-center justify-center text-sm font-medium text-slate-500 hover:text-patient transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}