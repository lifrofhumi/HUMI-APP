"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast, Toaster } from "react-hot-toast";
import Link from "next/link";
import { ClipboardList, Users, BarChart3, ArrowLeft, Check, X, Eye } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  totalTickets: number;
  totalRevenue: number;
  pendingEventsCount: number;
  recentUsers: User[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_suspended: boolean;
  created_at: string;
}

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

type TabType = "overview" | "approvals" | "users";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  
  // Pending events state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, eventsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/events/admin/pending").catch(() => ({ data: [] })) // Fallback if it fails so stats still load
      ]);
      setStats(statsRes.data);
      setPendingEvents(eventsRes.data);
    } catch (error) {
      console.error("Failed to fetch admin data", error);
      toast.error("Failed to load admin dashboard. You may not have access.");
    } finally {
      setLoading(false);
    }
  };

  const refreshPendingEvents = async () => {
    try {
      const res = await api.get("/events/admin/pending");
      setPendingEvents(res.data);
      // Update stats count as well
      setStats(prev => prev ? { ...prev, pendingEventsCount: res.data.length } : prev);
    } catch (error) {
      // Error handled
    }
  };

  const toggleSuspension = async (userId: string, isSuspended: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/suspend`);
      toast.success(`User ${isSuspended ? "unsuspended" : "suspended"} successfully`);
      fetchData();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const handleApproveEvent = async (id: string) => {
    try {
      await api.put(`/events/${id}/approve`);
      toast.success("Event approved successfully!");
      refreshPendingEvents();
    } catch (error) {
      toast.error("Failed to approve event.");
    }
  };

  const handleRejectEvent = async (id: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    try {
      await api.put(`/events/${id}/reject`, { rejectionReason });
      toast.success("Event rejected.");
      setRejectingId(null);
      setRejectionReason("");
      refreshPendingEvents();
    } catch (error) {
      toast.error("Failed to reject event.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-red-600 font-bold text-xl">
        Access Denied. Administrator privileges required.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen pt-28">
      <Toaster position="top-right" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
          <p className="text-gray-500 mt-1">Manage platform activity, users, and event approvals.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200 mb-8 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "overview" 
              ? "border-primary text-primary" 
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Overview & Stats
        </button>
        <button
          onClick={() => setActiveTab("approvals")}
          className={`flex items-center px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "approvals" 
              ? "border-primary text-primary" 
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <ClipboardList className="w-4 h-4 mr-2" />
          Pending Approvals
          {stats.pendingEventsCount > 0 && (
            <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
              {stats.pendingEventsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "users" 
              ? "border-primary text-primary" 
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          User Management
        </button>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div>
            {stats.pendingEventsCount > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-xl shadow-sm mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-yellow-800">Pending Approvals Required</h2>
                  <p className="text-yellow-700 mt-1">
                    There are <strong>{stats.pendingEventsCount}</strong> events awaiting your moderation.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab("approvals")}
                  className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-colors whitespace-nowrap"
                >
                  <ClipboardList size={20} />
                  Review Events
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Platform Revenue" value={`₦${stats.totalRevenue.toLocaleString()}`} color="text-green-600" />
              <StatCard title="Total Users" value={stats.totalUsers.toString()} />
              <StatCard title="Total Events" value={stats.totalEvents.toString()} />
              <StatCard title="Total Tickets Sold" value={stats.totalTickets.toString()} />
            </div>
          </div>
        )}

        {/* APPROVALS TAB */}
        {activeTab === "approvals" && (
          <div>
            {pendingEvents.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-100">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">All Caught Up!</h3>
                <p className="mt-2 text-gray-500">There are no pending events to approve right now.</p>
              </div>
            ) : (
              <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {pendingEvents.map((event) => (
                    <li key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-3 mb-2">
                            <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
                            <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-md">
                              {event.category}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-6 text-sm text-gray-600">
                            <p><strong>Organizer:</strong> {event.organizer.name} <span className="text-gray-400">({event.organizer.department})</span></p>
                            <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                            <p><strong>Location:</strong> {event.location}</p>
                            <p><strong>Submitted:</strong> {new Date(event.submittedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                          <Link
                            href={`/events/${event.id}`}
                            target="_blank"
                            className="inline-flex items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
                          >
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </Link>
                          
                          {rejectingId === event.id ? (
                            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 p-3 bg-red-50 rounded-lg border border-red-100">
                              <input
                                type="text"
                                placeholder="Reason for rejection..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="px-3 py-2 bg-white border border-red-200 rounded-md shadow-sm text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 w-full sm:w-48"
                              />
                              <button
                                onClick={() => handleRejectEvent(event.id)}
                                className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 whitespace-nowrap"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingId(null);
                                  setRejectionReason("");
                                }}
                                className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 whitespace-nowrap"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleApproveEvent(event.id)}
                                className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors whitespace-nowrap"
                              >
                                <Check className="h-4 w-4 mr-2" /> Approve
                              </button>
                              <button
                                onClick={() => setRejectingId(event.id)}
                                className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-red-600 bg-red-100 hover:bg-red-200 transition-colors whitespace-nowrap"
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
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Platform Users</h2>
              <span className="text-sm text-gray-500">Showing recent registered users</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{u.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-md ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'ORGANIZER' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {u.is_suspended ? (
                          <span className="inline-flex items-center text-red-600 font-semibold bg-red-50 px-2.5 py-1 rounded-md">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-1.5"></span>
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-green-600 font-semibold bg-green-50 px-2.5 py-1 rounded-md">
                            <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1.5"></span>
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => toggleSuspension(u.id, u.is_suspended)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${
                              u.is_suspended 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {stats.recentUsers.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No users found on the platform.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, color = "text-gray-900" }: { title: string; value: string; color?: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
      <p className={`mt-3 text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}
