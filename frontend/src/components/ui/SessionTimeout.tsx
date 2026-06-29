"use client";

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

export default function SessionTimeout() {
  const router = useRouter();
  const pathname = usePathname();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

  const handleLogout = () => {
    localStorage.removeItem("humi_token");
    localStorage.removeItem("humi_user");
    localStorage.removeItem("humi_last_activity");
    window.dispatchEvent(new Event("authChange"));
    toast.error('Session expired due to inactivity. Please log in again.', { duration: 5000 });
    router.push('/auth/login');
  };

  useEffect(() => {
    const token = localStorage.getItem("humi_token");
    if (!token) return;

    // Initialize last activity if missing
    if (!localStorage.getItem("humi_last_activity")) {
      localStorage.setItem("humi_last_activity", Date.now().toString());
    }

    const checkActivity = () => {
      const token = localStorage.getItem("humi_token");
      if (!token) return; // If logged out from another tab, do nothing
      
      const lastActivityStr = localStorage.getItem("humi_last_activity");
      if (!lastActivityStr) return;
      
      const lastActivity = parseInt(lastActivityStr, 10);
      if (Date.now() - lastActivity > TIMEOUT_MS) {
        handleLogout();
      }
    };

    // Check every minute
    intervalRef.current = setInterval(checkActivity, 60 * 1000);

    const handleActivity = () => {
      const now = Date.now();
      // Throttle localStorage updates to max once every 5 seconds
      if (now - lastUpdateRef.current > 5000) {
        localStorage.setItem("humi_last_activity", now.toString());
        lastUpdateRef.current = now;
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, handleActivity, { passive: true }));

    // Run a check right away in case we just loaded a tab after 30 mins
    checkActivity();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      events.forEach(event => document.removeEventListener(event, handleActivity));
    };
  }, [pathname, router]);

  return null;
}
