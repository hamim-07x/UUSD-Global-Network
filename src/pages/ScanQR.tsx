import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsQR from "jsqr";

export function ScanQR() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scannedAddress, setScannedAddress] = useState<string | null>(null);

  const handleScan = (text: string) => {
    if (text && !scannedAddress) {
      setScannedAddress(text);
      setTimeout(() => {
        navigate(`/withdraw?address=${encodeURIComponent(text)}`, { replace: true });
      }, 1500);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          handleScan(code.data);
        } else {
          alert("No QR code found in the image. Please try another picture.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-screen w-full bg-[#13141a] text-white relative z-50 overflow-hidden"
    >
      {/* Header */}
      <header className="flex items-center gap-4 p-4 z-10 w-full bg-[#13141a]">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 flex items-center justify-center text-white active:scale-95 transition-transform bg-white/[0.05] rounded-full"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-medium tracking-tight">Provide QR Picture</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm flex flex-col items-center p-8 bg-[#1a1b23] rounded-3xl border border-white/5 text-center shadow-2xl">
          
          <div className="w-20 h-20 bg-[#8792FF]/20 rounded-full flex items-center justify-center mb-6">
            <ImageIcon className="w-10 h-10 text-[#8792FF]" />
          </div>

          <h2 className="text-2xl font-bold mb-2">Upload QR Code</h2>
          <p className="text-white/60 text-sm mb-8 leading-relaxed">
            Please provide a picture of a QR code that contains the wallet address you wish to transfer to.
          </p>

          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 rounded-[16px] bg-[#8792FF] text-white font-bold text-[16px] active:scale-[0.98] transition-all shadow-lg shadow-[#8792FF]/20 flex items-center justify-center gap-2"
          >
            <ImageIcon className="w-5 h-5" />
            Select Picture
          </button>
        </div>
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {scannedAddress && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20"
          >
            <CheckCircle2 className="w-16 h-16 text-[#8792FF] mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Address Found</h3>
            <p className="text-sm text-white/70 break-all bg-white/10 p-3 rounded-xl border border-white/10">
              {scannedAddress}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
