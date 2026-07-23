export interface UserWallet {
  telegramId: string;
  address: string;
  createdAt: any;
  availableBalance: number;
  lockedBalance: number;
  balances?: Record<string, number>;
  depositEnabled: boolean;
}

export interface Transaction {
  id: string;
  type: "reward" | "deposit" | "transfer" | "withdraw" | "unlock";
  amount: number;
  from?: string;
  to?: string;
  status: "completed" | "pending" | "failed";
  createdAt: any;
  note?: string;
}

export interface AppSettings {
  depositEnabled: boolean;
  withdrawEnabled: boolean;
  maintenanceMode: boolean;
}

