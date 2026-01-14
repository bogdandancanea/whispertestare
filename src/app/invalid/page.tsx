
import { BanIcon } from '@/components/icons';

export default function InvalidCardPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
        <header className="animate-slide-up text-center mb-10">
            <h1 className="logo animate-shimmer mb-3 bg-gradient-to-r from-white via-primary to-white bg-200% bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl" style={{textShadow: '0 0 80px hsl(var(--primary)/0.3)'}}>
            Whisper
            </h1>
        </header>

        <div className="animate-slide-up w-full max-w-md rounded-2xl border border-destructive/30 bg-card/80 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-destructive/50 bg-destructive/10">
                <BanIcon className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Invalid NFC Card</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                This card is not activated.
            </p>
        </div>

        <div className="animate-slide-up group relative mt-8 w-full max-w-md">
            <button className="group relative h-16 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#c9a227] text-lg font-bold text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.4)] transition-all hover:translate-y-[-3px] hover:shadow-[0_8px_30px_hsl(var(--primary)/0.5)] active:translate-y-0 disabled:opacity-40 disabled:transform-none disabled:shadow-none">
                Tap to Activate
                <span className="absolute left-[-100%] top-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-700 group-hover:left-full" />
            </button>
        </div>

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
