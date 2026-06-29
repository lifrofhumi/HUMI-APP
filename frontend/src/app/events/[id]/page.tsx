"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { format } from "date-fns";
import { Calendar, MapPin, Users, ArrowLeft, Loader2, CheckCircle, Plus, Minus, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

export default function EventDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data } = await api.get(`/events/${id}`);
        setEvent(data);
      } catch (err) {
        console.error("Failed to fetch event details", err);
        setError("Event not found");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handlePurchase = async () => {
    const token = localStorage.getItem("humi_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    setPurchasing(true);
    setError("");
    
    try {
      const res = await api.post("/tickets/purchase", { event_id: id, quantity });
      if (res.data.authorization_url) {
        window.location.href = res.data.authorization_url;
      } else {
        setPurchaseSuccess(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to purchase ticket");
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{error}</h2>
          <Link href="/events" className="text-primary hover:underline">Return to Events</Link>
        </div>
      </div>
    );
  }

  // Construct images array with fallback for backwards compatibility
  const images = event?.images?.length > 0 
    ? event.images.map((img: any) => ({ src: img.image_url, id: img.id }))
    : event?.image_url 
      ? [{ src: event.image_url, id: "fallback" }] 
      : [];

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="flex-1 container mx-auto px-6 py-32">
      <Link href="/events" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8">
        <ArrowLeft size={20} /> Back to Events
      </Link>
      
      <div className="grid md:grid-cols-3 gap-12">
        <div className="md:col-span-2 space-y-8">
          
          {/* Main Cover Image */}
          <div 
            className="rounded-3xl overflow-hidden glass-panel aspect-video relative cursor-pointer group"
            onClick={() => images.length > 0 && openLightbox(0)}
          >
             {images.length > 0 ? (
               <>
                 <img src={images[0].src} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <div className="bg-black/60 text-white px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2">
                     <ImageIcon size={18} /> View Gallery
                   </div>
                 </div>
               </>
             ) : (
               <div className="w-full h-full flex items-center justify-center text-text-muted bg-surface">
                 Event Image
               </div>
             )}
          </div>

          {/* Thumbnail Gallery Strip */}
          {images.length > 1 && (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {images.map((img: any, index: number) => (
                <div 
                  key={img.id}
                  onClick={() => openLightbox(index)}
                  className="aspect-square rounded-xl overflow-hidden cursor-pointer relative group border border-white/10 hover:border-primary/50 transition-colors"
                >
                  <img src={img.src} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" alt="Thumbnail" />
                  {index === 0 && (
                    <div className="absolute top-1 right-1 bg-primary text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                      COVER
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div>
            <h1 className="text-4xl font-extrabold mb-4">{event.title}</h1>
            <p className="text-text-muted whitespace-pre-line leading-relaxed text-lg">
              {event.description}
            </p>
          </div>
        </div>
        
        <div>
          <div className="glass-panel p-8 rounded-3xl sticky top-32">
            <h3 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">Event Details</h3>
            
            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="font-medium text-white">{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</p>
                  <p className="text-text-muted text-sm">{format(new Date(event.date), "h:mm a")}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="font-medium text-white">{event.location}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Users size={24} />
                </div>
                <div>
                  <p className="font-medium text-white">{event.capacity} Capacity</p>
                  <p className="text-text-muted text-sm">Organized by {event.organizer?.name || "Unknown"}</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-6">
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Ticket Price</span>
                  <span className="text-xl font-bold text-white">{event.price > 0 ? `₦${event.price.toLocaleString()}` : "Free"}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Quantity</span>
                  <div className="flex items-center gap-4 bg-surface rounded-xl p-1 border border-white/5">
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || purchasing}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white disabled:opacity-50 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-semibold">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(q => Math.min(event.capacity - (event._count?.tickets || 0), q + 1))}
                      disabled={quantity >= (event.capacity - (event._count?.tickets || 0)) || purchasing}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white disabled:opacity-50 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <span className="text-lg font-medium text-white">Total Amount</span>
                  <span className="text-3xl font-bold text-primary">{event.price > 0 ? `₦${(event.price * quantity).toLocaleString()}` : "Free"}</span>
                </div>
              </div>
              
              {error && <div className="text-red-400 text-sm mb-4 bg-red-500/10 p-3 rounded-lg">{error}</div>}
              
              {purchaseSuccess ? (
                <div className="bg-green-500/20 text-green-400 p-4 rounded-xl flex items-center gap-3 justify-center border border-green-500/30">
                  <CheckCircle size={20} />
                  <span className="font-medium">Ticket Purchased!</span>
                </div>
              ) : (
                <button 
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full py-4 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-xl font-semibold transition-all flex items-center justify-center disabled:opacity-50 text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1"
                >
                  {purchasing ? <Loader2 className="animate-spin" size={24} /> : "Get Ticket"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={images}
        plugins={[Thumbnails, Zoom]}
        zoom={{ scrollToZoom: true, maxZoomPixelRatio: 3 }}
      />
    </div>
  );
}
