"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { ArrowLeft, Calendar, MapPin, Tag, Users, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import ImageGalleryManager from "@/components/ImageGalleryManager";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [initialImages, setInitialImages] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    price: "",
    capacity: "",
    category: "General",
    is_cancelled: false
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

    // Fetch existing event
    const fetchEvent = async () => {
      try {
        const { data } = await api.get(`/events/${eventId}`);
        
        // Format date for the datetime-local input (YYYY-MM-DDThh:mm)
        const eventDate = new Date(data.date);
        const formattedDate = eventDate.toISOString().slice(0, 16);

        setFormData({
          title: data.title,
          description: data.description,
          date: formattedDate,
          location: data.location,
          price: data.price.toString(),
          capacity: data.capacity.toString(),
          category: data.category || "General",
          is_cancelled: data.is_cancelled
        });

        // Setup gallery images
        if (data.images && data.images.length > 0) {
          setInitialImages(data.images);
        } else if (data.image_url) {
          // Fallback if the event has a legacy single image
          setInitialImages([{
            id: 'legacy-cover',
            image_url: data.image_url,
            is_cover: true,
            position: 0
          }]);
        }

      } catch (err) {
        console.error("Failed to fetch event", err);
        setError("Could not load event data.");
      } finally {
        setFetching(false);
      }
    };

    fetchEvent();
  }, [router, eventId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Send regular JSON data for the event details update
      await api.put(`/events/${eventId}`, formData);
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/events");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to update event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh]">
        <Loader2 className="animate-spin text-primary" size={64} />
      </div>
    );
  }

  return (
    <div className="flex-1 container mx-auto px-6 py-32 max-w-4xl">
      <Link href="/dashboard/events" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8">
        <ArrowLeft size={20} /> Back to My Events
      </Link>

      <div className="glass-panel p-8 md:p-12 rounded-3xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold mb-3">Edit Event</h1>
          <p className="text-text-muted">Update the details of your event below.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-8">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-8 rounded-xl mb-8 text-center">
            <h3 className="text-2xl font-bold mb-2">Success!</h3>
            <p>Your event has been updated. Redirecting back...</p>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Image Gallery Manager Section */}
            <div className="bg-surface/30 border border-white/5 p-6 rounded-2xl">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">Event Images</h3>
                <p className="text-sm text-text-muted">Drag to reorder. The cover image is displayed in search results.</p>
              </div>
              <ImageGalleryManager eventId={eventId} initialImages={initialImages} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
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

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-surface/50 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main appearance-none"
                  >
                    <option value="General" className="bg-surface text-text-main">General</option>
                    <option value="Technology" className="bg-surface text-text-main">Technology</option>
                    <option value="Music" className="bg-surface text-text-main">Music</option>
                    <option value="Sports" className="bg-surface text-text-main">Sports</option>
                    <option value="Arts" className="bg-surface text-text-main">Arts</option>
                    <option value="Business" className="bg-surface text-text-main">Business</option>
                    <option value="Education" className="bg-surface text-text-main">Education</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-surface p-4 rounded-xl border border-[var(--glass-border)] mt-6">
                <input
                  type="checkbox"
                  id="is_cancelled"
                  name="is_cancelled"
                  checked={formData.is_cancelled}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-white/20 bg-surface text-primary focus:ring-primary/50"
                />
                <label htmlFor="is_cancelled" className="font-medium">
                  Cancel this event
                  <span className="block text-xs text-text-muted font-normal">This will hide the event and mark it as cancelled for existing attendees.</span>
                </label>
              </div>

              <div className="pt-8 flex gap-4">
                <Link href="/dashboard/events" className="flex-1 py-4 text-center rounded-xl bg-surface hover:bg-surface-light font-medium transition-colors">
                  Cancel
                </Link>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : null}
                  {loading ? "Saving Changes..." : "Save Details"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
