"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import { 
    User, Phone, Mail, Activity, FileText, Upload, Clock, 
    Calendar, ArrowLeft, Loader2, X, File 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function PatientCaseFile() {
  const { id } = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // UPLOAD STATE
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
      record_type: "prescription",
      notes: "",
      file: null as File | null
  });

  // 🟢 AI ANALYSIS STATE (From Version B)
  const [aiResult, setAiResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // 1. Fetch Data
  const fetchData = async () => {
    try {
        const res = await api.get(`/doctor/patients/${id}`);
        setPatient(res.data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { if(id) fetchData(); }, [id]);

  // 2. HANDLE FILE UPLOAD & AI ANALYSIS (Merged Logic)
  const handleUpload = async () => {
      if (!uploadForm.file || !uploadForm.notes) {
          alert("Please select a file and add notes.");
          return;
      }
      
      setUploading(true);
      try {
          // 1. Upload Simulation
          const mockFileUrl = `https://s3.aws.com/uploads/${uploadForm.file.name}`;
          
          await api.post(`/doctor/patients/${id}/records`, {
              record_type: uploadForm.record_type,
              file_url: mockFileUrl,
              notes: uploadForm.notes,
              date: new Date().toISOString().split('T')[0]
          });

          // 🟢 2. PROMPT FOR AI ANALYSIS (Version B Feature)
          if (uploadForm.record_type === "xray") { // Only ask for X-Rays ideally
             const wantAI = confirm("File Uploaded! Would you like to run AI Diagnosis on this X-Ray?");
             
             if (wantAI) {
                 setAnalyzing(true);
                 setIsUploadOpen(false); // Close upload dialog first
                 
                 // 3. Call AI Endpoint
                 const aiRes = await api.post("/doctor/analyze-xray", {
                     file_url: mockFileUrl,
                     patient_id: id
                 });
                 
                 setAiResult(aiRes.data.data); // Show Result Card
             } else {
                 alert("Medical Record Uploaded!");
                 setIsUploadOpen(false);
             }
          } else {
             alert("Medical Record Uploaded!");
             setIsUploadOpen(false);
          }
          
          fetchData(); // Refresh list
          
      } catch (e) {
          alert("Upload failed.");
      } finally {
          setUploading(false);
          setAnalyzing(false);
      }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>;
  if (!patient) return <div className="p-10">Patient not found.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans p-6 pb-20 max-w-7xl mx-auto">
      
      {/* 🟢 AI ANALYZING SPINNER OVERLAY */}
      {analyzing && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md">
            <Loader2 className="h-16 w-16 text-emerald-600 animate-spin mb-4" />
            <h2 className="text-2xl font-black text-slate-900">Analyzing X-Ray...</h2>
            <p className="text-slate-500 mt-2">Checking for cavities, lesions, and anomalies.</p>
        </div>
      )}

      {/* 🟢 AI RESULT OVERLAY */}
      {aiResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <Card className="w-full max-w-lg bg-white shadow-2xl border-0 ring-4 ring-emerald-500/20">
                <CardHeader className="bg-emerald-600 text-white rounded-t-xl">
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-6 w-6 animate-pulse" /> AI Analysis Complete
                        </CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => setAiResult(null)} className="text-white hover:bg-emerald-700">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    
                    <div className="flex flex-col items-center text-center">
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Detected Condition</div>
                        <div className="text-2xl font-black text-slate-900 mt-1">{aiResult.diagnosis || "No Major Issues"}</div>
                        
                        <Badge className={`mt-3 px-4 py-1 text-sm ${aiResult.confidence > 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {aiResult.confidence ? `${(aiResult.confidence * 100).toFixed(0)}% Confidence Score` : "AI Suggestion"}
                        </Badge>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex gap-3">
                            <FileText className="h-5 w-5 text-slate-400 shrink-0" />
                            <div>
                                <span className="text-xs font-bold text-slate-500 uppercase">AI Clinical Notes</span>
                                <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                                    "{aiResult.notes || aiResult.findings}"
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button className="w-full bg-slate-900 hover:bg-slate-800 h-12 text-lg" onClick={() => setAiResult(null)}>
                        Acknowledge & Save to History
                    </Button>
                </CardContent>
            </Card>
        </div>
      )}

      <Link href="/doctor/patients" className="inline-flex items-center text-sm text-slate-500 hover:text-emerald-600 font-bold">
         <ArrowLeft className="h-4 w-4 mr-1" /> Back to Registry
      </Link>

      {/* HEADER CARD */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
         <div className="h-28 w-28 rounded-full bg-emerald-100 flex items-center justify-center text-4xl font-black text-emerald-700 border-4 border-white shadow-xl flex-shrink-0">
            {patient.name.charAt(0)}
         </div>
         <div className="flex-1 space-y-3 z-10">
            <h1 className="text-3xl font-black text-slate-900">{patient.name}</h1>
            <div className="flex flex-wrap gap-6 text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> {patient.email}</span>
                <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> {patient.phone}</span>
            </div>
         </div>
      </div>

      <Tabs defaultValue="records" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-14 inline-flex shadow-sm w-full md:w-auto mb-6">
          <TabsTrigger value="history" className="rounded-lg px-8 font-bold h-10 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">Medical History</TabsTrigger>
          <TabsTrigger value="records" className="rounded-lg px-8 font-bold h-10 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">Records & X-Rays</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
             {patient.medical_history && patient.medical_history.length > 0 ? (
                 <div className="space-y-4">
                     {patient.medical_history.map((h: any, i: number) => (
                         <Card key={i} className="p-4 border-l-4 border-l-emerald-500">
                             <div className="flex justify-between">
                                 <div>
                                     <p className="font-bold text-slate-900">{h.reason}</p>
                                     <p className="text-sm text-slate-500">Diagnosis: {h.diagnosis}</p>
                                 </div>
                                 <Badge variant="outline">{h.date}</Badge>
                             </div>
                         </Card>
                     ))}
                 </div>
             ) : (
                 <div className="text-center py-12 text-slate-400">No history available.</div>
             )}
        </TabsContent>

        <TabsContent value="records" className="space-y-6">
            
            {/* UPLOAD TRIGGER */}
            <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setIsUploadOpen(true)}>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-md mb-6 animate-bounce">
                        <Upload className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">Upload Medical Record</h3>
                    <p className="text-sm text-slate-500 mt-2">Click here to attach X-Rays or Prescriptions.</p>
                </CardContent>
            </Card>

            {/* List of Records */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patient.records && patient.records.length > 0 ? (
                    patient.records.map((rec: any, i: number) => (
                        <Card key={i} className="flex items-center p-4 gap-4">
                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 capitalize">{rec.record_type}</p>
                                <p className="text-xs text-slate-500">{rec.date}</p>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full text-center py-8 text-slate-400">No records uploaded yet.</div>
                )}
            </div>

        </TabsContent>
      </Tabs>

      {/* UPLOAD DIALOG POPUP */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Upload className="h-5 w-5 text-emerald-600" /> Upload Document
            </DialogTitle>
            <DialogDescription>Attach a file to {patient.name}'s medical history.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
             {/* File Input */}
             <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
                <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})}
                />
                {uploadForm.file ? (
                    <div className="flex flex-col items-center text-emerald-700">
                        <File className="h-10 w-10 mb-2" />
                        <span className="font-bold text-sm">{uploadForm.file.name}</span>
                        <span className="text-xs text-emerald-500">{(uploadForm.file.size / 1024).toFixed(1)} KB</span>
                    </div>
                ) : (
                    <>
                        <Upload className="h-10 w-10 text-slate-300 mb-2" />
                        <span className="text-sm font-bold text-slate-500">Click or Drag to Upload</span>
                        <span className="text-xs text-slate-400 mt-1">PDF, PNG, JPG (Max 10MB)</span>
                    </>
                )}
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                     <Label>Document Type</Label>
                     <Select onValueChange={(val) => setUploadForm({...uploadForm, record_type: val})} defaultValue="prescription">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="prescription">Prescription</SelectItem>
                            <SelectItem value="xray">X-Ray / Scan</SelectItem>
                            <SelectItem value="lab_report">Lab Report</SelectItem>
                        </SelectContent>
                     </Select>
                 </div>
                 <div className="space-y-2">
                     <Label>Date</Label>
                     <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                 </div>
             </div>

             <div className="space-y-2">
                 <Label>Clinical Notes</Label>
                 <Textarea 
                    placeholder="e.g. Lower molar extraction X-Ray..." 
                    value={uploadForm.notes}
                    onChange={(e) => setUploadForm({...uploadForm, notes: e.target.value})}
                 />
             </div>
          </div>

          <DialogFooter>
             <Button variant="ghost" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
             <Button onClick={handleUpload} disabled={uploading} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]">
                 {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Upload Now"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}