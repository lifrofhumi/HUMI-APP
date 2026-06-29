"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Calendar, Ticket, LogOut, PlusCircle, MapPin, Eye, Edit, Copy, Trash2, Users, BarChart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function MyEventsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("humi_user");
    if (!userData) {
      router.push("/auth/login");
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'ORGANIZER' && parsedUser.role !== 'ADMIN') {
      router.push("/dashboard");
      return;
    }
    setUser(parsedUser);

    const fetchEvents = async () => {
      try {
        const { data } = await api.get(`/events?organizer_id=${parsedUser.id}`);
        setEvents(data);
      } catch (error) {
        console.error("Failed to fetch events", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("humi_token");
    localStorage.removeItem("humi_user");
    router.push("/");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.delete(`/events/${id}`);
      setEvents(events.filter(e => e.id !== id));
    } catch (error) {
      console.error("Failed to delete event", error);
      alert("Failed to delete event.");
    }
  };

  const handleDuplicate = (event: any) => {
    sessionStorage.setItem("humi_duplicate_event", JSON.stringify({
      title: `Copy of ${event.title}`,
      description: event.description,
      category: event.category,
      venue: event.location,
      price: event.price.toString(),
      capacity: event.capacity.toString()
    }));
    router.push("/events/create?duplicate=true");
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
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-text-muted text-sm mb-6">{user.email}</p>
            <div className="inline-block px-3 py-1 bg-surface rounded-full text-xs font-medium tracking-wide border border-white/5 mb-8">
              {user.role}
            </div>

            <div className="space-y-2">
              <Link href="/dashboard" className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface text-text-muted hover:text-white transition-colors">
                <Ticket size={20} /> My Tickets
              </Link>
              <Link href="/dashboard/events" className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10 text-primary font-medium">
                <Calendar size={20} /> My Events
              </Link>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors mt-auto pt-8">
                <LogOut size={20} /> Log Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full md:w-3/4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">My Events</h1>
            <Link href="/events/create" className="px-5 py-2.5 bg-primary hover:bg-primary-dark rounded-full font-medium transition-colors flex items-center gap-2">
              <PlusCircle size={20} /> Create Event
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-3xl">
              <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 text-text-muted">
                <Calendar size={40} />
              </div>
              <h3 className="text-xl font-semibold mb-2">No events created</h3>
              <p className="text-text-muted mb-6">You haven't organized any events yet.</p>
              <Link href="/events/create" className="px-6 py-3 bg-primary hover:bg-primary-dark rounded-full font-medium inline-block transition-colors">
                Create First Event
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {events.map((event) => {
                const eventDate = new Date(event.date);
                return (
                  <div key={event.id} className="glass-panel rounded-3xl overflow-hidden flex flex-col transition-transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5">
                    <div className="h-40 w-full relative bg-surface-light">
                      {event.image_url ? (
                        <Image src={event.image_url} alt={event.title} fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
                      )}
                      <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-semibold flex items-center gap-2">
                        {event.is_cancelled ? (
                          <span className="text-red-400">Cancelled</span>
                        ) : (
                          <>
                            {event.status === 'Approved' && <span className="text-green-400">Approved</span>}
                            {event.status === 'Published' && <span className="text-green-400">Published</span>}
                            {event.status === 'Draft' && <span className="text-gray-400">Draft</span>}
                            {event.status === 'Pending Approval' && <span className="text-yellow-400">Pending</span>}
                            {event.status === 'Rejected' && <span className="text-red-400">Rejected</span>}
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold mb-2 line-clamp-1">{event.title}</h3>
                      <div className="flex items-center text-text-muted text-sm mb-4 gap-4">
                        <span className="flex items-center gap-1"><Calendar size={14} /> {eventDate.toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><MapPin size={14} /> {event.location}</span>
                      </div>
                      
                      <div className="mt-auto pt-6 border-t border-white/5 flex flex-wrap gap-2">
                        <Link href={`/events/${event.id}`} className="flex-1 flex justify-center items-center gap-2 p-2 rounded-lg bg-surface hover:bg-surface-light text-sm transition-colors" title="View Event">
                          <Eye size={16} />
                        </Link>
                        <Link href={`/dashboard/events/${event.id}/edit`} className="flex-1 flex justify-center items-center gap-2 p-2 rounded-lg bg-surface hover:bg-surface-light text-sm transition-colors" title="Edit Event">
                          <Edit size={16} />
                        </Link>
                        <button onClick={() => handleDuplicate(event)} className="flex-1 flex justify-center items-center gap-2 p-2 rounded-lg bg-surface hover:bg-surface-light text-sm transition-colors" title="Duplicate Event">
                          <Copy size={16} />
                        </button>
                        <button onClick={() => handleDelete(event.id)} className="flex-1 flex justify-center items-center gap-2 p-2 rounded-lg bg-surface hover:bg-red-500/20 hover:text-red-400 text-sm transition-colors" title="Delete Event">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Link href={`/dashboard/events/${event.id}/attendees`} className="flex-1 flex justify-center items-center gap-2 p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors">
                          <Users size={16} /> Attendees
                        </Link>
                        <Link href={`/dashboard/events/${event.id}/analytics`} className="flex-1 flex justify-center items-center gap-2 p-2 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary text-sm font-medium transition-colors">
                          <BarChart size={16} /> Analytics
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
