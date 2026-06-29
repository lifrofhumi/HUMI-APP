"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast, Toaster } from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft, Check, X, Eye } from "lucide-react";

import { useRouter } from "next/navigation";

interface PendingEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  submittedAt: string;
  organizer: {
    name: string;
    faculty: string;
    department: string;
  };
}

export default function PendingEvents() {
  const router = useRouter();
  const [events, setEvents] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    fetchPendingEvents();
  }, []);

  const fetchPendingEvents = async () => {
    try {
      const res = await api.get("/events/admin/pending");
      setEvents(res.data);
    } catch (error: any) {
      console.error("Failed to fetch pending events", error);
      if (error.response?.status === 401) {
        toast.error("Authentication required.");
        router.push("/auth/login");
      } else if (error.response?.status === 403) {
        setAccessDenied(true);
      } else {
        toast.error("Failed to load events.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/events/${id}/approve`);
      toast.success("Event approved successfully!");
      fetchPendingEvents();
    } catch (error) {
      toast.error("Failed to approve event.");
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    try {
      await api.put(`/events/${id}/reject`, { rejectionReason });
      toast.success("Event rejected.");
      setRejectingId(null);
      setRejectionReason("");
      fetchPendingEvents();
    } catch (error) {
      toast.error("Failed to reject event.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">Administrator privileges are required to view this page.</p>
        <Link href="/dashboard" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} className="mr-1" />
          Back to Admin Dashboard
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pending Event Approvals</h1>
        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
          {events.length} Pending
        </span>
      </div>

      {events.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">No Pending Events</h3>
          <p className="mt-1 text-gray-500">All events have been reviewed.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {events.map((event) => (
              <li key={event.id} className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
                      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {event.category}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <p><strong>Organizer:</strong> {event.organizer.name} ({event.organizer.department})</p>
                      <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                      <p><strong>Location:</strong> {event.location}</p>
                      <p><strong>Submitted:</strong> {new Date(event.submittedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex items-center space-x-3">
                    <Link
                      href={`/events/${event.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4 mr-2" /> View Details
                    </Link>
                    
                    {rejectingId === event.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Reason for rejection..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500"
                        />
                        <button
                          onClick={() => handleReject(event.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(null);
                            setRejectionReason("");
                          }}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprove(event.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-2" /> Approve
                        </button>
                        <button
                          onClick={() => setRejectingId(event.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                          <X className="h-4 w-4 mr-2" /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
