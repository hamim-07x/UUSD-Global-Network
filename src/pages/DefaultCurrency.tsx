import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, DollarSign, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../lib/SettingsContext';

export function DefaultCurrency() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();

  const handleSelect = (curr: string) => {
    updateSettings({ currency: curr });
    navigate(-1);
  };

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  ];

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
          <DollarSign className="w-5 h-5 text-[#8A8D9F]" />
          Default Currency
        </h1>
      </header>

      <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.05] rounded-3xl p-2 flex flex-col gap-1">
        {currencies.map((curr) => (
          <button 
            key={curr.code}
            onClick={() => handleSelect(curr.code)} 
            className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 font-semibold text-sm">
                {curr.symbol}
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-white font-semibold text-[15px]">{curr.code}</span>
                <span className="text-white/50 text-xs">{curr.name}</span>
              </div>
            </div>
            {settings.currency === curr.code && (
              <Check className="w-5 h-5 text-[#8792FF]" />
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
