import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Users } from "lucide-react";
import { useTelegramUser } from "../hooks/useTelegramUser";
import { motion } from "framer-motion";
import { getReferrals } from "../lib/db";

export function Referrals() {
  const tUser = useTelegramUser();
  const navigate = useNavigate();
  const telegramId = tUser.telegramId || "123456789";
  
  const [myReferrals, setMyReferrals] = useState<any[]>([]);

  useEffect(() => {
    getReferrals().then(refs => {
      setMyReferrals(refs.filter(r => r.referrerId === telegramId));
    }).catch(console.error);
  }, [telegramId]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-5 pb-24 px-4"
    >
      <header className="flex items-center gap-4 mb-2 mt-4">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-white/80 active:scale-95 transition-transform bg-white/5 rounded-full">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-white/90">My Referrals</h1>
      </header>

      <div className="bg-gradient-to-r from-[#8792FF]/20 to-purple-500/20 border border-[#8792FF]/30 shadow-[0_8px_32px_rgba(135,146,255,0.15)] rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#8792FF] flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{myReferrals.length}</h2>
            <p className="text-xs text-white/70">Total Successful Referrals</p>
          </div>
        </div>
      </div>

      <h3 className="text-sm font-bold text-white mb-2">Referral History</h3>
      {myReferrals.length > 0 ? (
        <div className="flex flex-col gap-2">
          {myReferrals.map((ref: any, idx: number) => (
            <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-white">{ref.referredName || "Anonymous User"}</span>
                <span className="text-[11px] text-white/50">ID: {ref.referredId}</span>
              </div>
              <span className="text-[12px] text-white/40">{new Date(ref.timestamp).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white/[0.02] border border-white/5 rounded-xl">
          <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/50 font-medium">No referrals yet</p>
          <p className="text-[11px] text-white/30 mt-1">Share your link to invite friends</p>
        </div>
      )}
    </motion.div>
  );
}
