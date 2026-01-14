
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import {
  getCardState,
  useCard,
  saveWhisper,
  getWhisper,
  deleteWhisper,
  checkWhisperExists,
  generateNewId,
  markAsRead,
  CardState,
  WhisperData,
} from '@/lib/actions';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { encrypt as encryptMessage, decrypt as decryptMessage } from '@/lib/crypto';
import { useToast } from '@/hooks/use-toast';
import {
    BanIcon, CopyIcon, FlameIcon, HashIcon, KeyIcon, LockIcon, MessageIcon, ServerIcon, ShieldCheckIcon
} from './icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Mode = 'send' | 'read';
type View = 'form' | 'send-result' | 'read-result' | 'exhausted';
type LiveStatus = 'waiting' | 'read' | 'expired' | 'countdown' | null;

const destructionSequenceSender = [
  "CONFIRMED: Recipient has viewed the whisper.",
  "Initiating burn sequence...",
  "Revoking encryption keys.",
  "Neutralizing all server traces.",
  "COMPLETE: No evidence remains.",
];

const destructionSequenceReader = [
  "Passphrase accepted. Decrypting payload...",
  "Whisper unlocked. Integrity check: PASSED.",
  "This message will self-destruct after viewing.",
  "Arming burn sequence...",
  "DESTROYED: Silence restored.",
];


const sendSchema = z.object({
  passphrase: z.string().min(4, 'Passphrase must be at least 4 characters long.'),
  message: z.string().min(1, 'Message cannot be empty.'),
});
type SendFormData = z.infer<typeof sendSchema>;

const readSchema = z.object({
  id: z.string().length(6, 'Whisper ID must be 6 characters.').regex(/^[A-Z0-9]+$/, 'Invalid ID format.'),
  passphrase: z.string().min(1, 'Passphrase cannot be empty.'),
});
type ReadFormData = z.infer<typeof readSchema>;

const COUNTDOWN_DURATION = 45;

export default function WhisperApp({ cardId, initialState }: { cardId: string, initialState: CardState }) {
  const [mode, setMode] = useState<Mode>('send');
  const [view, setView] = useState<View>('form');
  const [cardState, setCardState] = useState<CardState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [resultId, setResultId] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Copy ID');
  const [liveStatus, setLiveStatus] = useState<LiveStatus>(null);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [isBurnTriggered, setIsBurnTriggered] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerColor, setTimerColor] = useState('text-foreground');


  const { toast } = useToast();
  const unsubscribeRef = useRef<() => void | undefined>();
  const countdownIntervalRef = useRef<NodeJS.Timeout | undefined>();
  const liveStatusRef = useRef(liveStatus);
  
  const sendForm = useForm<SendFormData>({ resolver: zodResolver(sendSchema), mode: 'onChange', defaultValues: { passphrase: '', message: '' } });
  const readForm = useForm<ReadFormData>({ resolver: zodResolver(readSchema), mode: 'onChange', defaultValues: { id: '', passphrase: '' } });

  const isCardExhausted = useMemo(() => cardState.sends <= 0 && cardState.reads <= 0, [cardState]);

  const handleCreateAnother = useCallback(() => {
    sendForm.reset();
    if (isCardExhausted) {
        setView('exhausted');
    } else {
        setView('form');
        setMode('send');
    }
    if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = undefined;
    }
    setLiveStatus(null);
    setSequenceIndex(0);
    setCountdown(null);
    setIsBurnTriggered(false);
    setResultId('');
    setResultMessage('');
  }, [isCardExhausted, sendForm]);
  
  const handleReadAnother = useCallback(() => {
    readForm.reset();
    if (isCardExhausted) {
        setView('exhausted');
    } else {
        setView('form');
        setMode('read');
    }
    setSequenceIndex(0);
    setLiveStatus(null);
    setIsBurnTriggered(false);
    setCountdown(null);
    setResultId('');
    setResultMessage('');
  }, [isCardExhausted, readForm]);

  const handleModeChange = (newMode: Mode) => {
    if (isLoading) return;
    setMode(newMode);
  };
  
  const isDestructionActive = useMemo(() => {
    if (view === 'send-result' && liveStatus === 'read') return true;
    if (view === 'read-result' && isBurnTriggered) return true;
    return false;
  }, [view, liveStatus, isBurnTriggered]);

  const destructionSequence = useMemo(() => {
    if (view === 'read-result') return destructionSequenceReader;
    if (view === 'send-result') return destructionSequenceSender;
    return [];
  }, [view]);

  useEffect(() => {
    setCardState(initialState);
    if (initialState.sends <= 0 && initialState.reads <= 0) {
      setView('exhausted');
    } else {
        setView('form');
    }
  }, [initialState, cardId]);
  
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    liveStatusRef.current = liveStatus;
  }, [liveStatus]);

  useEffect(() => {
    if (view === 'send-result' && resultId) {
      const docRef = doc(db, 'whispers', resultId);
      unsubscribeRef.current = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
            const data = snap.data() as WhisperData;
            if (data.status === 'read' && data.readAt && liveStatusRef.current !== 'countdown') {
                setLiveStatus('countdown');
                const readTime = data.readAt.seconds * 1000;
                const now = Date.now();
                const elapsed = Math.floor((now - readTime) / 1000);
                const remaining = Math.max(0, COUNTDOWN_DURATION - elapsed);
                setCountdown(remaining);
            }
        } else {
            if(liveStatusRef.current !== 'read') {
                setLiveStatus('read');
            }
        }
      });
    }
    
    return () => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = undefined;
        }
    }
  }, [view, resultId]);

  useEffect(() => {
    if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
    }
  
    if (countdown !== null && countdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
             if (view === 'read-result') {
                 setIsBurnTriggered(true);
             }
            return 0;
          }
          const next = prev - 1;
          if (next <= 10) {
            setTimerColor('text-accent-red');
          } else if (next <= 30) {
            setTimerColor('text-accent-orange');
          } else {
            setTimerColor('text-foreground');
          }
          return next;
        });
      }, 1000);
    } else if (countdown === 0) {
       if (view === 'read-result') {
           setIsBurnTriggered(true);
       }
    }
  
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [countdown, view]);


  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isDestructionActive) {
      setSequenceIndex(0);
      let currentStep = 0;
      
      if (view === 'read-result' && resultId) {
          deleteWhisper(resultId);
      }

      interval = setInterval(() => {
        setSequenceIndex(currentStep);
        currentStep++;

        if (currentStep >= destructionSequence.length) {
          clearInterval(interval!);
          setTimeout(() => {
            if (view === 'read-result') {
                 handleReadAnother();
            } else if (view === 'send-result') {
                 handleCreateAnother();
            }
          }, 2000);
        }
      }, 1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDestructionActive, destructionSequence, view, handleCreateAnother, handleReadAnother, resultId]);


  const onSendSubmit: SubmitHandler<SendFormData> = async (data) => {
    if (cardState.sends <= 0) {
      toast({ variant: 'destructive', title: 'No Sends Remaining', description: 'This card has no sends left.' });
      return;
    }
    setIsLoading(true);
    try {
      const newState = await useCard(cardId, 'send');
      if ('error' in newState) {
          throw new Error(newState.error);
      }
      setCardState(newState);

      const encryptedData = await encryptMessage(data.message, data.passphrase);
      
      let newId = await generateNewId();
      let attempts = 0;
      while (await checkWhisperExists(newId) && attempts < 10) {
        newId = await generateNewId();
        attempts++;
      }

      if (attempts >= 10) {
        throw new Error("Failed to generate a unique whisper ID.");
      }

      await saveWhisper(newId, encryptedData);

      setResultId(newId);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      setView('send-result');

    } catch (error) {
      toast({ variant: 'destructive', title: 'Operation Failed', description: error instanceof Error ? error.message : 'Could not complete the send operation.' });
      const currentState = await getCardState(cardId);
      if(!('error' in currentState)) {
        setCardState(currentState)
      };
    } finally {
      setIsLoading(false);
    }
  };

  const onReadSubmit: SubmitHandler<ReadFormData> = async (data) => {
    if (cardState.reads <= 0) {
        toast({ variant: 'destructive', title: 'No Reads Remaining', description: 'This card has no reads left.' });
        return;
    }
    setIsLoading(true);
    try {
        const whisper = await getWhisper(data.id);
        
        if (!whisper) {
            toast({ variant: 'destructive', title: 'Not Found', description: 'Whisper not found or already burned.' });
            setIsLoading(false);
            return;
        }
        if (whisper.expired) {
            toast({ variant: 'destructive', title: 'Expired', description: 'This whisper has expired and was auto-destroyed.' });
            setIsLoading(false);
            return;
        }

        const message = await decryptMessage(whisper.ct, whisper.salt, whisper.iv, data.passphrase);
        
        const newState = await useCard(cardId, 'read');
        if ('error' in newState) {
            throw new Error(newState.error);
        }
        setCardState(newState);
        
        await markAsRead(data.id);
        
        setResultMessage(message);
        setResultId(data.id);
        setCountdown(COUNTDOWN_DURATION);
        setTimerColor('text-foreground');
        setLiveStatus('countdown');

        window.scrollTo({ top: 0, behavior: 'smooth' });

        setView('read-result');

    } catch (error) {
        toast({ variant: 'destructive', title: 'Decryption Failed', description: error instanceof Error && error.message.includes('No reads remaining') ? error.message : 'Could not decrypt whisper.' });
        const currentState = await getCardState(cardId);
        if(!('error' in currentState)) {
            setCardState(currentState);
        }
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleCopyId = () => {
    navigator.clipboard.writeText(resultId);
    setCopyButtonText('Copied!');
    setTimeout(() => setCopyButtonText('Copy ID'), 2000);
  };
  
  const renderHeaderContent = () => {
    if (isDestructionActive) {
      return (
        <div className="flex min-h-[4rem] items-center justify-center">
            <div className="flex items-center gap-3 font-mono text-base tracking-wide text-primary">
                {sequenceIndex < destructionSequence.length - 1 ? (
                    <div className="relative z-10 h-4 w-4 flex-shrink-0 animate-spin-fast rounded-full border-2 border-primary/40 border-t-primary" />
                ) : (
                    <FlameIcon className="h-4 w-4 flex-shrink-0 text-destructive" />
                )}
                <span className={cn(sequenceIndex >= destructionSequence.length - 1 && 'text-destructive')}>{destructionSequence[sequenceIndex]}</span>
            </div>
        </div>
      );
    }
    if (liveStatus === 'countdown' && countdown !== null) {
         return (
            <div className="flex min-h-[4rem] items-center justify-center">
                <div className={cn("font-mono text-2xl font-semibold tracking-wider", timerColor)}>
                    {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
                </div>
            </div>
        );
    }
    return (
        <div className="flex min-h-[4rem] items-center justify-center">
            <p className="text-base leading-relaxed text-foreground/75">
              End-to-end encrypted messages<br />that self-destruct after reading
            </p>
        </div>
    );
  };


  const renderForm = () => (
    <div className={cn('relative rounded-3xl border border-[hsl(var(--border))] bg-card/80 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl before:absolute before:left-0 before:top-0 before:h-px before:w-full before:bg-gradient-to-r before:from-transparent before:via-[hsl(var(--primary)/0.3)] before:to-transparent', { 'hidden': view !== 'form' })}>
      {/* Send Form */}
      <form onSubmit={sendForm.handleSubmit(onSendSubmit)} className={cn({ 'hidden': mode !== 'send' })}>
        <div className="mb-6 space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground/75"><KeyIcon className="h-4 w-4 text-primary" />Secret Passphrase</label>
          <Input type="password" placeholder="Create a strong passphrase" {...sendForm.register('passphrase')} className="h-14 rounded-xl border-[hsl(var(--primary)/0.25)] bg-card/80 p-5 text-base placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_4px_hsl(var(--primary)/0.15),0_0_30px_hsl(var(--primary)/0.1)]" />
          {sendForm.formState.errors.passphrase && <p className="text-sm text-destructive">{sendForm.formState.errors.passphrase.message}</p>}
        </div>
        <div className="mb-6 space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground/75"><MessageIcon className="h-4 w-4 text-primary" />Your Secret Message</label>
          <Textarea placeholder="Type your confidential message..." {...sendForm.register('message')} className="min-h-[140px] rounded-xl border-[hsl(var(--primary)/0.25)] bg-card/80 p-5 text-base placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_4px_hsl(var(--primary)/0.15),0_0_30px_hsl(var(--primary)/0.1)]" />
          {sendForm.formState.errors.message && <p className="text-sm text-destructive">{sendForm.formState.errors.message.message}</p>}
        </div>
        <Button type="submit" disabled={isLoading || cardState.sends <= 0} className="group relative h-16 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#c9a227] text-lg font-bold text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.4)] transition-all hover:translate-y-[-3px] hover:shadow-[0_8px_30px_hsl(var(--primary)/0.5)] active:translate-y-0 disabled:opacity-40 disabled:transform-none disabled:shadow-none">
           {isLoading ? <span className="animate-spin-fast inline-block h-5 w-5 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full" /> : 'Encrypt & Send'}
           <span className="absolute left-[-100%] top-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-700 group-hover:left-full" />
        </Button>
      </form>
      
      {/* Read Form */}
       <form onSubmit={readForm.handleSubmit(onReadSubmit)} className={cn({ 'hidden': mode !== 'read' })}>
        <div className="mb-6 space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground/75"><HashIcon className="h-4 w-4 text-primary" />Whisper ID</label>
          <Input 
              {...readForm.register('id')}
              placeholder="ABC123"
              maxLength={6}
              autoComplete="off"
              onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  readForm.setValue('id', e.target.value);
              }}
              className="h-20 rounded-xl border-[hsl(var(--primary)/0.25)] bg-card/80 p-5 text-center font-code text-4xl font-semibold tracking-[6px] placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_4px_hsl(var(--primary)/0.15),0_0_30px_hsl(var(--primary)/0.1)]" 
          />
           {readForm.formState.errors.id && <p className="text-sm text-destructive">{readForm.formState.errors.id.message}</p>}
        </div>
        <div className="mb-6 space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground/75"><KeyIcon className="h-4 w-4 text-primary" />Secret Passphrase</label>
          <Input type="password" placeholder="Enter the passphrase" {...readForm.register('passphrase')} className="h-14 rounded-xl border-[hsl(var(--primary)/0.25)] bg-card/80 p-5 text-base placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_4px_hsl(var(--primary)/0.15),0_0_30px_hsl(var(--primary)/0.1)]" />
           {readForm.formState.errors.passphrase && <p className="text-sm text-destructive">{readForm.formState.errors.passphrase.message}</p>}
        </div>
        <Button type="submit" disabled={isLoading || cardState.reads <= 0} className="group relative h-16 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#c9a227] text-lg font-bold text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.4)] transition-all hover:translate-y-[-3px] hover:shadow-[0_8px_30px_hsl(var(--primary)/0.5)] active:translate-y-0 disabled:opacity-40 disabled:transform-none disabled:shadow-none">
           {isLoading ? <span className="animate-spin-fast inline-block h-5 w-5 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full" /> : 'Decrypt & Read'}
           <span className="absolute left-[-100%] top-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-700 group-hover:left-full" />
        </Button>
      </form>
  </div>
  );

  const renderSendResult = () => (
    <div className={cn("text-center", { 'hidden': view !== 'send-result' })}>
      <div className="relative my-8 rounded-2xl border border-[hsl(var(--border))] bg-card/90 p-7 backdrop-blur-xl before:absolute before:left-0 before:top-0 before:h-px before:w-full before:bg-gradient-to-r before:from-transparent before:via-[hsl(var(--primary)/0.4)] before:to-transparent">
          <div className="mb-4 text-xs font-bold uppercase tracking-[2px] text-primary">Your Whisper ID</div>
          <div className="mb-5 font-code text-5xl font-bold tracking-[8px] text-foreground">{resultId}</div>
          <Button variant="ghost" onClick={handleCopyId} className="h-auto rounded-full border border-border bg-input px-7 py-3.5 text-sm font-semibold text-foreground/75 hover:border-primary hover:bg-card hover:text-primary hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
              <CopyIcon className="mr-2.5 h-5 w-5" />
              {copyButtonText}
          </Button>
      </div>

      <Button onClick={handleCreateAnother} variant="outline" className="h-14 w-full rounded-xl border-border bg-transparent text-base font-semibold hover:bg-card/90">Create Another Whisper</Button>
    </div>
  );

  const renderReadResult = () => (
    <div className={cn("text-center", { 'hidden': view !== 'read-result' })}>
        <div className="my-8 rounded-2xl border border-[hsl(var(--border))] bg-card/90 p-6 text-left">
            <p className="whitespace-pre-wrap break-words text-lg leading-relaxed text-foreground">{resultMessage}</p>
        </div>

        <Button onClick={handleReadAnother} variant="outline" className="h-14 w-full rounded-xl border-border bg-transparent text-base font-semibold hover:bg-card/90">Read Another Whisper</Button>
    </div>
);

  const renderExhausted = () => (
    <div className={cn("py-10 text-center", { 'hidden': view !== 'exhausted' })}>
      <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-border bg-card/80"><BanIcon className="h-12 w-12 text-muted-foreground" /></div>
      <h2 className="text-3xl font-bold">Card Exhausted</h2>
      <p className="mx-auto mt-4 max-w-xs text-base leading-relaxed text-foreground/75">
        This card has no remaining credits.
      </p>
       <div className="group relative mt-8 mx-auto w-full max-w-xs">
            <button className="group relative h-16 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#c9a227] text-lg font-bold text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.4)] transition-all hover:translate-y-[-3px] hover:shadow-[0_8px_30px_hsl(var(--primary)/0.5)] active:translate-y-0 disabled:opacity-40 disabled:transform-none disabled:shadow-none">
                Tap to Add Credits
                <span className="absolute left-[-100%] top-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-700 group-hover:left-full" />
            </button>
        </div>
    </div>
  );


  return (
    <div className="flex flex-col">
      <header className="animate-slide-up text-center">
        <div className="mx-auto mb-6 inline-flex animate-border-glow items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.25)] bg-gradient-to-br from-[hsl(var(--primary)/0.15)] to-[hsl(var(--primary)/0.05)] px-4 py-2 backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]"></span>
          <span className="text-xs font-semibold uppercase tracking-[2px] text-primary">Military-Grade Encryption</span>
        </div>
        <h1 className="logo animate-shimmer mb-3 bg-gradient-to-r from-white via-primary to-white bg-200% bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl" style={{textShadow: '0 0 80px hsl(var(--primary)/0.3)'}}>
          Whisper
        </h1>
        {renderHeaderContent()}
      </header>
      
      <main>
          <div className="my-8 animate-slide-up rounded-2xl border border-[hsl(var(--border))] bg-card/80 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <div className="flex justify-around">
              <div className="text-center">
                <div className={cn("text-4xl font-bold font-sans", cardState.sends === 1 && 'text-accent-orange', cardState.sends === 0 && 'text-accent-red')}>{cardState.sends}</div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sends Left</div>
              </div>
              <div className="w-px bg-gradient-to-b from-transparent via-border to-transparent" />
              <div className="text-center">
                <div className={cn("text-4xl font-bold font-sans", cardState.reads === 1 && 'text-accent-orange', cardState.reads === 0 && 'text-accent-red')}>{cardState.reads}</div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Reads Left</div>
              </div>
            </div>
          </div>
          
          <div className={cn({ 'hidden': view === 'exhausted' })}>
            <div className="animate-slide-up mb-6 flex rounded-2xl border border-[hsl(var(--border))] bg-card/80 p-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.2)] backdrop-blur-xl">
              <button onClick={() => handleModeChange('send')} className={cn("flex-1 rounded-xl py-4 text-base font-semibold transition-all", mode === 'send' ? 'bg-gradient-to-br from-primary to-[#c9a227] text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.4)] animate-glow' : 'bg-transparent text-muted-foreground hover:text-foreground/75')}>Send</button>
              <button onClick={() => handleModeChange('read')} className={cn("flex-1 rounded-xl py-4 text-base font-semibold transition-all", mode === 'read' ? 'bg-gradient-to-br from-primary to-[#c9a227] text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.4)] animate-glow' : 'bg-transparent text-muted-foreground hover:text-foreground/75')}>Read</button>
            </div>
            
            <div className="relative animate-slide-up">
                {renderForm()}
                {renderSendResult()}
                {renderReadResult()}
            </div>
          </div>
          
          {renderExhausted()}

          {/* Security Section */}
          <section className="animate-slide-up mt-10 rounded-3xl border border-[hsl(var(--border))] bg-card/80 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-8">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-5 inline-flex items-center gap-2.5 rounded-full border border-green-400/30 bg-gradient-to-br from-green-500/20 to-green-500/5 px-5 py-2.5 shadow-[0_0_30px_rgba(0,230,118,0.1)]">
                  <ShieldCheckIcon className="h-5 w-5 text-green-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-green-400">Verified Secure</span>
                </div>
                <h3 className="mb-3 text-2xl font-bold sm:text-3xl">Military-Grade Encryption</h3>
                <p className="mx-auto max-w-md text-base leading-relaxed text-foreground/75">Proprietary encryption protocols ensure your communications remain beyond the reach of any third party.</p>
              </div>
              <div className="space-y-4">
                  {[
                      { icon: LockIcon, title: 'Unbreakable Algorithm', text: 'AES-256-GCM encryption — the gold standard for top-secret information worldwide.' },
                      { icon: KeyIcon, title: 'Fortified Key Derivation', text: 'PBKDF2 with 310,000 iterations transforms your passphrase into a quantum-resistant key.' },
                      { icon: ServerIcon, title: 'Ghost Protocol Architecture', text: 'All encryption happens in your browser. We never see your messages, ever.' },
                  ].map((item, i) => (
                      <div key={i} className="flex items-start gap-4 rounded-2xl border border-[hsl(var(--border))] bg-card/80 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-[0_15px_40px_rgba(0,0,0,0.2)]">
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary)/0.2)] to-[hsl(var(--primary)/0.05)] shadow-[0_0_20px_hsl(var(--primary)/0.1)]">
                              <item.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                              <h4 className="font-bold">{item.title}</h4>
                              <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </section>
      </main>

      <footer className="mt-auto pt-10 text-center">
        <p className="text-xs tracking-widest text-muted-foreground/50">
          © {new Date().getFullYear()} WHISPER INC. ALL RIGHTS RESERVED.
        </p>
        <p className="mt-1 text-xs tracking-widest text-muted-foreground/30">
          A DIVISION OF THE SILENTIUM PROTOCOL
        </p>
      </footer>
    </div>
  );
}

    

