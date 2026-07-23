import { useState, useEffect } from 'react';
import { UserWallet } from '../types';
import { TelegramUser } from './useTelegramUser';
import { syncToFirebase } from '../lib/sync';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, onSnapshot, setDoc } from 'firebase/firestore';
import { useToast } from '../lib/ToastContext';

const MOCK_WALLET_KEY = 'mock_telegram_wallet_';
const MOCK_ACTIVITY_KEY = 'mock_wallet_activity_';
const MOCK_REGISTRY_KEY = 'mock_users_registry';

export type ActivityType = 'deposit' | 'withdraw' | 'transfer_out' | 'transfer_in' | 'earn';

export interface Activity {
  id: string;
  type: ActivityType;
  amount: number;
  symbol: string;
  timestamp: string;
  status: 'completed' | 'pending';
  toAddress?: string;
  toName?: string;
  fromAddress?: string;
  fromName?: string;
}

export interface UserRegistryEntry {
  telegramId: string;
  address: string;
  firstName: string | null;
  username: string | null;
  photoUrl: string | null;
  joinedAt?: string;
}

export function useWallet(telegramUser: TelegramUser | null) {
  const telegramId = telegramUser?.telegramId || null;
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [needsCreation, setNeedsCreation] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!telegramId) {
      setIsLoading(false);
      return;
    }

    let unsubWallet: () => void;
    let unsubActivities: () => void;

    const initWallet = async () => {
      try {
        const storageKey = `${MOCK_WALLET_KEY}${telegramId}`;
        const existingWallet = localStorage.getItem(storageKey);

        const walletRef = doc(db, "wallets", telegramId);
        const walletDoc = await getDoc(walletRef);
        
        let currentWallet: UserWallet;

        if (walletDoc.exists()) {
          currentWallet = walletDoc.data() as UserWallet;
          setWallet(currentWallet);
          localStorage.setItem(storageKey, JSON.stringify(currentWallet));
          setIsLoading(false);
        } else if (existingWallet) {
          currentWallet = JSON.parse(existingWallet);
          await setDoc(walletRef, currentWallet);
          setWallet(currentWallet);
          localStorage.setItem(storageKey, JSON.stringify(currentWallet));
          setIsLoading(false);
        } else {
          // Do NOT create automatically. Show needs creation.
          setNeedsCreation(true);
          setIsLoading(false);
          return; // Skip subscriptions for now until wallet is created
        }
        
        unsubWallet = onSnapshot(walletRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserWallet;
            setWallet(data);
            localStorage.setItem(storageKey, JSON.stringify(data));
          }
        }, (err) => {
           console.error("Wallet snapshot error", err);
        });

        const q = query(collection(db, "activities"), where("telegramId", "==", telegramId), orderBy("timestamp", "desc"));
        unsubActivities = onSnapshot(q, (snap) => {
          const acts = snap.docs.map(d => d.data() as Activity);
          setActivities(acts);
          localStorage.setItem(`${MOCK_ACTIVITY_KEY}${telegramId}`, JSON.stringify(acts));
        }, (err) => {
           console.error("Activities snapshot error", err);
        });

        // Referral tracking on registration
        if (telegramUser?.startParam && telegramUser.startParam !== telegramId) {
          const referrerId = telegramUser.startParam;
          const currentBound = localStorage.getItem(`mock_bound_referral_${telegramId}`);
          if (!currentBound) {
             const globalRefsStr = localStorage.getItem('mock_global_referrals');
             const globalRefs = globalRefsStr ? JSON.parse(globalRefsStr) : [];
             globalRefs.push({
               referrerId,
               referredId: telegramId,
               referredName: telegramUser?.firstName || 'User',
               timestamp: new Date().toISOString()
             });
             localStorage.setItem('mock_global_referrals', JSON.stringify(globalRefs));
             try {
               await syncToFirebase('referrals', `${referrerId}_${telegramId}`, { referrerId, referredId: telegramId, referredName: telegramUser?.firstName || 'User', timestamp: new Date().toISOString() });
             } catch (e) {}

             const refCountStr = localStorage.getItem(`mock_referrals_count_${referrerId}`);
             const newRefCount = (refCountStr ? parseInt(refCountStr) : 0) + 1;
             localStorage.setItem(`mock_referrals_count_${referrerId}`, newRefCount.toString());

             localStorage.setItem(`mock_bound_referral_${telegramId}`, referrerId);
          }
        }

        // Update User Registry
        if (telegramUser) {
          const registryEntry: UserRegistryEntry = {
            telegramId,
            address: currentWallet.address,
            firstName: telegramUser.firstName,
            username: telegramUser.username,
            photoUrl: telegramUser.photoUrl,
            joinedAt: currentWallet.createdAt || new Date().toISOString()
          };
          try {
            await setDoc(doc(db, "users", telegramId), registryEntry, { merge: true });
          } catch(e) {}
        }

      } catch (err: any) {
        console.error("Failed to initialize wallet:", err);
        setError(err.message || "Failed to initialize wallet");
        setIsLoading(false);
      }
    };

    initWallet();

    return () => {
      if (unsubWallet) unsubWallet();
      if (unsubActivities) unsubActivities();
    };
  }, [telegramId, telegramUser]);

  const createWallet = async () => {
    if (!telegramId || !telegramUser) return;
    setIsCreating(true);
    try {
      const newWallet: UserWallet = {
        telegramId: telegramId,
        address: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        availableBalance: 0,
        lockedBalance: 0,
        balances: {},
        depositEnabled: true,
        createdAt: new Date().toISOString()
      };
      const walletRef = doc(db, "wallets", telegramId);
      await setDoc(walletRef, newWallet);
      
      const storageKey = `${MOCK_WALLET_KEY}${telegramId}`;
      localStorage.setItem(storageKey, JSON.stringify(newWallet));
      setWallet(newWallet);
      setNeedsCreation(false);

      const registryEntry: UserRegistryEntry = {
        telegramId,
        address: newWallet.address,
        firstName: telegramUser.firstName,
        username: telegramUser.username,
        photoUrl: telegramUser.photoUrl,
        joinedAt: newWallet.createdAt || new Date().toISOString()
      };
      await setDoc(doc(db, "users", telegramId), registryEntry, { merge: true });

      // Check referrals
      if (telegramUser?.startParam && telegramUser.startParam !== telegramId) {
        const referrerId = telegramUser.startParam;
        const currentBound = localStorage.getItem(`mock_bound_referral_${telegramId}`);
        if (!currentBound) {
           const globalRefsStr = localStorage.getItem('mock_global_referrals');
           const globalRefs = globalRefsStr ? JSON.parse(globalRefsStr) : [];
           globalRefs.push({
             referrerId,
             referredId: telegramId,
             referredName: telegramUser?.firstName || 'User',
             timestamp: new Date().toISOString()
           });
           localStorage.setItem('mock_global_referrals', JSON.stringify(globalRefs));
           try {
             await syncToFirebase('referrals', `${referrerId}_${telegramId}`, { referrerId, referredId: telegramId, referredName: telegramUser?.firstName || 'User', timestamp: new Date().toISOString() });
           } catch (e) {}
           const refCountStr = localStorage.getItem(`mock_referrals_count_${referrerId}`);
           const newRefCount = (refCountStr ? parseInt(refCountStr) : 0) + 1;
           localStorage.setItem(`mock_referrals_count_${referrerId}`, newRefCount.toString());
           localStorage.setItem(`mock_bound_referral_${telegramId}`, referrerId);
        }
      }
      
      // Auto reload to attach listeners properly
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
      showToast(e.message, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const addActivity = async (
    type: ActivityType, 
    amount: number, 
    symbol: string, 
    extra?: { toAddress?: string, toName?: string, fromAddress?: string, fromName?: string }
  ) => {
    if (!telegramId) return;
    
    const newActivity: Activity = {
      id: Date.now().toString(),
      type,
      amount,
      symbol,
      timestamp: new Date().toISOString(),
      status: 'completed',
      telegramId,
      ...extra
    } as any;
    
    try {
      await setDoc(doc(db, "activities", newActivity.id), newActivity);
    } catch (err: any) {
      showToast(`Failed to save activity: ${err.message}`, 'error');
    }

    if (wallet) {
      const currentBalances = wallet.balances || {};
      const currentAmount = currentBalances[symbol] || 0;
      
      const newBalances = { ...currentBalances };
      if (type === 'deposit' || type === 'transfer_in' || type === 'earn') {
        newBalances[symbol] = currentAmount + amount;
      } else if (type === 'withdraw' || type === 'transfer_out') {
        newBalances[symbol] = Math.max(0, currentAmount - amount);
      }

      const updatedWallet = { ...wallet, balances: newBalances };
      try {
        await setDoc(doc(db, "wallets", telegramId), updatedWallet);
      } catch (err: any) {
        showToast(`Failed to sync balance: ${err.message}`, 'error');
      }
    }
  };

  return {
    isLoading,
    error,
    needsCreation,
    isCreating,
    createWallet,
    address: wallet?.address,
    availableBalance: wallet?.availableBalance,
    lockedBalance: wallet?.lockedBalance,
    fullWallet: wallet,
    activities,
    addActivity
  };
}

export const checkAddressInRegistry = (address: string): UserRegistryEntry | null => {
  const registryStr = localStorage.getItem(MOCK_REGISTRY_KEY);
  if (!registryStr) return null;
  const registry = JSON.parse(registryStr);
  return registry[address] || null;
};



