import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, ChevronLeft, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function WalletNewsPage() {
  const navigate = useNavigate();
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col gap-4 pb-24 px-4 pt-4"
    >
      <header className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-white/80 active:scale-95 transition-transform">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-white/90 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-[#FFC914]" />
          Wallet News
        </h1>
      </header>

      <div className="flex flex-col gap-4">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFC914]/10 blur-[30px] rounded-full pointer-events-none" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#FFC914] mb-1.5 block">Latest Update</span>
          <h3 className="text-white font-bold text-base mb-2">New Reward Events Live</h3>
          <p className="text-xs text-white/70 leading-relaxed">
            We have just launched a new series of reward events! Participate now to earn extra UUSD tokens. Make sure to check the Tasks section and complete them before the timer runs out.
          </p>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 mb-1.5 block">Security Patch</span>
          <h3 className="text-white font-bold text-base mb-2">Enhanced Performance</h3>
          <p className="text-xs text-white/70 leading-relaxed">
            Our latest update significantly improves the speed and security of your DeFi wallet. We continually strive to provide the best user experience.
          </p>
        </div>
        
        <div className="bg-[#FFC914]/10 rounded-2xl p-4 border border-[#FFC914]/20 mt-1 flex flex-col items-center text-center">
          <h4 className="text-[#FFC914] text-sm font-bold mb-2">Stay Updated</h4>
          <p className="text-xs text-white/60 mb-3 leading-relaxed">
            For official announcements, roadmap updates, and more, check our official website.
          </p>
          <motion.a 
            whileTap={{ scale: 0.95 }}
            href="https://uusd.ai" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center justify-center gap-2 text-black bg-[#FFC914] px-6 py-2 rounded-xl text-sm font-bold w-full max-w-[200px] transition-transform"
          >
            <ExternalLink className="w-4 h-4" />
            Official Website
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
}
