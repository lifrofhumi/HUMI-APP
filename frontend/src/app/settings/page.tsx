"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import toast from 'react-hot-toast';
import { Palette, Bell, Shield, Save } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState('dark');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("humi_user");
    if (!userData) {
      router.push('/auth/login');
      return;
    }
    setUser(JSON.parse(userData));
    
    // Load saved settings if any
    const savedTheme = localStorage.getItem("humi_theme") || 'dark';
    setTheme(savedTheme);
  }, [router]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("humi_theme", theme);
    
    // Apply theme
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else if (theme === 'dark') {
      document.documentElement.classList.remove('light');
    } else {
      // system default
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }
    
    toast.success('Settings saved successfully');
  };

  if (!user) return <div className="min-h-screen pt-24 bg-background"></div>;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-32 pb-20 px-6 container mx-auto max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">Account Settings</h1>
        
        <div className="glass-panel border border-white/10 rounded-3xl p-8">
          <form onSubmit={handleSaveSettings} className="space-y-8">
            
            {/* Theme Settings */}
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
                <Palette className="text-primary" size={20} /> Appearance
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div>
                    <h3 className="font-medium">Theme</h3>
                    <p className="text-sm text-text-muted">Select your preferred app theme</p>
                  </div>
                  <select 
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="bg-surface border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                  >
                    <option value="dark">Dark Theme</option>
                    <option value="light">Light Theme</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-white/10" />

            {/* Notification Settings */}
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
                <Bell className="text-primary" size={20} /> Notifications
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-text-muted">Receive emails about your tickets and events</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div>
                    <h3 className="font-medium">In-App Notifications</h3>
                    <p className="text-sm text-text-muted">Receive alerts inside the application</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={pushNotifications} onChange={() => setPushNotifications(!pushNotifications)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-white/10" />

            {/* Security Settings */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="text-primary" size={20} /> Security
              </h2>
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <button type="button" className="text-primary hover:text-primary-dark font-medium transition-colors">
                  Change Password
                </button>
                <p className="text-sm text-text-muted mt-1">Update the password used for your account</p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-full font-medium transition-all"
              >
                <Save size={18} /> Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
