"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft, Loader2, Search, Download, CheckCircle2, User, Clock, Ticket } from "lucide-react";
import Link from "next/link";

export default function EventAttendeesPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const [attendees, setAttendees] = useState<any[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendees = async () => {
      try {
        const { data } = await api.get(`/tickets/event/${eventId}`);
        setAttendees(data);
        setFilteredAttendees(data);
      } catch (error) {
        console.error("Failed to fetch attendees", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendees();
  }, [eventId]);

  useEffect(() => {
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      setFilteredAttendees(
        attendees.filter(
          (t) =>
            t.user.name.toLowerCase().includes(lower) ||
            t.user.email.toLowerCase().includes(lower) ||
            t.id.toLowerCase().includes(lower)
        )
      );
    } else {
      setFilteredAttendees(attendees);
    }
  }, [searchTerm, attendees]);

  const handleCheckIn = async (ticketId: string) => {
    if (!confirm("Confirm check-in for this ticket?")) return;
    setCheckingIn(ticketId);
    try {
      const { data } = await api.post(`/tickets/${ticketId}/check-in`);
      setAttendees((prev) =>
        prev.map((t) => (t.id === ticketId ? data.ticket : t))
      );
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || "Failed to check in ticket");
    } finally {
      setCheckingIn(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Ticket ID", "Name", "Email", "Status", "Check-in Time"];
    const csvContent = [
      headers.join(","),
      ...filteredAttendees.map((t) =>
        [
          t.id,
          `"${t.user.name}"`,
          `"${t.user.email}"`,
          t.is_used ? "Checked In" : t.status,
          t.check_in_time ? new Date(t.check_in_time).toLocaleString() : "N/A"
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `attendees_${eventId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh]">
        <Loader2 className="animate-spin text-primary" size={64} />
      </div>
    );
  }

  return (
    <div className="flex-1 container mx-auto px-6 py-32 max-w-6xl">
      <Link href="/dashboard/events" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8">
        <ArrowLeft size={20} /> Back to My Events
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Attendees</h1>
          <p className="text-text-muted">Track ticket sales and check-in attendees at the venue.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or ticket ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-surface border border-white/10 rounded-full focus:ring-2 focus:ring-primary/50 text-white w-full md:w-80"
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-surface hover:bg-surface-light border border-white/10 rounded-full font-medium transition-colors"
          >
            <Download size={20} /> Export CSV
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface/50 border-b border-white/5">
                <th className="p-4 font-semibold text-text-muted">Attendee</th>
                <th className="p-4 font-semibold text-text-muted">Ticket ID</th>
                <th className="p-4 font-semibold text-text-muted">Status</th>
                <th className="p-4 font-semibold text-text-muted">Check-in Time</th>
                <th className="p-4 font-semibold text-text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-muted">
                    No attendees found.
                  </td>
                </tr>
              ) : (
                filteredAttendees.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                          {ticket.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold">{ticket.user.name}</p>
                          <p className="text-xs text-text-muted">{ticket.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-sm bg-surface-light px-2 py-1 rounded">
                        {ticket.id.split('-')[0].toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      {ticket.is_used ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold">
                          <CheckCircle2 size={14} /> Checked In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold">
                          <Ticket size={14} /> Valid
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-text-muted text-sm flex items-center gap-2">
                      {ticket.check_in_time ? (
                        <>
                          <Clock size={16} />
                          {new Date(ticket.check_in_time).toLocaleString()}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {!ticket.is_used && (
                        <button
                          onClick={() => handleCheckIn(ticket.id)}
                          disabled={checkingIn === ticket.id}
                          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                        >
                          {checkingIn === ticket.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                          Check In
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
