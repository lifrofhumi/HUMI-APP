"use client";

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "@/lib/api";
import { toast, Toaster } from "react-hot-toast";

export default function ScannerPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [attendee, setAttendee] = useState<{ name: string; email: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Ensure the scanner is only initialized on the client side
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scannerRef.current.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    if (status === "loading" || scanResult === decodedText) return; // Prevent duplicate immediate scans
    
    setScanResult(decodedText);
    setStatus("loading");
    setAttendee(null);
    setErrorMessage("");

    try {
      // Pause scanner while processing
      if (scannerRef.current) {
        scannerRef.current.pause(true);
      }

      const res = await api.post(`/checkin/${decodedText}`);
      setStatus("success");
      setAttendee(res.data.attendee);
      toast.success(res.data.message || "Ticket verified successfully!");
    } catch (err: any) {
      setStatus("error");
      const errorMsg = err.response?.data?.error || "Failed to verify ticket";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      
      if (err.response?.data?.attendee) {
        setAttendee(err.response.data.attendee);
      }
    } finally {
      // Resume scanner after 3 seconds
      setTimeout(() => {
        setScanResult(null);
        setStatus("idle");
        if (scannerRef.current) {
          scannerRef.current.resume();
        }
      }, 3000);
    }
  };

  const onScanFailure = (error: any) => {
    // Ignore frequent scan failures (empty frames, etc)
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
        Ticket Scanner
      </h1>
      
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
        <div className="p-6">
          <div id="qr-reader" className="w-full"></div>
        </div>
      </div>

      {status === "loading" && (
        <div className="text-center p-6 bg-blue-50 rounded-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-800 font-medium">Verifying Ticket...</p>
        </div>
      )}

      {status === "success" && attendee && (
        <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200 shadow-sm animate-pulse">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-green-800 mb-2">Valid Ticket!</h3>
          <div className="text-green-700 bg-white inline-block px-6 py-3 rounded-lg shadow-sm">
            <p className="font-semibold text-lg">{attendee.name}</p>
            <p className="text-sm opacity-80">{attendee.email}</p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200 shadow-sm">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-red-800 mb-2">Invalid or Used Ticket</h3>
          <p className="text-red-700 font-medium mb-4">{errorMessage}</p>
          
          {attendee && (
            <div className="text-red-800 bg-white inline-block px-6 py-3 rounded-lg shadow-sm border border-red-100">
              <p className="font-semibold">{attendee.name}</p>
              <p className="text-sm opacity-80">{attendee.email}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
