import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Wallet } from "ethers";
import * as crypto from "crypto";

admin.initializeApp();
const db = admin.firestore();

// 32 bytes hex string for AES-256
// In production, set this via Firebase Secrets or Environment Variables
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
const IV_LENGTH = 16;

function encryptPrivateKey(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export const createWalletIfNotExists = functions.https.onCall(async (data, context) => {
  const { telegramId, initData } = data;

  if (!telegramId) {
    throw new functions.https.HttpsError("invalid-argument", "telegramId is required");
  }

  // 1. Verify Telegram initData (Optional/TODO)
  // Here you would validate the initData string with your Telegram Bot Token
  
  const walletRef = db.collection("wallets").doc(telegramId);
  const docSnap = await walletRef.get();

  // 2. Check if wallet already exists
  if (docSnap.exists) {
    return { address: docSnap.data()?.address };
  }

  // 3. Generate new wallet using ethers
  const wallet = Wallet.createRandom();
  
  // Encrypt the private key using AES
  const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey);

  const walletData = {
    telegramId,
    address: wallet.address,
    encryptedPrivateKey,
    availableBalance: 0,
    lockedBalance: 0,
    depositEnabled: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Save to Firestore
  await walletRef.set(walletData);

  // 4. Return only the address to the frontend
  return { address: wallet.address };
});
