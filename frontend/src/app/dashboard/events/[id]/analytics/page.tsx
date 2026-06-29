"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft, Loader2, Users, Ticket, DollarSign, CheckCircle2, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function EventAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get(`/dashboard/event/${eventId}/stats`);
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh]">
        <Loader2 className="animate-spin text-primary" size={64} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex-1 container mx-auto px-6 py-32 text-center">
        <h2 className="text-2xl font-bold text-red-400">Failed to load analytics</h2>
        <Link href="/dashboard/events" className="mt-6 px-6 py-3 bg-surface hover:bg-surface/80 text-white rounded-xl inline-block">
          Return to Events
        </Link>
      </div>
    );
  }

  const chartData = [
    { name: "Sold", value: stats.ticketsSold, color: "#10b981" },
    { name: "Remaining", value: stats.ticketsRemaining, color: "#3b82f6" },
    { name: "Checked In", value: stats.checkIns, color: "#8b5cf6" },
  ];

  return (
    <div className="flex-1 container mx-auto px-6 py-32 max-w-6xl">
      <Link href="/dashboard/events" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8">
        <ArrowLeft size={20} /> Back to My Events
      </Link>

      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-3">{stats.eventTitle} Analytics</h1>
        <p className="text-text-muted">Detailed performance metrics for this event.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
              <Ticket size={24} />
            </div>
            <div>
              <p className="text-text-muted text-sm font-medium">Tickets Sold</p>
              <h3 className="text-2xl font-bold">{stats.ticketsSold} <span className="text-sm font-normal text-text-muted">/ {stats.capacity}</span></h3>
            </div>
          </div>
          <div className="w-full bg-surface-light rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: `${(stats.ticketsSold / stats.capacity) * 100}%` }}></div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-500">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-text-muted text-sm font-medium">Total Revenue</p>
              <h3 className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-500">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-text-muted text-sm font-medium">Total Check-ins</p>
              <h3 className="text-2xl font-bold">{stats.checkIns}</h3>
            </div>
          </div>
          <div className="w-full bg-surface-light rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${stats.ticketsSold > 0 ? (stats.checkIns / stats.ticketsSold) * 100 : 0}%` }}></div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500">
              <ShoppingCart size={24} />
            </div>
            <div>
              <p className="text-text-muted text-sm font-medium">Total Purchases</p>
              <h3 className="text-2xl font-bold">{stats.totalPurchases}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8 rounded-3xl">
          <h3 className="text-xl font-bold mb-6">Attendance Overview</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Recent Ticket Purchases</h3>
            <Link href={`/dashboard/events/${eventId}/attendees`} className="text-sm text-primary hover:underline font-medium">
              View All Attendees
            </Link>
          </div>
          
          <div className="space-y-4">
            {stats.recentTickets.length === 0 ? (
              <p className="text-text-muted">No tickets purchased yet.</p>
            ) : (
              stats.recentTickets.map((ticket: any) => (
                <div key={ticket.id} className="flex justify-between items-center p-4 bg-surface rounded-xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                      {ticket.user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{ticket.user.name}</p>
                      <p className="text-xs text-text-muted">{ticket.user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono bg-surface-light px-2 py-1 rounded">{ticket.id.split('-')[0].toUpperCase()}</p>
                    <p className="text-xs text-text-muted mt-1">{new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
