import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, TrendingUp, TrendingDown } from "lucide-react";

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export function Market() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false"
        );
        const data = await res.json();
        if (Array.isArray(data)) setCoins(data);
      } catch (e) {
        console.log("Using fallback market data. Fetch failed:", e.message);

        const fallback = [
          { id: "bitcoin", symbol: "btc", name: "Bitcoin", image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png", current_price: 65000, price_change_percentage_24h: 2.5 },
          { id: "ethereum", symbol: "eth", name: "Ethereum", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png", current_price: 3500, price_change_percentage_24h: 1.2 },
          { id: "binancecoin", symbol: "bnb", name: "BNB", image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png", current_price: 600, price_change_percentage_24h: -0.5 },
          { id: "solana", symbol: "sol", name: "Solana", image: "https://assets.coingecko.com/coins/images/4128/large/solana.png", current_price: 150, price_change_percentage_24h: 5.0 },
          { id: "ripple", symbol: "xrp", name: "XRP", image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png", current_price: 0.6, price_change_percentage_24h: 0.1 },
          { id: "dogecoin", symbol: "doge", name: "Dogecoin", image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png", current_price: 0.15, price_change_percentage_24h: -1.2 },
        ];
        if (coins.length === 0) setCoins(fallback);

      } finally {
        setLoading(false);
      }
    };

    fetchCoins();
    const interval = setInterval(fetchCoins, 30000); // 30s update
    return () => clearInterval(interval);
  }, []);

  const filteredCoins = coins.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 pb-24 h-full"
    >
      <header className="flex flex-col gap-4 pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-white px-2">Market</h1>
        <div className="relative px-2">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-white/40" />
          </div>
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 bg-white/[0.04] backdrop-blur-md rounded-2xl pl-11 pr-4 text-sm text-white placeholder:text-white/40 outline-none border border-white/[0.05] shadow-[0_4px_12px_rgba(0,0,0,0.1)] focus:border-[#8792FF]/50 transition-colors"
          />
        </div>
      </header>

      <div className="flex flex-col px-2 mt-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
                <div className="flex flex-col gap-2">
                  <div className="w-20 h-4 bg-white/5 animate-pulse rounded" />
                  <div className="w-12 h-3 bg-white/5 animate-pulse rounded" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="w-16 h-4 bg-white/5 animate-pulse rounded" />
                <div className="w-12 h-3 bg-white/5 animate-pulse rounded" />
              </div>
            </div>
          ))
        ) : (
          filteredCoins.map((coin, i) => (
            <motion.div
              key={coin.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between py-4 hover:bg-white/[0.02] rounded-2xl px-2 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <img src={coin.image} alt={coin.name} className="w-11 h-11 rounded-full object-cover shadow-sm" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[17px] font-bold text-white leading-tight">{coin.name}</span>
                  <span className="text-[13px] font-medium text-white/50 uppercase">{coin.symbol}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[17px] font-bold text-white leading-tight">
                  ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </span>
                <span
                  className={`text-[13px] font-medium flex items-center gap-0.5 ${
                    coin.price_change_percentage_24h >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {coin.price_change_percentage_24h >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}