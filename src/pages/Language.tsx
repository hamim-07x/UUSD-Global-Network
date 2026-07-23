import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Globe, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../lib/SettingsContext';

export function Language() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();

  const handleSelect = (lang: string) => {
    updateSettings({ language: lang });
    navigate(-1);
  };

  const languages = [
    { code: 'en', name: 'English', localName: 'English' },
    { code: 'zh', name: 'Chinese', localName: '中文' },
    { code: 'ar', name: 'Arabic', localName: 'العربية' },
    { code: 'bn', name: 'Bengali', localName: 'বাংলা' },
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
          <Globe className="w-5 h-5 text-[#A051FF]" />
          Language
        </h1>
      </header>

      <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.05] rounded-3xl p-2 flex flex-col gap-1">
        {languages.map((lang) => (
          <button 
            key={lang.code}
            onClick={() => handleSelect(lang.code)} 
            className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors"
          >
            <div className="flex flex-col items-start gap-1">
              <span className="text-white font-semibold text-[15px]">{lang.localName}</span>
              <span className="text-white/50 text-xs">{lang.name}</span>
            </div>
            {settings.language === lang.code && (
              <Check className="w-5 h-5 text-[#8792FF]" />
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
