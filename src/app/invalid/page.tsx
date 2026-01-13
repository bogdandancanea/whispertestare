
import { BanIcon } from '@/components/icons';
import Link from 'next/link';

export default function InvalidCardPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
        <header className="animate-slide-up text-center mb-10">
            <h1 className="logo animate-shimmer mb-3 bg-gradient-to-r from-white via-primary to-white bg-200% bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl" style={{textShadow: '0 0 80px hsl(var(--primary)/0.3)'}}>
            Whisper
            </h1>
        </header>

        <div className="animate-slide-up w-full max-w-md rounded-2xl border border-destructive/30 bg-card/80 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-destructive/50 bg-destructive/10">
                <BanIcon className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Card Invalid</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                The card ID you are trying to use does not exist or is no longer active. Please check the URL and try again.
            </p>
        </div>

        <Link href="/" className="animate-slide-up mt-8 text-sm text-muted-foreground transition-colors hover:text-primary">
            Return to a default card
        </Link>
    </div>
  );
}
