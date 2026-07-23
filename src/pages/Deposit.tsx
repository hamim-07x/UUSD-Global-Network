import React, { useState } from "react";
import { ChevronLeft, Check, Copy, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useWallet } from "../hooks/useWallet";
import { useTelegramUser } from "../hooks/useTelegramUser";
import { QRCodeSVG } from 'qrcode.react';

export function Deposit() {
  const navigate = useNavigate();
  const telegramUser = useTelegramUser();
  const { address } = useWallet(telegramUser);
  const [copied, setCopied] = useState(false);

  const displayAddress = address || "0x0000000000000000000000000000000000000000";

  const handleCopy = () => {
    navigator.clipboard.writeText(displayAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full bg-[#13141a] text-white pb-24 relative overflow-y-auto"
    >
      {/* Header */}
      <header className="flex items-center gap-4 p-4 mb-2">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-white/80 active:scale-95 transition-transform bg-white/[0.04] rounded-full">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Receive</h1>
      </header>

      <div className="px-4 flex flex-col items-center pt-4">
        <div className="flex flex-col items-center bg-[#1a1b23] p-5 rounded-[24px] border border-white/5 w-full max-w-[260px]">
          <div className="bg-white p-3 rounded-xl mb-4 shadow-xl">
            <QRCodeSVG value={displayAddress} size={120} level={"H"} />
          </div>
          
          <span className="text-[13px] font-medium text-white/70 mb-2">Your Receive Address</span>
          
          <div 
            onClick={handleCopy}
            className="flex flex-col items-center gap-2 cursor-pointer group w-full"
          >
            <span className="text-[12px] font-medium text-center break-all text-[#8792FF] bg-[#8792FF]/10 px-3 py-2 rounded-lg w-full transition-colors group-hover:bg-[#8792FF]/20">
              {displayAddress}
            </span>
            <div className="flex items-center gap-2 text-white/60 group-hover:text-white transition-colors mt-1">
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-[13px] text-green-400 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-[13px] font-medium">Copy Address</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-2 text-white/50 bg-[#1a1b23] p-4 rounded-xl border border-white/5 w-full max-w-[260px]">
          <Info className="w-5 h-5 flex-shrink-0 text-[#8792FF]" />
          <p className="text-[12px] leading-relaxed">
            Send only <strong className="text-white">UUSD Token</strong> on <strong className="text-white">Binance Smart Chain</strong> to this address.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
