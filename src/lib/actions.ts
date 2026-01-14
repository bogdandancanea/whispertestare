
"use server";

import { db } from './firebase';
import { doc, getDoc, setDoc, deleteDoc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';

export type CardState = {
  sends: number;
  reads: number;
  loaded: boolean;
  valid: boolean; // Flag to indicate if the card is valid and can be used.
};

export type EncryptedData = {
  ct: string;
  salt: string;
  iv: string;
};

export type WhisperPayload = EncryptedData & {
  expiresAt: number;
  ts: number;
  status: 'waiting' | 'read';
  readAt?: {
    seconds: number;
    nanoseconds: number;
  };
}

export type WhisperData = WhisperPayload & {
    expired?: boolean;
};

// --- Card Actions ---

const VALID_CARDS = new Set(["card1", "card2", "card3", "card4", "card5", "card6"]);

const invalidState: CardState = { sends: 0, reads: 0, loaded: true, valid: false };

export async function getCardState(cardId: string): Promise<CardState> {
  // 1. Check if cardId is in the whitelist.
  if (!VALID_CARDS.has(cardId)) {
    return invalidState;
  }
  
  const ref = doc(db, 'cards', cardId);
  
  try {
    const snap = await getDoc(ref);

    // 2. Check if document exists in Firestore and is active.
    if (snap.exists()) {
      const data = snap.data();
      if(data.active !== true) {
        return invalidState;
      }
      return {
        sends: typeof data.sends === 'number' ? data.sends : 0,
        reads: typeof data.reads === 'number' ? data.reads : 0,
        loaded: true,
        valid: true,
      };
    } else {
      // 3. If card is in whitelist but not in DB, it's invalid. DO NOT CREATE IT.
      return invalidState;
    }
  } catch (error) {
    console.error("Error in getCardState: ", error);
    // Return an invalid state in case of any DB error.
    return invalidState;
  }
}

export async function useCard(cardId: string, type: 'send' | 'read'): Promise<CardState | {error: string}> {
    // This function should only be called for valid cards, but we double-check.
    if (!VALID_CARDS.has(cardId)) {
        return { error: "Invalid card ID provided for transaction." };
    }

    const ref = doc(db, 'cards', cardId);
    
    try {
        const finalState = await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(ref);
            if (!snap.exists() || snap.data().active !== true) {
                throw new Error("Card does not exist or is inactive.");
            }

            const data = snap.data();
            let currentSends = typeof data.sends === 'number' ? data.sends : 0;
            let currentReads = typeof data.reads === 'number' ? data.reads : 0;
            
            const fieldToDecrement = type === 'send' ? 'sends' : 'reads';
            const currentValue = type === 'send' ? currentSends : currentReads;

            if (currentValue <= 0) {
                 throw new Error(`No ${type}s remaining on this card.`);
            }
            
            const newFieldValue = currentValue - 1;
            
            transaction.update(ref, { 
                [fieldToDecrement]: newFieldValue,
                updatedAt: serverTimestamp()
            });

            return {
                sends: type === 'send' ? newFieldValue : currentSends,
                reads: type === 'read' ? newFieldValue : currentReads,
                loaded: true,
                valid: true,
            };
        });
        return finalState;
    } catch (error) {
        console.error("Transaction failed: ", error);
        if(error instanceof Error) {
            return { error: error.message };
        }
        return { error: "An unknown error occurred during the transaction." };
    }
}


// --- Whisper Actions ---

export async function saveWhisper(id: string, data: EncryptedData): Promise<void> {
  const payload: Omit<WhisperPayload, 'readAt'> = {
    ...data,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
    ts: Date.now(),
    status: 'waiting',
  }
  await setDoc(doc(db, 'whispers', id), payload);
}

export async function markAsRead(id: string): Promise<void> {
  await updateDoc(doc(db, 'whispers', id), {
    status: 'read',
    readAt: serverTimestamp(),
  });
}

export async function getWhisper(id: string): Promise<WhisperData | null> {
  const snap = await getDoc(doc(db, 'whispers', id));
  if (!snap.exists()) {
    return null;
  }
  
  const data = snap.data() as WhisperPayload;

  if (data.expiresAt && Date.now() > data.expiresAt) {
    // The message is expired. Delete it and inform the caller.
    await deleteWhisper(id);
    return { ...data, expired: true };
  }
  
  return data;
}

export async function deleteWhisper(id: string): Promise<void> {
  await deleteDoc(doc(db, 'whispers', id));
}

export async function checkWhisperExists(id: string): Promise<boolean> {
    const snap = await getDoc(doc(db, 'whispers', id));
    return snap.exists();
}

export async function generateNewId(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}
