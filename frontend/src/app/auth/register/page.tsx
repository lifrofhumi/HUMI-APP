"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { User, Mail, Lock, Loader2, Shield, Hash } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [matricNumber, setMatricNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
        role,
        matricNumber,
      });

      // Auto login after register or just redirect to login
      router.push("/auth/login");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth || !googleProvider) {
      setError("Google Sign-In is not configured yet.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const response = await api.post("/auth/google", { idToken });
      
      if (response.data.token) {
        localStorage.setItem("humi_token", response.data.token);
        localStorage.setItem("humi_user", JSON.stringify(response.data.user));
        window.dispatchEvent(new Event("authChange"));
        
        if (!response.data.user.profileCompleted) {
          router.push("/profile/complete");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Google sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 mt-20">
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Create Account</h2>
          <p className="text-text-muted">Join HUMI to manage and attend events</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-white/30"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-white/30"
                placeholder="you@university.edu"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-white/30"
                placeholder="••••••••"
              />
            </div>
          </div>

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
                className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-white/30"
                placeholder="240591092"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">I am a...</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Shield size={18} />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white appearance-none"
              >
                <option value="STUDENT" className="bg-surface">Student</option>
                <option value="ORGANIZER" className="bg-surface">Event Organizer</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors flex items-center justify-center mt-4 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign Up"}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface text-text-muted">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-white/10 rounded-xl bg-surface/50 hover:bg-white/5 text-white font-medium transition-colors disabled:opacity-70"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-text-muted">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:text-primary-dark font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
