"use client";

import Link from "next/link";
import { ArrowRight, Info, Shield, Users, Calendar, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="flex-1 pt-32 pb-20">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">HUMI</span>
          </h1>
          <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto">
            The premier campus event management and ticketing platform designed exclusively for the Lagos State University community.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Our Mission</h2>
            <p className="text-text-muted text-lg leading-relaxed">
              At HUMI, we believe that campus life is defined by the events, gatherings, and experiences shared by students. Our mission is to bridge the gap between event organizers and attendees by providing a seamless, secure, and intuitive platform for discovering and managing campus events.
            </p>
            <p className="text-text-muted text-lg leading-relaxed">
              Whether you're looking for academic seminars, cultural festivals, or social parties, HUMI ensures you never miss out on what makes university life extraordinary.
            </p>
          </div>
          <div className="glass-panel p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 border-white/10 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
               <Heart size={120} />
             </div>
             <h3 className="text-xl font-bold mb-4">Built for Students, by Students</h3>
             <ul className="space-y-4">
               <li className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary"><Calendar size={16} /></div>
                 <span>Centralized event discovery</span>
               </li>
               <li className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary"><Shield size={16} /></div>
                 <span>Secure ticketing & QR verification</span>
               </li>
               <li className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"><Users size={16} /></div>
                 <span>Empowering student organizers</span>
               </li>
             </ul>
          </div>
        </div>

        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-12">Core Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 rounded-2xl border-white/5 hover:border-primary/30 transition-colors">
              <Info className="text-primary mb-4" size={32} />
              <h3 className="text-xl font-semibold mb-3">Real-time Updates</h3>
              <p className="text-text-muted">Get instant notifications about event changes, new announcements, and upcoming schedules directly on your device.</p>
            </div>
            <div className="glass-panel p-8 rounded-2xl border-white/5 hover:border-secondary/30 transition-colors">
              <Shield className="text-secondary mb-4" size={32} />
              <h3 className="text-xl font-semibold mb-3">Secure Payments</h3>
              <p className="text-text-muted">Integrated with Paystack for seamless, secure, and instant ticket purchases with immediate digital delivery.</p>
            </div>
            <div className="glass-panel p-8 rounded-2xl border-white/5 hover:border-blue-500/30 transition-colors">
              <Users className="text-blue-400 mb-4" size={32} />
              <h3 className="text-xl font-semibold mb-3">Organizer Tools</h3>
              <p className="text-text-muted">Powerful dashboard for organizers to track sales, manage attendees, and scan QR tickets at the venue.</p>
            </div>
          </div>
        </div>

        <div className="text-center bg-surface p-12 rounded-3xl border border-white/5">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to experience campus life?</h2>
          <p className="text-text-muted mb-8 max-w-xl mx-auto">Join thousands of students who are already using HUMI to discover and attend the best events on campus.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/events" className="px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-full font-medium transition-all flex items-center justify-center gap-2">
              Explore Events <ArrowRight size={20} />
            </Link>
            <Link href="/auth/register" className="px-8 py-4 glass-panel hover:bg-white/5 transition-colors rounded-full font-medium">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
