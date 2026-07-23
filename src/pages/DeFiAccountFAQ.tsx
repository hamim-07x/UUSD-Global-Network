import React, { useState } from "react";
import { ChevronLeft, HelpCircle, ChevronDown, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-colors hover:bg-white/[0.07]">
      <motion.button 
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <span className="text-[#8792FF] font-semibold text-sm">{question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-[#8792FF]" />
        </motion.div>
      </motion.button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 pt-1">
              <p className="text-xs text-white/70 leading-relaxed">
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DeFiAccountFAQ() {
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
          <HelpCircle className="w-5 h-5 text-[#38B6FF]" />
          DeFi Account FAQ
        </h1>
      </header>

      <div className="flex flex-col gap-3">
        <FAQItem 
          question="What is UUSD Token?" 
          answer="UUSD is the foundational utility and reward token of our ecosystem. Users can earn UUSD by completing engaging tasks, joining special events, and inviting friends. These tokens are instantly credited to your wallet and can be used for in-app benefits."
        />
        <FAQItem 
          question="How do I earn rewards?" 
          answer="Go to the Rewards section where you'll find active Events and Tasks. Engage with social media, complete challenges, and watch your balance grow. Your earned rewards are securely tracked and instantly viewable on your Dashboard."
        />
        <FAQItem 
          question="Is my Wallet secure?" 
          answer="Yes, security is our top priority. The Network Wallet utilizes cutting-edge encryption to ensure that your digital assets and personal information are thoroughly protected."
        />
        
        <div className="bg-[#38B6FF]/10 rounded-2xl p-4 border border-[#38B6FF]/20 mt-2">
          <h4 className="text-[#38B6FF] text-sm font-semibold mb-2">Need more info?</h4>
          <p className="text-xs text-white/60 mb-3 leading-relaxed">
            Visit our official website for comprehensive guides, whitepapers, and full documentation on the DeFi ecosystem.
          </p>
          <motion.a 
            whileTap={{ scale: 0.95 }}
            href="https://uusd.ai" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-2 text-xs text-white bg-[#38B6FF] px-4 py-2 rounded-xl font-bold transition-transform"
          >
            <ExternalLink className="w-4 h-4" />
            Visit uusd.ai
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
}
