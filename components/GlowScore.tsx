export function GlowScore({ score }: { score: number }) {
  // Map score to a gradient color ring
  const percentage = (score / 10) * 100;
  
  return (
    <div className="relative flex items-center justify-center w-32 h-32 mx-auto">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray="283"
          strokeDashoffset={283 - (283 * percentage) / 100}
          className="text-primary drop-shadow-sm transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-stone-800 tracking-tighter">
          {score}<span className="text-xl text-muted-foreground font-normal">/10</span>
        </span>
      </div>
    </div>
  );
}
