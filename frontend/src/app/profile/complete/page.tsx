"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Hash, Phone, Loader2, BookOpen, GraduationCap } from "lucide-react";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [matricNumber, setMatricNumber] = useState("");
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("100");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Basic protection to ensure we're logged in
    const token = localStorage.getItem("humi_token");
    if (!token) {
      router.push("/auth/login");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/complete-profile", {
        matricNumber,
        faculty,
        department,
        level,
        phone,
      });

      if (response.data.success) {
        // Update user state
        const currentUserStr = localStorage.getItem("humi_user");
        if (currentUserStr) {
          const currentUser = JSON.parse(currentUserStr);
          currentUser.profileCompleted = true;
          localStorage.setItem("humi_user", JSON.stringify(currentUser));
          window.dispatchEvent(new Event("authChange"));
        }
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to complete profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 mt-20">
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Complete Your Profile</h2>
          <p className="text-text-muted">We need a few more details before you can continue</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Matric Number (9 Digits)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Hash size={18} />
              </div>
              <input
                type="text"
                required
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value)}
                pattern="^(22|23|24|25|26)\d{7}$"
                title="Must be a 9-digit number starting with 22, 23, 24, 25, or 26"
                className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main placeholder-white/30"
                placeholder="240591092"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Faculty</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <BookOpen size={18} />
              </div>
              <input
                type="text"
                required
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main placeholder-white/30"
                placeholder="Science"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Department</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <GraduationCap size={18} />
              </div>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main placeholder-white/30"
                placeholder="Computer Science"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-4 py-3 bg-surface/50 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main appearance-none"
              >
                <option value="100" className="bg-surface">100 Level</option>
                <option value="200" className="bg-surface">200 Level</option>
                <option value="300" className="bg-surface">300 Level</option>
                <option value="400" className="bg-surface">400 Level</option>
                <option value="500" className="bg-surface">500 Level</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main placeholder-white/30"
                  placeholder="08012345678"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors flex items-center justify-center mt-4 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Complete Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
