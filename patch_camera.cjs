const fs = require('fs');
let code = fs.readFileSync('src/components/AuditScanner.tsx', 'utf8');

// Add imports
if (!code.includes('import { useRef }')) {
  code = code.replace("import React, { useState } from 'react';", "import React, { useState, useRef } from 'react';");
}
if (!code.includes('Camera')) {
  code = code.replace("import { ScanSearch, FileText, AlertTriangle, CheckCircle2, ShieldAlert, Loader2, Save } from 'lucide-react';", "import { ScanSearch, FileText, AlertTriangle, CheckCircle2, ShieldAlert, Loader2, Save, Camera, X } from 'lucide-react';");
}

// Add state
const targetState = `  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);`;
const replaceState = `  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);`;

code = code.replace(targetState, replaceState);

// Add camera functions
const targetHandleScan = `  const handleScan = async () => {`;
const replaceHandleScan = `  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please ensure you have granted permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
            setFile(capturedFile);
            setPreviewUrl(URL.createObjectURL(capturedFile));
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleScan = async () => {`;

code = code.replace(targetHandleScan, replaceHandleScan);

// Add cleanup to effect
if (!code.includes('useEffect(() => {')) {
  code = code.replace("import React, { useState, useRef } from 'react';", "import React, { useState, useRef, useEffect } from 'react';");
  
  const targetReturn = `  return (`;
  const replaceReturn = `  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (`;
  code = code.replace(targetReturn, replaceReturn);
}

// Update UI to include camera button
const targetUI = `            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Upload Document Image/PDF or Paste Text
            </label>
            <div className="mb-4">
              <input
                type="file"
                accept="image/png, image/jpeg, application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFile(f);
                    setPreviewUrl(URL.createObjectURL(f));
                  }
                }}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#7C3AED]/10 file:text-[#7C3AED] hover:file:bg-[#7C3AED]/20 transition-all cursor-pointer"
              />
            </div>`;

const replaceUI = `            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                Upload Document or Take Photo
              </label>
              {!isCameraActive && (
                <button
                  onClick={startCamera}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#7C3AED] bg-[#7C3AED]/10 rounded-lg hover:bg-[#7C3AED]/20 transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Use Camera
                </button>
              )}
            </div>

            {isCameraActive && (
              <div className="mb-4 relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-200">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full max-h-[400px] object-contain"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center items-center gap-4">
                  <button 
                    onClick={stopCamera}
                    className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 backdrop-blur-sm transition-all"
                    title="Cancel"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={capturePhoto}
                    className="w-16 h-16 bg-white rounded-full border-4 border-slate-300 hover:border-white transition-all shadow-lg flex items-center justify-center"
                    title="Take Photo"
                  >
                    <Camera className="w-6 h-6 text-slate-800" />
                  </button>
                </div>
              </div>
            )}

            {!isCameraActive && (
              <div className="mb-4">
                <input
                  type="file"
                  accept="image/png, image/jpeg, application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setFile(f);
                      setPreviewUrl(URL.createObjectURL(f));
                    }
                  }}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#7C3AED]/10 file:text-[#7C3AED] hover:file:bg-[#7C3AED]/20 transition-all cursor-pointer"
                />
              </div>
            )}`;

code = code.replace(targetUI, replaceUI);

fs.writeFileSync('src/components/AuditScanner.tsx', code);
