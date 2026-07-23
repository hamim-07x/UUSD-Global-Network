import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type Language = 'en' | 'zh' | 'ar' | 'bn';
type Currency = 'USD' | 'EUR' | 'BDT';

interface UserSettings {
  notifications: boolean;
  passcode: boolean;
  language: Language;
  currency: Currency;
}

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  t: (key: string) => string;
  formatCurrency: (amount: number, symbol: string) => string;
}

const defaultSettings: UserSettings = {
  notifications: true,
  passcode: false,
  language: 'en',
  currency: 'USD',
};

const translations: Record<Language, Record<string, string>> = {
  en: {
    'Crypto': 'Crypto',
    'Activity': 'Activity',
    'No activity yet': 'No activity yet',
    'Tasks': 'Tasks',
    'Events': 'Events',
    'Completed': 'Completed',
    'Start': 'Start',
    'Verify': 'Verify',
    'Claim': 'Claim',
    'Done': 'Done',
    'Earn': 'Earn',
    'Active': 'Active',
    'Ended': 'Ended',
    'Wallet': 'Wallet',
    'Profile': 'Profile',
    'Rewards': 'Rewards',
    'Market': 'Market',
    'Withdraw': 'Withdraw',
    'Deposit': 'Deposit',
    'Total Balance': 'Total Balance',
    'Recent Activity': 'Recent Activity',
    'No recent activity': 'No recent activity',
    'Send': 'Send',
    'Receive': 'Receive',
    'Swap': 'Swap',
    'History': 'History',
    'Notifications': 'Notifications',
    'Passcode': 'Passcode',
    'Language': 'Language',
    'Default Currency': 'Default Currency',
    'General settings': 'General settings',
    'Admin Panel': 'Admin Panel',
    'Contact Wallet support': 'Contact Wallet support',
    'DeFi Account FAQ': 'DeFi Account FAQ',
    'Wallet News': 'Wallet News',
  },
  zh: {
    'Crypto': '加密',
    'Activity': '活动',
    'No activity yet': '暂无活动',
    'Tasks': '任务',
    'Events': '活动',
    'Completed': '已完成',
    'Start': '开始',
    'Verify': '验证',
    'Claim': '领取',
    'Done': '完成',
    'Earn': '赚取',
    'Active': '活跃',
    'Ended': '已结束',
    'Wallet': '钱包',
    'Profile': '个人资料',
    'Rewards': '奖励',
    'Market': '市场',
    'Withdraw': '提现',
    'Deposit': '存款',
    'Total Balance': '总余额',
    'Recent Activity': '最近的活动',
    'No recent activity': '没有最近的活动',
    'Send': '发送',
    'Receive': '接收',
    'Swap': '交换',
    'History': '历史',
    'Notifications': '通知',
    'Passcode': '密码',
    'Language': '语言',
    'Default Currency': '默认货币',
    'General settings': '常规设置',
    'Admin Panel': '管理面板',
    'Contact Wallet support': '联系钱包支持',
    'DeFi Account FAQ': 'DeFi 账户常见问题',
    'Wallet News': '钱包新闻',
  },
  ar: {
    'Crypto': 'تشفير',
    'Activity': 'نشاط',
    'No activity yet': 'لا يوجد نشاط بعد',
    'Tasks': 'مهام',
    'Events': 'أحداث',
    'Completed': 'مكتمل',
    'Start': 'يبدأ',
    'Verify': 'يؤكد',
    'Claim': 'مطالبة',
    'Done': 'منتهي',
    'Earn': 'يكسب',
    'Active': 'نشط',
    'Ended': 'انتهى',
    'Wallet': 'محفظة',
    'Profile': 'الملف الشخصي',
    'Rewards': 'المكافآت',
    'Market': 'سوق',
    'Withdraw': 'ينسحب',
    'Deposit': 'إيداع',
    'Total Balance': 'إجمالي الرصيد',
    'Recent Activity': 'النشاط الأخير',
    'No recent activity': 'لا يوجد نشاط أخير',
    'Send': 'إرسال',
    'Receive': 'استلام',
    'Swap': 'مبادلة',
    'History': 'تاريخ',
    'Notifications': 'إشعارات',
    'Passcode': 'رمز المرور',
    'Language': 'لغة',
    'Default Currency': 'العملة الافتراضية',
    'General settings': 'الاعدادات العامة',
    'Admin Panel': 'لوحة الإدارة',
    'Contact Wallet support': 'اتصل بدعم المحفظة',
    'DeFi Account FAQ': 'الأسئلة الشائعة حول حساب DeFi',
    'Wallet News': 'أخبار المحفظة',
  },
  bn: {
    'Crypto': 'ক্রিপ্টো',
    'Activity': 'কাজ',
    'No activity yet': 'এখনো কোনো কাজ নেই',
    'Tasks': 'কাজ',
    'Events': 'ইভেন্ট',
    'Completed': 'সম্পন্ন',
    'Start': 'শুরু করুন',
    'Verify': 'যাচাই করুন',
    'Claim': 'দাবি করুন',
    'Done': 'সম্পন্ন',
    'Earn': 'উপার্জন করুন',
    'Active': 'সক্রিয়',
    'Ended': 'শেষ',
    'Wallet': 'মানিব্যাগ',
    'Profile': 'প্রোফাইল',
    'Rewards': 'পুরস্কার',
    'Market': 'বাজার',
    'Withdraw': 'উত্তোলন',
    'Deposit': 'জমা দিন',
    'Total Balance': 'মোট ব্যালেন্স',
    'Recent Activity': 'সাম্প্রতিক কাজ',
    'No recent activity': 'কোন সাম্প্রতিক কাজ নেই',
    'Send': 'পাঠান',
    'Receive': 'গ্রহণ করুন',
    'Swap': 'অদলবদল',
    'History': 'ইতিহাস',
    'Notifications': 'বিজ্ঞপ্তি',
    'Passcode': 'পাসকোড',
    'Language': 'ভাষা',
    'Default Currency': 'ডিফল্ট মুদ্রা',
    'General settings': 'সাধারণ সেটিংস',
    'Admin Panel': 'অ্যাডমিন প্যানেল',
    'Contact Wallet support': 'ওয়ালেট সাপোর্টের সাথে যোগাযোগ করুন',
    'DeFi Account FAQ': 'DeFi অ্যাকাউন্ট সাধারণ জিজ্ঞাসা',
    'Wallet News': 'ওয়ালেট খবর',
  }
};

const currencyRates: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  BDT: 110, // approximate rate
};

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  BDT: '৳',
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children, telegramId }: { children: React.ReactNode, telegramId: string | null }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  useEffect(() => {
    if (!telegramId) return;

    const loadSettings = async () => {
      const localSettings = localStorage.getItem(`user_settings_${telegramId}`);
      if (localSettings) {
        try {
          setSettings({ ...defaultSettings, ...JSON.parse(localSettings) });
        } catch (e) {}
      }
      try {
        const docRef = doc(db, 'user_settings', telegramId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as UserSettings;
          setSettings({ ...defaultSettings, ...data });
          localStorage.setItem(`user_settings_${telegramId}`, JSON.stringify(data));
        } else {
          await setDoc(docRef, defaultSettings);
          localStorage.setItem(`user_settings_${telegramId}`, JSON.stringify(defaultSettings));
        }
      } catch (err) {
        // Ignore offline error
      }
    };
    
    loadSettings();
  }, [telegramId]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!telegramId) return;
    
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(`user_settings_${telegramId}`, JSON.stringify(updated));
    
    try {
      await setDoc(doc(db, 'user_settings', telegramId), updated);
    } catch (err) {
      // Ignore offline error
    }
  };

  const t = (key: string) => {
    return translations[settings.language][key] || translations['en'][key] || key;
  };

  const formatCurrency = (amount: number, symbol: string) => {
    // Treat the base amount as USD equivalent for simplicity, unless symbol specifies otherwise.
    // Assuming internal storage is in USD terms or native token terms that map to USD.
    let rate = currencyRates[settings.currency];
    let converted = amount * rate;
    return `${currencySymbols[settings.currency]}${converted.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, t, formatCurrency }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
