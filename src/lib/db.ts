import { db } from './firebase';
import { collection, doc, getDoc, setDoc, updateDoc, getDocs, deleteDoc, query, where, orderBy, runTransaction, limit } from 'firebase/firestore';
import { UserRegistryEntry, Activity } from '../hooks/useWallet';

// We will store all collections here:
// "users" -> User records
// "wallets" -> Wallet states
// "activities" -> User activities
// "tasks" -> Task templates
// "events" -> Event templates
// "referrals" -> Global referrals

export const getUsers = async () => {
  const snapshot = await getDocs(query(collection(db, "users"), limit(1000)));
  return snapshot.docs.map(d => d.data() as UserRegistryEntry);
};

export const getWallets = async () => {
  const snapshot = await getDocs(query(collection(db, "wallets"), limit(1000)));
  return snapshot.docs.map(d => ({ telegramId: d.id, ...d.data() }));
};

export const getAllActivities = async () => {
  const snapshot = await getDocs(query(collection(db, "activities"), orderBy("timestamp", "desc"), limit(1000)));
  return snapshot.docs.map(d => d.data() as Activity);
};

export const findUserByAddress = async (address: string) => {
  const snapshot = await getDocs(query(collection(db, "users"), where("address", "==", address)));
  if (!snapshot.empty) {
    return snapshot.docs[0].data() as UserRegistryEntry;
  }
  return null;
};

export const saveUser = async (user: UserRegistryEntry) => {
  await setDoc(doc(db, "users", user.telegramId), user);
};

export const saveWallet = async (telegramId: string, wallet: any) => {
  await setDoc(doc(db, "wallets", telegramId), wallet);
};

export const saveActivity = async (activity: Activity & { userTelegramId: string }) => {
  await setDoc(doc(db, "activities", activity.id), activity);
};

export const getTasks = async () => {
  const snapshot = await getDocs(collection(db, "tasks"));
  return snapshot.docs.map(d => d.data());
};

export const saveTasks = async (tasks: any[]) => {
  for (const t of tasks) {
    await setDoc(doc(db, "tasks", t.id), t);
  }
};

export const saveTask = async (task: any) => {
  await setDoc(doc(db, "tasks", task.id), task);
};

export const deleteTaskDoc = async (id: string) => {
  await deleteDoc(doc(db, "tasks", id));
};

export const getEvents = async () => {
  const snapshot = await getDocs(collection(db, "events"));
  return snapshot.docs.map(d => d.data());
};

export const saveEvent = async (event: any) => {
  await setDoc(doc(db, "events", event.id), event);
};

export const deleteEventDoc = async (id: string) => {
  await deleteDoc(doc(db, "events", id));
};

export const getCompletedTasks = async (telegramId: string) => {
  const docRef = await getDoc(doc(db, "completed_tasks", telegramId));
  if (docRef.exists()) {
    return docRef.data();
  }
  return {};
};

export const saveCompletedTasks = async (telegramId: string, completed: any) => {
  await setDoc(doc(db, "completed_tasks", telegramId), completed);
};

export const transferFunds = async (
  senderId: string, 
  recipientId: string, 
  amount: number, 
  symbol: string,
  senderAddress: string,
  recipientAddress: string,
  senderName: string,
  recipientName: string
) => {
  await runTransaction(db, async (transaction) => {
    const senderRef = doc(db, "wallets", senderId);
    const recipientRef = doc(db, "wallets", recipientId);

    const senderDoc = await transaction.get(senderRef);
    const recipientDoc = await transaction.get(recipientRef);

    if (!senderDoc.exists() || !recipientDoc.exists()) {
      throw new Error("Wallet not found!");
    }

    const senderData = senderDoc.data();
    const recipientData = recipientDoc.data();

    const senderBalance = senderData.balances?.[symbol] || 0;
    const recipientBalance = recipientData.balances?.[symbol] || 0;

    if (senderBalance < amount) {
      throw new Error("Insufficient funds");
    }

    // Update balances
    const newSenderBalances = { ...senderData.balances, [symbol]: senderBalance - amount };
    const newRecipientBalances = { ...recipientData.balances, [symbol]: recipientBalance + amount };

    transaction.update(senderRef, { balances: newSenderBalances });
    transaction.update(recipientRef, { balances: newRecipientBalances });

    // Create activities
    const senderActivityId = Date.now().toString() + "_out";
    const recipientActivityId = Date.now().toString() + "_in";
    const timestamp = new Date().toISOString();

    const senderActivityRef = doc(db, "activities", senderActivityId);
    transaction.set(senderActivityRef, {
      id: senderActivityId,
      telegramId: senderId,
      userTelegramId: senderId,
      type: "transfer_out",
      amount,
      symbol,
      timestamp,
      status: "completed",
      toAddress: recipientAddress,
      toName: recipientName
    });

    const recipientActivityRef = doc(db, "activities", recipientActivityId);
    transaction.set(recipientActivityRef, {
      id: recipientActivityId,
      telegramId: recipientId,
      userTelegramId: recipientId,
      type: "transfer_in",
      amount,
      symbol,
      timestamp,
      status: "completed",
      fromAddress: senderAddress,
      fromName: senderName
    });
  });
};

export const getReferrals = async () => {
  const snapshot = await getDocs(collection(db, "referrals"));
  return snapshot.docs.map(d => d.data());
};

// Also sync with localStorage during transition?
