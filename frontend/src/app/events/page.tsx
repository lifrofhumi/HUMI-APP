"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { format } from "date-fns";
import { Calendar, MapPin, Search } from "lucide-react";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState("All");

  const categories = ["All", "General", "Technology", "Music", "Art", "Sports", "Networking"];
  const eventTypes = ["All", "Free", "Paid"];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);
        if (category !== "All") params.append("category", category);
        if (type !== "All") params.append("type", type);

        const { data } = await api.get(`/events?${params.toString()}`);
        setEvents(data);
      } catch (err) {
        console.error("Failed to fetch events", err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchEvents();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, category, type]);

  return (
    <div className="flex-1 container mx-auto px-6 py-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Discover Events</h1>
          <p className="text-text-muted">Find out what's happening around campus</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              <Search size={18} />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="w-full md:w-40 px-4 py-3 bg-surface/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            className="w-full md:w-32 px-4 py-3 bg-surface/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white"
          >
            {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel h-80 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {events.map((event) => (
            <Link href={`/events/${event.id}`} key={event.id} className="group">
              <div className="glass-panel rounded-2xl overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(79,70,229,0.15)] flex flex-col h-full">
                <div className="h-48 bg-surface/80 relative overflow-hidden">
                  {event.image_url ? (
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted bg-gradient-to-br from-surface to-background">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium border border-white/10">
                    {event.price > 0 ? `₦${event.price.toLocaleString()}` : "Free"}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">{event.title}</h3>
                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center gap-2 text-text-muted text-sm">
                      <Calendar size={16} className="text-secondary" />
                      <span>{format(new Date(event.date), "MMM d, yyyy • h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted text-sm">
                      <MapPin size={16} className="text-primary" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {events.length === 0 && (
            <div className="col-span-3 text-center py-20 text-text-muted">
              No events found. Check back later!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
