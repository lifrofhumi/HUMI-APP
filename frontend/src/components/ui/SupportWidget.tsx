"use client";

import { useState } from "react";
import { MessageCircle, X, Mail, MessageSquare } from "lucide-react";

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Popover */}
      {isOpen && (
        <div className="mb-4 w-72 sm:w-80 glass-panel border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in">
          <div className="bg-primary px-5 py-4 flex justify-between items-center">
            <h3 className="font-semibold text-white">Contact Support</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-5 space-y-4">
            <p className="text-sm text-text-muted mb-4">
              Need help? Reach out to us through your preferred platform. We're here to assist you!
            </p>
            
            <a 
              href="https://wa.me/2347036990927"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-4 py-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl font-medium transition-colors"
            >
              <MessageSquare size={20} />
              Chat on WhatsApp
            </a>

            <a 
              href="mailto:quijadacarlos759@gmail.com"
              className="w-full flex items-center gap-3 px-4 py-3 bg-surface hover:bg-surface/80 border border-[var(--glass-border)] rounded-xl font-medium transition-colors text-text-main"
            >
              <Mail size={20} className="text-primary" />
              Send an Email
            </a>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95 ${
          isOpen ? "bg-surface text-primary border border-[var(--glass-border)]" : "bg-primary text-white"
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
