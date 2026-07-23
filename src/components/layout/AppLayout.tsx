import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useOutlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import WebApp from "@twa-dev/sdk";
import { AnimatePresence, motion } from "framer-motion";
import { LoadingScreen } from "./LoadingScreen";
import { useTelegramUser } from "../../hooks/useTelegramUser";
import { useWallet } from "../../hooks/useWallet";
import { SettingsProvider } from "../../lib/SettingsContext";

export function AppLayout() {
  const location = useLocation();
  const outlet = useOutlet();
  const { telegramId } = useTelegramUser();
  const { isLoading: isWalletLoading } = useWallet(telegramId);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Initialize Telegram WebApp settings for optimal layout
    if (WebApp.initDataUnsafe?.user || typeof window !== 'undefined') {
      WebApp.expand();
      WebApp.ready();
      
      // Set header and background color to match our deep dark theme
      try {
        WebApp.setHeaderColor('#13141a');
        WebApp.setBackgroundColor('#13141a');
      } catch (e) {
        // Ignored in non-Telegram environments
      }
    }

    // Combine wallet loading with a minimum display time for the premium loading screen
    let minTimeElapsed = false;
    const minTimer = setTimeout(() => {
      minTimeElapsed = true;
      if (!isWalletLoading) {
        setIsInitializing(false);
      }
    }, 2500);

    if (!isWalletLoading && minTimeElapsed) {
      setIsInitializing(false);
    }

    return () => clearTimeout(minTimer);
  }, [isWalletLoading]);

  return (
    <SettingsProvider telegramId={telegramId}>
      <>
        <AnimatePresence>
          {isInitializing && <LoadingScreen key="loading-screen" />}
        </AnimatePresence>

        <div className="min-h-screen w-full flex flex-col pt-[env(safe-area-inset-top)] pb-[calc(6rem+env(safe-area-inset-bottom))] text-white font-sans selection:bg-blue-500/30">
          <main className="flex-1 w-full max-w-md mx-auto relative px-4 pt-4 z-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full h-full"
              >
                {outlet}
              </motion.div>
            </AnimatePresence>
          </main>
          
          <BottomNav />
        </div>
      </>
    </SettingsProvider>
  );
}

