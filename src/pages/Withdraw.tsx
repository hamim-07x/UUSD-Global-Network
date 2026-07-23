import React, { useState, useEffect } from "react";
import { ChevronLeft, QrCode, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet, UserRegistryEntry } from "../hooks/useWallet";
import { useTelegramUser } from "../hooks/useTelegramUser";
import { findUserByAddress, transferFunds } from "../lib/db";

const UUSD_TOKEN = { symbol: "UUSD", name: "UUSD Token", imgUrl: "https://i.ibb.co/k27sBd6Q/0x61a10e8556bed032ea176330e7f17d6a12a10000.png" };
const BSC_NETWORK = { id: "bsc", name: "Binance Smart Chain", icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png" };

export function Withdraw() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const telegramUser = useTelegramUser();
  const { fullWallet, address: myAddress } = useWallet(telegramUser);
  const balances = fullWallet?.balances || {};
  
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState(searchParams.get("address") || "");
  const [addressError, setAddressError] = useState("");
  const [recipientData, setRecipientData] = useState<UserRegistryEntry | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const availableAmount = balances[UUSD_TOKEN.symbol] || 0;
  const parsedAmount = parseFloat(amount) || 0;

  useEffect(() => {
    let active = true;
    const fetchRecipient = async () => {
      if (address.length > 20) {
        if (address === myAddress) {
          setAddressError("You cannot send to your own address.");
          setRecipientData(null);
          return;
        }
        
        setIsSearching(true);
        setAddressError("");
        setRecipientData(null);
        try {
          const found = await findUserByAddress(address);
          if (active) {
            if (found) {
              setRecipientData(found);
              setAddressError("");
            } else {
              setRecipientData(null);
              setAddressError("External address. You can only send to registered Network users.");
            }
          }
        } catch (err) {
          if (active) setAddressError("Failed to verify address.");
        } finally {
          if (active) setIsSearching(false);
        }
      } else {
        setRecipientData(null);
        setAddressError("");
      }
    };
    
    fetchRecipient();
    return () => { active = false; };
  }, [address, myAddress]);

  const handleMax = () => {
    setAmount(availableAmount.toString());
  };

  const handleWithdraw = async () => {
    if (parsedAmount <= 0 || parsedAmount > availableAmount || !address || !recipientData || !fullWallet) return;
    
    setIsProcessing(true);
    try {
      await transferFunds(
        fullWallet.telegramId,
        recipientData.telegramId,
        parsedAmount,
        UUSD_TOKEN.symbol,
        fullWallet.address,
        recipientData.address,
        telegramUser?.firstName || telegramUser?.username || "User",
        recipientData.firstName || recipientData.username || "User"
      );
      
      // Update local storage manually so UI reflects it
      const storageKey = `mock_telegram_wallet_${fullWallet.telegramId}`;
      const activityKey = `mock_wallet_activity_${fullWallet.telegramId}`;
      
      const newWallet = { ...fullWallet, balances: { ...fullWallet.balances, [UUSD_TOKEN.symbol]: availableAmount - parsedAmount } };
      localStorage.setItem(storageKey, JSON.stringify(newWallet));
      
      const existingActivityStr = localStorage.getItem(activityKey);
      const existingActivities = existingActivityStr ? JSON.parse(existingActivityStr) : [];
      const newActivity = {
        id: Date.now().toString() + "_out_local",
        type: 'transfer_out',
        amount: parsedAmount,
        symbol: UUSD_TOKEN.symbol,
        timestamp: new Date().toISOString(),
        status: 'completed',
        toAddress: recipientData.address,
        toName: recipientData.firstName || recipientData.username || "User"
      };
      localStorage.setItem(activityKey, JSON.stringify([newActivity, ...existingActivities]));

      alert(`Successfully sent ${parsedAmount} ${UUSD_TOKEN.symbol}!`);
      navigate("/");
    } catch (err: any) {
      alert("Transaction failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full bg-[#13141a] text-white pb-24 relative overflow-y-auto"
    >
      <header className="flex items-center gap-4 p-4 mb-2">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-white/80 active:scale-95 transition-transform bg-white/[0.04] rounded-full">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Send</h1>
      </header>

      <div className="px-4 flex flex-col gap-5">
        {/* Address Input */}
        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-medium text-white/70">Send to Address</label>
          <div className="flex items-center p-3 rounded-[16px] bg-[#1a1b23] border border-white/5 focus-within:border-[#8792FF]/50 transition-colors">
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter receiving address"
              className="w-full bg-transparent border-none outline-none text-[15px] placeholder:text-white/30"
            />
            <button onClick={() => navigate('/scan')} className="ml-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-[#8792FF]">
              <QrCode className="w-5 h-5" />
            </button>
          </div>
          
          <AnimatePresence>
            {isSearching && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 4 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-white/50 text-sm overflow-hidden"
              >
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span className="leading-tight">Searching network...</span>
              </motion.div>
            )}

            {/* Recipient Profile Preview */}
            {!isSearching && recipientData && !addressError && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 4 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8792FF] to-purple-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden border border-white/10">
                  {recipientData.photoUrl ? (
                    <img src={recipientData.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (recipientData.firstName || recipientData.username || "U").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">{recipientData.firstName || recipientData.username || "Telegram User"}</span>
                  <span className="text-xs text-white/50">{recipientData.address.substring(0, 8)}...{recipientData.address.substring(recipientData.address.length - 6)}</span>
                </div>
              </motion.div>
            )}

            {addressError && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 4 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm overflow-hidden"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="leading-tight">{addressError}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Network Display (Fixed) */}
        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-medium text-white/70">Network</label>
          <div className="flex items-center p-3 rounded-[16px] bg-[#1a1b23] border border-white/5 opacity-80">
            <div className="flex items-center gap-3">
              <img src={BSC_NETWORK.icon} alt={BSC_NETWORK.name} className="w-6 h-6 rounded-full" />
              <span className="text-[15px] font-medium">{BSC_NETWORK.name}</span>
            </div>
          </div>
        </div>

        {/* Token Display (Fixed) */}
        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-medium text-white/70">Asset</label>
          <div className="flex items-center p-3 rounded-[16px] bg-[#1a1b23] border border-white/5 opacity-80">
            <div className="flex items-center gap-3">
              <img src={UUSD_TOKEN.imgUrl} alt={UUSD_TOKEN.name} className="w-6 h-6 rounded-full" />
              <div className="flex flex-col">
                <span className="text-[15px] font-medium">{UUSD_TOKEN.symbol}</span>
                <span className="text-[12px] text-white/50">{UUSD_TOKEN.name}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Amount Input */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between">
            <label className="text-[14px] font-medium text-white/70">Amount</label>
            <span className="text-[12px] text-white/50">Available: {availableAmount} {UUSD_TOKEN.symbol}</span>
          </div>
          <div className="flex items-center p-3 rounded-[16px] bg-[#1a1b23] border border-white/5 focus-within:border-[#8792FF]/50 transition-colors">
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent border-none outline-none text-[20px] font-semibold placeholder:text-white/20"
            />
            <button 
              onClick={handleMax}
              className="text-[#8792FF] text-[13px] font-bold px-3 py-1.5 rounded-lg bg-[#8792FF]/10 hover:bg-[#8792FF]/20 transition-colors"
            >
              MAX
            </button>
          </div>
        </div>

        <button 
          onClick={handleWithdraw}
          disabled={!address || parsedAmount <= 0 || parsedAmount > availableAmount || !recipientData || isProcessing}
          className="w-full py-4 mt-4 rounded-[16px] bg-[#8792FF] text-white font-bold text-[16px] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-lg shadow-[#8792FF]/20 flex items-center justify-center gap-2"
        >
          {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : `Send ${UUSD_TOKEN.symbol}`}
        </button>
      </div>
    </motion.div>
  );
}
