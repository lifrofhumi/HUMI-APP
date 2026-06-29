"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { ArrowLeft, UploadCloud, Calendar, MapPin, Tag, Users, Loader2, X } from "lucide-react";

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    price: "",
    capacity: "",
    category: "General",
  });

  useEffect(() => {
    // Check if user is organizer
    const userData = localStorage.getItem("humi_user");
    if (!userData) {
      router.push("/auth/login");
      return;
    }
    const user = JSON.parse(userData);
    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    // Handle duplication
    const isDuplicate = window.location.search.includes("duplicate=true");
    if (isDuplicate) {
      const stored = sessionStorage.getItem("humi_duplicate_event");
      if (stored) {
        setFormData((prev) => ({ ...prev, ...JSON.parse(stored) }));
        sessionStorage.removeItem("humi_duplicate_event");
      }
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 10 - imageFiles.length); // Limit to 10
    setImageFiles(prev => [...prev, ...newFiles]);
    
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      // Free memory
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });

      imageFiles.forEach(file => {
        submitData.append("images", file);
      });

      await api.post("/events", submitData);
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 container mx-auto px-4 py-24 max-w-2xl">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8">
        <ArrowLeft size={20} /> Back to Dashboard
      </Link>

      <div className="glass-panel p-6 md:p-8 rounded-3xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold mb-3">Create New Event</h1>
          <p className="text-text-muted">Fill in the details to publish your event to the campus.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-8">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-8 rounded-xl mb-8 text-center">
            <h3 className="text-2xl font-bold mb-2">Success!</h3>
            <p>Your event has been created. Redirecting to dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Multiple Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-3">Event Images (Up to 10)</label>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="aspect-square rounded-2xl relative overflow-hidden group border border-[var(--glass-border)]">
                    <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-primary text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                        COVER
                      </div>
                    )}
                  </div>
                ))}

                {imageFiles.length < 10 && (
                  <div className="aspect-square rounded-2xl border-2 border-dashed border-white/20 hover:border-primary/50 transition-colors bg-surface/30 relative flex flex-col items-center justify-center p-4 text-center cursor-pointer group">
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <UploadCloud size={32} className="mb-2 text-text-muted group-hover:text-primary transition-colors" />
                    <span className="font-medium text-sm text-text-muted group-hover:text-white transition-colors">Add Images</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium">Event Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface/50 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
                  placeholder="e.g. Annual Tech Symposium 2026"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface/50 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main resize-none"
                  placeholder="Describe your event..."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Date & Time</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <Calendar size={18} />
                  </div>
                  <input
                    type="datetime-local"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Location</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <MapPin size={18} />
                  </div>
                  <input
                    type="text"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
                    placeholder="e.g. Main Auditorium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Category</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <Tag size={18} />
                  </div>
                  <select
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange as any}
                    className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main appearance-none"
                  >
                    <option value="General">General</option>
                    <option value="Sports">Sports</option>
                    <option value="Music">Music</option>
                    <option value="Technology">Technology</option>
                    <option value="Arts">Arts</option>
                    <option value="Academic">Academic</option>
                    <option value="Social">Social</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Ticket Price (₦)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <Tag size={18} />
                  </div>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
                    placeholder="0.00 for free"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Capacity</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <Users size={18} />
                  </div>
                  <input
                    type="number"
                    name="capacity"
                    min="1"
                    required
                    value={formData.capacity}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
                    placeholder="e.g. 500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--glass-border)] flex justify-end gap-4">
              <Link 
                href="/dashboard"
                className="px-6 py-3 bg-surface hover:bg-surface/80 text-white rounded-xl font-medium transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Publish Event"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
