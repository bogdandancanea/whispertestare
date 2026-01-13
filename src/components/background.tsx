export default function Background() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-gradient-to-br from-[#030305] via-[#050508] to-[#020204]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 animate-breathe1 rounded-full bg-[radial-gradient(circle,rgba(255,94,0,0.7)_0%,rgba(180,50,0,0.4)_40%,transparent_70%)] opacity-0 blur-2xl filter" />
          <div className="absolute h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 animate-breathe2 rounded-full bg-[radial-gradient(circle,rgba(138,43,226,0.7)_0%,rgba(75,0,130,0.4)_40%,transparent_70%)] opacity-0 blur-2xl filter" />
          <div className="absolute h-[750px] w-[750px] -translate-x-1/2 -translate-y-1/2 animate-breathe3 rounded-full bg-[radial-gradient(circle,rgba(0,200,83,0.65)_0%,rgba(0,100,50,0.35)_40%,transparent_70%)] opacity-0 blur-2xl filter" />
          <div className="absolute h-[650px] w-[650px] -translate-x-1/2 -translate-y-1/2 animate-breathe4 rounded-full bg-[radial-gradient(circle,rgba(220,20,60,0.7)_0%,rgba(139,0,0,0.4)_40%,transparent_70%)] opacity-0 blur-2xl filter" />
          <div className="absolute h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 animate-breathe5 rounded-full bg-[radial-gradient(circle,rgba(0,71,171,0.65)_0%,rgba(0,30,80,0.35)_40%,transparent_70%)] opacity-0 blur-2xl filter" />
          <div className="absolute h-[680px] w-[680px] -translate-x-1/2 -translate-y-1/2 animate-breathe6 rounded-full bg-[radial-gradient(circle,rgba(199,21,133,0.7)_0%,rgba(100,0,70,0.4)_40%,transparent_70%)] opacity-0 blur-2xl filter" />
        </div>
      </div>
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.018]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        }}
      />
    </>
  );
}
