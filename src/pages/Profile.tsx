import { useSettings } from "../lib/SettingsContext";
import React, { useState, useEffect } from "react";
import { User, Bell, Lock, Globe, DollarSign, MessageCircle, HelpCircle, Lightbulb, ChevronLeft, Shield, Share2, Copy, Check, ExternalLink } from "lucide-react";
import { useTelegramUser } from "../hooks/useTelegramUser";
import { cn } from "../lib/utils";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getReferrals } from "../lib/db";

// Custom Toggle Component
function GlassToggle({ 
  checked, 
  onChange, 
  label, 
  icon: Icon 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void; 
  label: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-white/5 border border-white/5">
          <Icon className="w-4 h-4 text-white/70" />
        </div>
        <span className="text-sm font-medium text-white/90">{label}</span>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative flex items-center h-6 w-11 rounded-full transition-colors duration-300 border",
          checked ? "bg-[#8792FF] border-[#8792FF]/50" : "bg-white/[0.04] backdrop-blur-md border-white/10"
        )}
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "h-4 w-4 rounded-full bg-white shadow-sm",
            checked ? "ml-6" : "ml-1"
          )}
        />
      </button>
    </div>
  );
}

export function Profile() {
  const tUser = useTelegramUser();
  const { settings, updateSettings, t } = useSettings();
  const navigate = useNavigate();
  
  // Fallback data if not in Telegram
  const firstName = tUser.firstName || "Satoshi";
  const username = tUser.username ? `@${tUser.username}` : "@nakamoto";
  const telegramId = tUser.telegramId || "123456789";
  const initial = firstName.charAt(0).toUpperCase();

  const [copied, setCopied] = useState(false);
  const botUsername = localStorage.getItem('mock_bot_username') || "our_bot";
  const referralLink = `https://t.me/${botUsername}/app?startapp=${telegramId}`;
  
  const [myReferrals, setMyReferrals] = useState<any[]>([]);

  useEffect(() => {
    getReferrals().then(refs => {
      setMyReferrals(refs.filter(r => r.referrerId === telegramId));
    }).catch(console.error);
  }, [telegramId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const referredBy = localStorage.getItem(`mock_bound_referral_${telegramId}`);

  const SettingsItem = ({ 
    icon: Icon, 
    label, 
    value, 
    colorClass,
    onClick
  }: { 
    icon: any, 
    label: string, 
    value?: string,
    colorClass: string,
    onClick?: () => void
  }) => (
    <motion.button 
      whileTap={{ scale: 0.98 }}
      onClick={onClick} 
      className="flex items-center justify-between py-3.5 px-2 hover:bg-white/[0.05] rounded-xl transition-colors group w-full"
    >
      <div className="flex items-center gap-3.5">
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", colorClass)}>
          <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-[15px] font-medium text-white/90 group-hover:text-white transition-colors">
          {label}
        </span>
      </div>
      {value && (
        <span className="text-[15px] text-[#8792FF]">{value}</span>
      )}
    </motion.button>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-5 pb-24"
    >
      <header className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-white/80 active:scale-95 transition-transform">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-white/90">Settings</h1>
      </header>

      {/* User Info Section */}
      <div className="px-4">
        <div className="flex items-center gap-4 bg-white/[0.04] backdrop-blur-2xl border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.2)] p-4 rounded-3xl">
          <div className="relative">
            {tUser.photoUrl ? (
              <img 
                src={tUser.photoUrl} 
                alt={firstName} 
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/[0.04] backdrop-blur-md border border-white/[0.05] flex items-center justify-center">
                <span className="text-2xl font-bold text-white/80">{initial}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-bold text-white/90">{firstName}</h2>
            <span className="text-sm text-white/50">{username}</span>
            <span className="text-xs text-white/40 mt-1">ID: {telegramId}</span>
          </div>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="px-4">
        <div className="bg-gradient-to-r from-[#8792FF]/20 to-purple-500/20 border border-[#8792FF]/30 shadow-[0_8px_32px_rgba(135,146,255,0.15)] rounded-3xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#8792FF] flex items-center justify-center">
              <Share2 className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-white">Your Referral Link</h3>
              <p className="text-xs text-white/60">Complete referral tasks to earn rewards!</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#13141a]/60 border border-white/10 rounded-xl p-1.5 pl-3 mb-3">
            <span className="text-[13px] text-white/70 font-mono truncate flex-1 select-all">{referralLink}</span>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-[#8792FF] text-white font-semibold text-xs transition-all flex items-center gap-1.5 min-w-[72px] justify-center"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </motion.button>
          </div>
          
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10 mt-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-semibold text-white/70">Your Referrals</h4>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/referrals')} className="text-[11px] text-[#8792FF] font-medium hover:underline">
                View Details
              </motion.button>
            </div>
            
            <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-3">
              <span className="text-sm text-white/60">Total Successful Referrals</span>
              <span className="text-lg font-bold text-white">{myReferrals.length}</span>
            </div>
            
            {referredBy && (
              <p className="text-[11px] text-[#8792FF] mt-1 text-center">Invited by: {referredBy}</p>
            )}
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="px-4">
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-3xl p-4">
          <h3 className="text-[14px] font-semibold text-[#8792FF] mb-2 px-1">{t('General settings')}</h3>
          <div className="flex flex-col">
            <SettingsItem icon={Bell} label={t('Notifications')} value={settings.notifications ? "On" : "Off"} colorClass="bg-[#FF4B4B]" onClick={() => updateSettings({ notifications: !settings.notifications })} />
            <SettingsItem icon={Lock} label={t('Passcode')} value={settings.passcode ? "On" : "Off"} colorClass="bg-[#2D8CFF]" onClick={() => updateSettings({ passcode: !settings.passcode })} />
            <SettingsItem icon={Globe} label={t('Language')} value={settings.language === 'en' ? 'English' : settings.language === 'zh' ? '中文' : settings.language === 'ar' ? 'العربية' : 'বাংলা'} colorClass="bg-[#A051FF]" onClick={() => navigate('/language')} />
            <SettingsItem icon={DollarSign} label={t('Default Currency')} value={settings.currency} colorClass="bg-[#8A8D9F]" onClick={() => navigate('/currency')} />
          </div>
        </div>
      </div>

      {/* Support & Info */}
      <div className="px-4">
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-3xl p-4 mt-2">
          <div className="flex flex-col">
            <SettingsItem icon={Shield} label={t('Admin Panel')} colorClass="bg-purple-500" onClick={() => navigate('/admin')} />
            <SettingsItem icon={MessageCircle} label={t('Contact Wallet support')} colorClass="bg-[#FF9B26]" onClick={() => {
              const supportUsername = localStorage.getItem('mock_support_username') || "your_support_link";
              window.open(`https://t.me/${supportUsername}`, "_blank");
            }} />
            <SettingsItem icon={HelpCircle} label={t('DeFi Account FAQ')} colorClass="bg-[#38B6FF]" onClick={() => navigate('/faq')} />
            <SettingsItem icon={Lightbulb} label={t('Wallet News')} colorClass="bg-[#FFC914]" onClick={() => navigate('/news')} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
