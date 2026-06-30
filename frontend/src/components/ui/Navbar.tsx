"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, ChevronDown, LogOut, Settings, Ticket, LayoutDashboard, Bell, Check, Menu, X, Calendar, Shield, Info } from 'lucide-react';
import api from '@/lib/api';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = () => {
    const userData = localStorage.getItem("humi_user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      setUser(null);
      setNotifications([]);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, pathname]);

  const markNotificationsAsRead = async () => {
    try {
      await api.patch('/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark read", error);
    }
  };

  useEffect(() => {
    // Initial check
    checkAuth();

    // Listen for custom auth events within the same tab
    window.addEventListener("authChange", checkAuth);
    // Listen for storage events across tabs
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("authChange", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  useEffect(() => {
    // Click outside to close dropdowns
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("humi_token");
    localStorage.removeItem("humi_user");
    window.dispatchEvent(new Event("authChange"));
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    router.push("/auth/login");
  };

  return (
    <nav className="fixed w-full z-50 glass-panel border-b border-white/10">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 md:gap-3 relative z-10 cursor-pointer">
          <span className="text-xl md:text-2xl font-black tracking-tighter">HUMI<span className="text-primary">.</span></span>
          <img src="/logo.png" alt="HUMI Logo" className="h-8 md:h-14 w-auto" />
        </Link>
        
        {/* Nav Items Container */}
        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/events" className="hover:text-primary transition-colors">Events</Link>
            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
          
          <div className="h-4 w-[1px] bg-white/20" />
          
          {user ? (
            <div className="flex items-center gap-6">
              


              {/* User Menu */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen);
                    setIsNotificationsOpen(false);
                  }}
                  className="flex items-center gap-2 hover:text-primary transition-colors focus:outline-none"
                >
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center border border-primary/30 overflow-hidden">
                  {user.profile_picture_url ? (
                    <img src={user.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} />
                  )}
                </div>
                <span className="font-semibold">{user.name.split(' ')[0]}</span>
                <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-4 w-56 glass-panel border border-[var(--glass-border)] rounded-2xl shadow-xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-[var(--glass-border)] mb-1">
                    <p className="text-sm font-semibold truncate text-text-main">{user.name}</p>
                    <p className="text-xs text-text-muted truncate">{user.email}</p>
                  </div>
                  
                  <Link 
                    href="/profile" 
                    className="flex items-center gap-3 px-4 py-2 hover:bg-surface transition-colors w-full text-left text-sm text-text-main"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <User size={16} className="text-text-muted" /> Profile
                  </Link>
                  
                  {user.role === 'ADMIN' && (
                    <Link 
                      href="/admin" 
                      className="flex items-center gap-3 px-4 py-2 hover:bg-surface transition-colors w-full text-left text-sm text-text-main"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Shield size={16} className="text-primary" /> Admin Panel
                    </Link>
                  )}
                  
                  <Link 
                    href="/dashboard" 
                    className="flex items-center gap-3 px-4 py-2 hover:bg-surface transition-colors w-full text-left text-sm text-text-main"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <LayoutDashboard size={16} className="text-text-muted" /> Dashboard
                  </Link>

                  <Link 
                    href="/dashboard#tickets" 
                    className="flex items-center gap-3 px-4 py-2 hover:bg-surface transition-colors w-full text-left text-sm text-text-main"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Ticket size={16} className="text-text-muted" /> My Tickets
                  </Link>

                  <Link 
                    href="/settings" 
                    className="flex items-center gap-3 px-4 py-2 hover:bg-surface transition-colors w-full text-left text-sm text-text-main"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Settings size={16} className="text-text-muted" /> Settings
                  </Link>

                  <div className="h-[1px] bg-[var(--glass-border)] my-1" />

                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-red-500/10 text-red-500 transition-colors w-full text-left text-sm"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="hover:text-primary transition-colors">Log In</Link>
              <Link href="/auth/register" className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-full transition-all">
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Notifications and Mobile Toggle Container */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsDropdownOpen(false);
                }}
                className="relative p-2 hover:bg-surface rounded-full transition-colors focus:outline-none text-text-muted hover:text-primary"
              >
                <Bell size={20} />
                {notifications.some(n => !n.is_read) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-4 w-[85vw] sm:w-80 max-w-[360px] glass-panel border border-[var(--glass-border)] rounded-2xl shadow-xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                  <div className="px-4 py-3 border-b border-[var(--glass-border)] flex justify-between items-center">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {notifications.some(n => !n.is_read) && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationsAsRead();
                        }}
                        className="text-xs text-primary hover:text-primary-light transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-text-muted text-sm">No new notifications</div>
                    ) : (
                      notifications.map(n => {
                        let link = "#";
                        
                        if (user?.role === 'ADMIN' && n.message.includes('submitted for approval')) {
                          link = "/admin/events";
                        } else if (user?.role === 'ORGANIZER' && (n.message.includes('approved') || n.message.includes('rejected'))) {
                          link = "/dashboard";
                        }

                        return (
                          <div 
                            key={n.id} 
                            onClick={async () => {
                              setIsNotificationsOpen(false);
                              if (!n.is_read) {
                                try {
                                  await api.patch(`/notifications/${n.id}/read`);
                                  setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, is_read: true } : notif));
                                } catch (e) {}
                              }
                              if (link !== "#") router.push(link);
                            }}
                            className={`group relative px-4 py-3 border-b border-[var(--glass-border)] last:border-0 hover:bg-surface transition-colors cursor-pointer pr-10 ${!n.is_read ? 'bg-primary/5' : ''}`}
                          >
                            <div className="flex gap-3">
                              {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(var(--primary),0.8)]" title="Unread" />}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-relaxed break-words whitespace-normal ${!n.is_read ? 'text-text-main font-medium' : 'text-text-muted'}`}>{n.message}</p>
                                <p className="text-xs text-text-muted mt-2">{new Date(n.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                            
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await api.delete(`/notifications/${n.id}`);
                                  setNotifications(prev => prev.filter(notif => notif.id !== n.id));
                                } catch (error) {
                                  console.error("Failed to delete notification", error);
                                }
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-all"
                              title="Delete notification"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Toggle Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="p-2 text-text-muted hover:text-primary transition-colors focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full glass-panel border-b border-[var(--glass-border)] shadow-xl animate-in fade-in slide-in-from-top-2 flex flex-col pb-6 px-6 max-h-[calc(100vh-80px)] overflow-y-auto">
          {user ? (
            <div className="flex flex-col mt-4 gap-2">
              <div className="flex items-center gap-3 py-2 border-b border-white/10 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center border border-primary/30 overflow-hidden">
                  {user.profile_picture_url ? (
                    <img src={user.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
                <div>
                  <p className="font-medium text-text-main">{user.name}</p>
                  <p className="text-xs text-text-muted">{user.role}</p>
                </div>
              </div>

              <Link href="/profile" className="flex items-center gap-3 py-3 text-text-main hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                <User size={18} className="text-text-muted" /> Profile
              </Link>
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="flex items-center gap-3 py-3 text-text-main hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  <Shield size={18} className="text-primary" /> Admin Panel
                </Link>
              )}
              <Link href="/events" className="flex items-center gap-3 py-3 text-text-main hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                <Calendar size={18} className="text-text-muted" /> Events
              </Link>
              <Link href="/about" className="flex items-center gap-3 py-3 text-text-main hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                <Info size={18} className="text-text-muted" /> About
              </Link>
              <Link href="/dashboard" className="flex items-center gap-3 py-3 text-text-main hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                <LayoutDashboard size={18} className="text-text-muted" /> Dashboard
              </Link>
              <Link href="/dashboard#tickets" className="flex items-center gap-3 py-3 text-text-main hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                <Ticket size={18} className="text-text-muted" /> My Tickets
              </Link>
              


              <Link href="/settings" className="flex items-center gap-3 py-3 text-text-main hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                <Settings size={18} className="text-text-muted" /> Settings
              </Link>

              <div className="h-[1px] bg-[var(--glass-border)] my-2" />

              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 py-3 text-red-500 hover:text-red-400 transition-colors w-full text-left"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 mt-6">
              <Link 
                href="/auth/login" 
                className="w-full py-3 text-center rounded-xl border border-[var(--glass-border)] text-text-main font-medium hover:bg-surface transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Log In
              </Link>
              <Link 
                href="/auth/register" 
                className="w-full py-3 text-center rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
