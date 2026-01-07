"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, MapPin, Save } from "lucide-react";

export default function ProfileSettings() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1 text-center">
          <CardContent className="pt-6">
            <div className="h-32 w-32 rounded-full bg-slate-200 mx-auto flex items-center justify-center text-4xl text-slate-500 font-bold mb-4 relative">
              AK
              <span className="absolute bottom-0 right-0 h-8 w-8 bg-blue-500 rounded-full border-4 border-white flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </span>
            </div>
            <h2 className="text-xl font-bold">Ali Khan</h2>
            <p className="text-slate-500 text-sm">Patient ID: #89201</p>
            <Button variant="outline" className="mt-4 w-full">Change Photo</Button>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" defaultValue="Ali" />
              <Input label="Last Name" defaultValue="Khan" />
            </div>
            <Input label="Email Address" defaultValue="ali.khan@example.com" icon={<Mail className="h-4 w-4" />} />
            <Input label="Phone Number" defaultValue="+92 300 1234567" icon={<Phone className="h-4 w-4" />} />
            <Input label="Address" defaultValue="House 12, Street 4, Lahore" icon={<MapPin className="h-4 w-4" />} />
            
            <div className="pt-4 flex justify-end">
              <Button variant="doctor">
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
