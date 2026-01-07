"use client";

export default function DoctorAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full flex flex-col justify-center">
      {/* This layout is nested INSIDE the main AuthLayout.
        The Emerald Theme is applied by the parent based on the URL "/doctor".
      */}
      {children}
    </div>
  );
}