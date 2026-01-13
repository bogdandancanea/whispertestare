
"use server";

import { db } from './firebase';
import { doc, getDoc, setDoc, deleteDoc, runTransaction, serverTimestamp } from 'firebase/firestore';

export type CardState = {
  sends: number;
  reads: number;
  loaded: boolean;
};

export type EncryptedData = {
  ct: string;
  salt: string;
  iv: string;
};

export type WhisperPayload = EncryptedData & {
  expiresAt: number;
  ts: number;
}

export type WhisperData = WhisperPayload & {
    expired?: boolean;
};

// --- Card Actions ---

export async function getCardState(cardId: string): Promise<CardState> {
  if (cardId === 'DEFAULT') {
    return { sends: 3, reads: 3, loaded: true };
  }
  
  const ref = doc(db, 'cards', cardId);
  
  try {
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      return {
        sends: typeof data.sends === 'number' ? data.sends : 0,
        reads: typeof data.reads === 'number' ? data.reads : 0,
        loaded: true,
      };
    } else {
      // Card doesn't exist, create it.
      const newCard = {
        sends: 3,
        reads: 3,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(ref, newCard);
      return {
        sends: newCard.sends,
        reads: newCard.reads,
        loaded: true,
      };
    }
  } catch (error) {
    console.error("Error in getCardState: ", error);
    // Return a safe, exhausted state in case of DB error
    return { sends: 0, reads: 0, loaded: true };
  }
}

export async function useCard(cardId: string, type: 'send' | 'read'): Promise<CardState | {error: string}> {
    if (cardId === 'DEFAULT') {
        // This is a client-side simulation for the demo card.
        // It doesn't persist, just returns the expected new state.
        const state = await getCardState(cardId);
        if (type === 'send') state.sends--;
        if (type === 'read') state.reads--;
        return state;
    }

    const ref = doc(db, 'cards', cardId);
    
    try {
        const finalState = await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(ref);
            if (!snap.exists()) {
                throw new Error("Card does not exist.");
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
  const payload: WhisperPayload = {
    ...data,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
    ts: Date.now(),
  }
  await setDoc(doc(db, 'whispers', id), payload);
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
