"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Ticket, Bell, ArrowRight, Mail, Phone } from 'lucide-react';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAuthenticated(!!localStorage.getItem("humi_token"));
  }, []);

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 z-0" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-8">
            Lasu Campus <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Event Management</span>
          </h1>
          <p className="text-lg md:text-xl text-text-muted mb-12 max-w-2xl mx-auto">
            Discover, register, and experience the best campus events. Real-time notifications and seamless ticketing all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={mounted && isAuthenticated ? "/dashboard" : "/auth/register"} className="px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-full font-medium transition-all flex items-center gap-2 transform hover:scale-105">
              Get Started <ArrowRight size={20} />
            </Link>
            <Link href="/events" className="px-8 py-4 glass-panel hover:bg-surface text-text-main rounded-full font-medium transition-all">
              Discover Events
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-surface/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="glass-panel p-8 rounded-2xl text-center transform transition duration-500 hover:-translate-y-2">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                <Calendar size={32} />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-4">Discover Events</h3>
              <p className="text-text-muted">Find academic, social, and cultural events happening right on your campus.</p>
            </div>
            <div className="glass-panel p-8 rounded-2xl text-center transform transition duration-500 hover:-translate-y-2">
              <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-secondary">
                <Ticket size={32} />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-4">Seamless Ticketing</h3>
              <p className="text-text-muted">Register and purchase tickets securely. Get instant QR codes for quick entry.</p>
            </div>
            <div className="glass-panel p-8 rounded-2xl text-center transform transition duration-500 hover:-translate-y-2">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-400">
                <Bell size={32} />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-4">Real-Time Alerts</h3>
              <p className="text-text-muted">Never miss out with instant push notifications for your registered events.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent z-0" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-12">Contact Support</h2>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 max-w-4xl mx-auto">
            <a href="mailto:quijadacarlos@gmail.com" className="glass-panel w-full p-4 md:p-6 rounded-2xl flex flex-row items-center gap-4 hover:bg-white/5 transition-colors border border-white/10 group text-left">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-sm text-text-muted mb-1">Email Us</p>
                <p className="font-medium break-all md:break-normal text-sm md:text-base">quijadacarlos759@gmail.com</p>
              </div>
            </a>
            
            <a href="tel:+2347036990927" className="glass-panel w-full p-4 md:p-6 rounded-2xl flex flex-row items-center gap-4 hover:bg-white/5 transition-colors border border-white/10 group text-left">
              <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                <Phone size={24} />
              </div>
              <div>
                <p className="text-sm text-text-muted mb-1">Call Us</p>
                <p className="font-medium">+234 703 699 0927</p>
              </div>
            </a>
            
            <a href="https://twitter.com/elonmusk" target="_blank" rel="noopener noreferrer" className="glass-panel w-full p-4 md:p-6 rounded-2xl flex flex-row items-center gap-4 hover:bg-white/5 transition-colors border border-white/10 group text-left">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4l16 16M4 20L20 4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-text-muted mb-1">X (formerly Twitter)</p>
                <p className="font-medium">@elonmusk</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-background/50 py-12 mt-auto">
        <div className="container mx-auto px-6 text-center text-sm text-text-muted">
          <p className="mb-2">&copy; {new Date().getFullYear()} HUMI - Lasu Campus Event Management.</p>
          <p>Lagos State University (LASU), Badagry Expressway, Ojo, Lagos, Nigeria.</p>
        </div>
      </footer>
    </main>
  );
}
