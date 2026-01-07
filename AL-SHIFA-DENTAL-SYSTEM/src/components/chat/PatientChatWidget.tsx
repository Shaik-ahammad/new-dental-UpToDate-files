"use client";

import { useState, useRef, useEffect } from "react";
import { 
  MessageCircle, X, Send, Sparkles, Bot, User, 
  ChevronRight, Calendar, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";

// --- TYPES ---
interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  action?: {
    type: "booking_suggestion" | "link";
    label: string;
    data?: any;
  };
}

export default function PatientChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: "welcome", 
      role: "agent", 
      content: "Hello! I am Dr. AI. How can I help you today? I can schedule appointments, check records, or answer basic questions." 
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // --- HANDLER: SEND MESSAGE ---
  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput("");
    
    // 1. Add User Message
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: userText };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // 2. Call AI Backend
      const res = await api.post("/agent/execute", {
        user_query: userText,
        session_id: "patient-session-1" // In real app, use actual session ID
      });

      // 3. Add Agent Response
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: res.data.response_text || "I processed that, but have no text response.",
        action: res.data.action_taken === "booking_intent" ? {
            type: "booking_suggestion",
            label: "View Available Slots",
            data: res.data.slots
        } : undefined
      };
      
      setMessages(prev => [...prev, agentMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: "agent", 
        content: "⚠️ I'm having trouble connecting to the clinic server. Please try again later." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      
      {/* --- CHAT WINDOW --- */}
      {isOpen && (
        <Card className="w-[380px] h-[550px] mb-4 flex flex-col overflow-hidden shadow-2xl border-0 animate-in slide-in-from-bottom-10 fade-in duration-300 rounded-2xl ring-1 ring-black/5">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Dr. AI Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] text-blue-100 font-medium opacity-90">Online</span>
                </div>
              </div>
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              className="text-white hover:bg-white/20 rounded-full h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                
                {/* Agent Avatar */}
                {msg.role === "agent" && (
                   <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mr-2 mt-1 shrink-0 border border-blue-200">
                      <Sparkles className="h-3 w-3 text-blue-600" />
                   </div>
                )}

                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm relative group ${
                  msg.role === "user" 
                    ? "bg-blue-600 text-white rounded-br-none" 
                    : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
                }`}>
                  <p className="leading-relaxed">{msg.content}</p>
                  
                  {/* Action Suggestion Chip */}
                  {msg.action && (
                    <div className="mt-3 pt-3 border-t border-dashed border-slate-200">
                      <Button 
                        size="sm" 
                        className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 shadow-sm justify-between group-hover:border-blue-300"
                        onClick={() => window.location.href = '/patient/appointments/new'}
                      >
                        {msg.action.label}
                        <Calendar className="h-3.5 w-3.5 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {msg.role === "user" && (
                   <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center ml-2 mt-1 shrink-0">
                      <User className="h-3 w-3 text-slate-500" />
                   </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-start">
                 <div className="h-6 w-6 rounded-full bg-transparent mr-2 shrink-0" />
                 <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-slate-100 shadow-sm flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                 </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100 shrink-0">
            <form 
              className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all"
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            >
              <input
                className="flex-1 bg-transparent px-4 py-2 text-sm outline-none text-slate-700 placeholder:text-slate-400"
                placeholder="Ask about slots, records..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <Button 
                size="icon" 
                type="submit" 
                disabled={!input.trim() || loading}
                className="rounded-full h-8 w-8 bg-blue-600 hover:bg-blue-500 shrink-0 transition-transform active:scale-95"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>

        </Card>
      )}

      {/* --- TOGGLE BUTTON --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`h-14 w-14 rounded-full shadow-[0_8px_30px_rgb(37,99,235,0.3)] bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 z-50 group
          ${isOpen ? "rotate-90 scale-90 bg-slate-800" : ""}
        `}
      >
        {isOpen ? (
            <X className="h-6 w-6" />
        ) : (
            <MessageCircle className="h-7 w-7 group-hover:animate-pulse" />
        )}
        
        {/* Tooltip on Hover */}
        {!isOpen && (
          <div className={`absolute right-16 top-2 bg-white px-4 py-2 rounded-xl shadow-lg border border-slate-100 whitespace-nowrap transition-all duration-300 origin-right
            ${isHovered ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-90 translate-x-4 pointer-events-none"}
          `}>
             <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
               <Sparkles className="h-3 w-3 text-blue-500" />
               Talk to Dr. AI
             </p>
             <div className="absolute top-4 -right-1.5 w-3 h-3 bg-white transform rotate-45 border-r border-t border-slate-100"></div>
          </div>
        )}
      </button>

    </div>
  );
}