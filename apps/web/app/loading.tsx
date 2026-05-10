export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center">
      <div>
        <img src="/slymelogo.png" alt="logo" className="w-30 h-auto" />
      </div>
      <p className="absolute bottom-10 left-1/2 -translate-x-1/2 font-bold text-green-500 tracking-widest flex gap-2">
        <span className="text-2xl">SLYME</span>
        <span className="text-zinc-200 text-xl">by dotbillu</span>
      </p>
    </div>
  );
}
