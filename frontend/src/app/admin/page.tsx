"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast, Toaster } from "react-hot-toast";
import Link from "next/link";
import { ClipboardList } from "lucide-react";

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

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (error) {
      console.error("Failed to fetch admin stats", error);
      toast.error("Failed to load admin statistics. You may not have access.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSuspension = async (userId: string, isSuspended: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/suspend`);
      toast.success(`User ${isSuspended ? "unsuspended" : "suspended"} successfully`);
      fetchStats();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
      </div>

      {stats.pendingEventsCount > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-xl shadow-sm mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-yellow-800">Pending Approvals Required</h2>
            <p className="text-yellow-700 mt-1">
              There are <strong>{stats.pendingEventsCount}</strong> events awaiting your moderation.
            </p>
          </div>
          <Link 
            href="/admin/events" 
            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-colors"
          >
            <ClipboardList size={20} />
            Review Events Now
          </Link>
        </div>
      )}

      {stats.pendingEventsCount === 0 && (
        <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-xl shadow-sm mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-green-800">All Caught Up!</h2>
            <p className="text-green-700 mt-1">There are no pending events to approve right now.</p>
          </div>
          <Link 
            href="/admin/events" 
            className="flex items-center gap-2 bg-white border border-green-600 text-green-700 hover:bg-green-50 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <ClipboardList size={18} />
            View Empty Queue
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Platform Revenue" value={`₦${stats.totalRevenue.toLocaleString()}`} color="text-green-600" />
        <StatCard title="Total Users" value={stats.totalUsers.toString()} />
        <StatCard title="Total Events" value={stats.totalEvents.toString()} />
        <StatCard title="Total Tickets Sold" value={stats.totalTickets.toString()} />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.recentUsers.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                      u.role === 'ORGANIZER' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {u.is_suspended ? (
                      <span className="text-red-600 font-semibold">Suspended</span>
                    ) : (
                      <span className="text-green-600 font-semibold">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => toggleSuspension(u.id, u.is_suspended)}
                        className={`px-3 py-1 text-xs font-medium rounded-md text-white ${
                          u.is_suspended ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
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
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color = "text-gray-900" }: { title: string; value: string; color?: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
