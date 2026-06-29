"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Calendar, Ticket, User, LogOut, PlusCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("humi_user");
    if (!userData) {
      router.push("/auth/login");
      return;
    }
    setUser(JSON.parse(userData));

    const fetchTickets = async () => {
      try {
        const { data } = await api.get("/tickets/my-tickets");
        setTickets(data);
      } catch (error) {
        console.error("Failed to fetch tickets", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [router]);

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await api.delete(`/tickets/${ticketId}`);
      setTickets(prev => prev.filter(t => t.id !== ticketId));
    } catch (error) {
      console.error("Failed to delete ticket", error);
      alert("Failed to delete ticket");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("humi_token");
    localStorage.removeItem("humi_user");
    router.push("/");
  };

  if (!user || loading) return <div className="flex-1 flex items-center justify-center"><div className="animate-pulse w-10 h-10 bg-primary rounded-full"></div></div>;

  return (
    <div className="flex-1 container mx-auto px-6 py-32">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <div className="w-full md:w-1/4">
          <div className="glass-panel p-6 rounded-3xl text-center sticky top-32">
            <div className="w-24 h-24 bg-gradient-to-tr from-primary to-secondary rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold overflow-hidden border-2 border-white/10">
              {user.profile_picture_url ? (
                <img src={user.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <h2 className="text-lg md:text-xl font-bold">{user.name}</h2>
            <p className="text-text-muted text-sm mb-6">{user.email}</p>
            <div className="inline-block px-3 py-1 bg-surface rounded-full text-xs font-medium tracking-wide border border-white/5 mb-8">
              {user.role}
            </div>

            <div className="space-y-2">
              <Link href="/dashboard" className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10 text-primary font-medium">
                <Ticket size={20} /> My Tickets
              </Link>
              {user.role === 'ORGANIZER' && (
                <Link href="/dashboard/events" className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface text-text-muted hover:text-white transition-colors">
                  <Calendar size={20} /> My Events
                </Link>
              )}
              <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors mt-auto pt-8">
                <LogOut size={20} /> Log Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full md:w-3/4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">My Tickets</h1>
            {user.role === 'ORGANIZER' && (
              <Link href="/events/create" className="px-5 py-2.5 bg-primary hover:bg-primary-dark rounded-full font-medium transition-colors flex items-center gap-2">
                <PlusCircle size={20} /> Create Event
              </Link>
            )}
          </div>

          {tickets.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-3xl">
              <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 text-text-muted">
                <Ticket size={40} />
              </div>
              <h3 className="text-xl font-semibold mb-2">No tickets yet</h3>
              <p className="text-text-muted mb-6">Looks like you haven't registered for any events.</p>
              <Link href="/events" className="px-6 py-3 bg-primary hover:bg-primary-dark rounded-full font-medium inline-block transition-colors">
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="relative glass-panel p-6 rounded-3xl flex flex-col md:flex-row gap-6 items-center overflow-hidden">
                  <button 
                    onClick={() => handleDeleteTicket(ticket.id)}
                    className="absolute top-4 right-4 p-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-full transition-all"
                    title="Delete Ticket"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="w-full md:w-32 h-32 bg-surface rounded-2xl overflow-hidden shrink-0">
                    {ticket.event.image_url ? (
                       <img src={ticket.event.image_url} alt={ticket.event.title} className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="text-text-muted" size={32} />
                       </div>
                    )}
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <Link href={`/events/${ticket.event.id}`}>
                      <h3 className="text-xl font-bold hover:text-primary transition-colors pr-8">{ticket.event.title}</h3>
                    </Link>
                    <p className="text-text-muted text-sm mt-2 flex items-center gap-2 justify-center md:justify-start">
                      <Calendar size={14} /> {format(new Date(ticket.event.date), "PPP p")}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                        {ticket.status}
                      </span>
                      <span className="px-3 py-1 bg-surface text-text-muted text-xs font-medium rounded-full border border-white/5">
                        {ticket.event.price > 0 ? `₦${ticket.event.price.toLocaleString()}` : "Free"}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 p-4 bg-white rounded-2xl mr-8 md:mr-0">
                    {/* Mock QR Code Display using the URL */}
                    <img src={ticket.qr_code_url} alt="Ticket QR" className="w-24 h-24" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
