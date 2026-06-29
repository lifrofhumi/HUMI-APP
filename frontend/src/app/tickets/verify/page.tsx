"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { Loader2, CheckCircle, XCircle, Download, Printer, MapPin, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import * as htmlToImage from "html-to-image";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  useEffect(() => {
    const reference = searchParams.get("reference");

    if (!reference) {
      setStatus("error");
      setErrorMessage("No payment reference found.");
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await api.post("/tickets/verify", { reference });
        setTickets(res.data.tickets || []);
        setStatus("success");
      } catch (err: any) {
        console.error("Verification failed:", err);
        setStatus("error");
        setErrorMessage(err.response?.data?.error || "Payment verification failed.");
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="text-center space-y-6">
        <Loader2 className="animate-spin text-primary mx-auto" size={64} />
        <h2 className="text-2xl font-bold">Verifying Payment...</h2>
        <p className="text-text-muted">Please do not close this page.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center space-y-6 bg-red-500/10 border border-red-500/30 p-12 rounded-3xl max-w-lg mx-auto">
        <XCircle className="text-red-500 mx-auto" size={64} />
        <h2 className="text-2xl font-bold text-red-400">Verification Failed</h2>
        <p className="text-white/80">{errorMessage}</p>
        <div className="pt-6">
          <Link href="/events" className="px-6 py-3 bg-surface hover:bg-surface/80 text-white rounded-xl font-medium transition-colors inline-block">
            Return to Events
          </Link>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) return null;

  const eventDate = new Date(tickets[0].event.date);

  const downloadTickets = async () => {
    try {
      setDownloading(true);
      // Generate for the first ticket for simplicity if multiple, or all if we want to loop
      // But typically users want to download one by one, or we just show the first one
      const t = tickets[0];
      const element = document.getElementById(`ticket-${t.id}`);
      if (element) {
        // Temporarily adjust styles for better canvas render if needed
        const originalTransform = element.style.transform;
        element.style.transform = "none";
        
        const dataUrl = await htmlToImage.toPng(element, { 
          pixelRatio: 2, 
          backgroundColor: "#121212",
        });
        
        element.style.transform = originalTransform;
        
        setGeneratedImage(dataUrl);
      }
    } catch (err: any) {
      console.error("Failed to generate ticket:", err);
      alert("Failed to generate ticket image: " + (err.message || "Unknown error"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Hide on print */}
      <div className="text-center space-y-4 mb-8 print:hidden">
        <CheckCircle className="text-green-500 mx-auto" size={64} />
        <h2 className="text-3xl font-bold text-green-400">Payment Successful!</h2>
        <p className="text-white/80">{tickets.length > 1 ? `Your ${tickets.length} tickets have been generated.` : 'Your ticket has been generated.'} You can print them or save as PDF.</p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button 
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 bg-surface hover:bg-surface/80 text-white rounded-xl font-medium transition-colors hidden sm:flex"
          >
            <Printer size={20} />
            Print Ticket
          </button>
          <button 
            type="button"
            onClick={downloadTickets}
            disabled={downloading}
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {downloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
            {downloading ? "Generating..." : "Download Ticket"}
          </button>
          <Link href="/dashboard" className="w-full sm:w-auto text-center px-6 py-3 bg-surface hover:bg-surface/80 text-white rounded-xl font-medium transition-colors">
            Go to Dashboard
          </Link>
        </div>
      </div>

        <div className="flex flex-col gap-8">
          {tickets.map((t, index) => (
            <div id={`ticket-${t.id}`} key={t.id} className="bg-surface rounded-3xl overflow-hidden border border-white/10 shadow-2xl print:shadow-none print:border-black/20 print:bg-white print:text-black mb-8 print:break-inside-avoid">
              {/* Banner */}
              <div className="h-48 w-full relative bg-surface-light">
                {t.event.image_url ? (
                  <Image 
                    src={t.event.image_url} 
                    alt={t.event.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/40 to-secondary/40">
                    <span className="text-4xl font-bold text-white/50">{t.event.title.substring(0, 2).toUpperCase()}</span>
                  </div>
                )}
              </div>

              <div className="p-8 md:p-12 flex flex-col md:flex-row gap-12 items-center md:items-start justify-between">
                <div className="space-y-6 flex-1 w-full">
                  <div>
                    <span className="text-primary font-medium text-sm tracking-wider uppercase print:text-black">Admit One {tickets.length > 1 ? `(${index + 1} of ${tickets.length})` : ''}</span>
                    <h1 className="text-3xl font-bold mt-1 mb-2 print:text-black">{t.event.title}</h1>
                    <p className="text-text-muted print:text-gray-600">Organized by {t.event.organizer?.name || "Unknown"}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <Calendar className="text-primary mt-1 print:text-black" size={20} />
                      <div>
                        <p className="font-semibold print:text-black">{eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        <p className="text-sm text-text-muted print:text-gray-600">{eventDate.toLocaleDateString('en-US', { year: 'numeric' })}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Clock className="text-primary mt-1 print:text-black" size={20} />
                      <div>
                        <p className="font-semibold print:text-black">{eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                        <p className="text-sm text-text-muted print:text-gray-600">Promptly</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 md:col-span-2">
                      <MapPin className="text-primary mt-1 print:text-black" size={20} />
                      <div>
                        <p className="font-semibold print:text-black">{t.event.location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10 print:border-black/10 mt-6 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-text-muted print:text-gray-500 uppercase tracking-wider">Ticket ID</p>
                      <p className="font-mono text-sm print:text-black">{t.id.split('-')[0].toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted print:text-gray-500 uppercase tracking-wider">Amount Paid</p>
                      <p className="font-semibold print:text-black">{t.event.price === 0 ? "FREE" : `₦${t.event.price.toLocaleString()}`}</p>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-center justify-center p-6 bg-white rounded-2xl print:p-0 print:border-none">
                  {t.qr_code_url ? (
                    <img 
                      src={t.qr_code_url} 
                      alt="Ticket QR Code" 
                      className="w-48 h-48 object-contain"
                      crossOrigin="anonymous" 
                    />
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">No QR Code</div>
                  )}
                  <p className="text-xs text-center mt-3 text-gray-500 print:text-black font-mono">
                    REF: {t.payment_reference?.split('_')[1]?.substring(0, 8) || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .max-w-3xl, .max-w-3xl * {
            visibility: visible;
          }
          .max-w-3xl {
            position: relative;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }
        }
      `}} />

      {/* Generated Image Modal for Mobile Saving */}
      {generatedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm print:hidden">
          <div className="bg-surface border border-white/10 p-6 rounded-3xl max-w-md w-full flex flex-col items-center">
            <h3 className="text-xl font-bold mb-2">Ticket Ready!</h3>
            <p className="text-text-muted text-sm text-center mb-6">
              Long-press (or right-click) the image below and select <strong>"Save Image"</strong> to download it to your device.
            </p>
            
            <div className="w-full max-h-[50vh] overflow-auto rounded-xl border border-white/10 mb-6 bg-black">
              <img src={generatedImage} alt="Generated Ticket" className="w-full h-auto" />
            </div>

            <div className="flex gap-4 w-full">
              <button 
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = generatedImage;
                  link.download = "Ticket.png";
                  link.click();
                }}
                className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors"
              >
                Force Download
              </button>
              <button 
                onClick={() => setGeneratedImage(null)}
                className="flex-1 py-3 bg-surface-light hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="flex-1 container mx-auto px-6 py-32 flex items-center justify-center min-h-[80vh]">
      <Suspense fallback={
        <div className="text-center space-y-6">
          <Loader2 className="animate-spin text-primary mx-auto" size={64} />
          <h2 className="text-2xl font-bold">Loading...</h2>
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
