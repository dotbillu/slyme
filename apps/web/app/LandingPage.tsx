"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Globe, ExternalLink } from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#5cb038]/30 selection:text-white overflow-hidden flex flex-col">
      {/* Hero Section - The Main Focus */}
      <main className="flex-1 flex flex-col items-center justify-center relative px-6 pt-20 min-h-screen">
        {/* Tech/Digital Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[500px] bg-[#5cb038]/5 blur-[120px] pointer-events-none rounded-full" />
        
        {/* Grid Pattern Overlay for Tech feel */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 py-12 md:py-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 md:mb-8">
              {"// MAP-BASED PROTOCOL"}
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-9xl font-black tracking-tighter mb-6 md:mb-8 leading-[0.95] md:leading-[0.85] uppercase">
              Stay <span className="text-white/20">Local</span>
              <br />
              <span className="text-white/20"> Go </span>
              Digital
            </h1>

            <p className="text-base md:text-xl text-zinc-500 max-w-2xl mx-auto mb-10 md:mb-12 leading-relaxed font-medium uppercase tracking-tight px-4 md:px-0">
              Connect to your city through geo-locked hubs and real-time coordinate discovery.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-5 px-4 md:px-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/explore")}
                className="w-full sm:w-auto group px-8 md:px-12 py-4 md:py-6 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-[#5cb038] hover:text-white transition-all shadow-2xl"
              >
                LAUNCH MAP
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer - The "Really Good" Section */}
      <footer className="py-16 md:py-24 px-6 border-t border-white/5 relative overflow-hidden bg-black">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[150px] bg-[#5cb038]/5 blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Image src="/slymelogo.png" alt="Slyme Logo" width={50} height={30} className="mx-auto mb-8 opacity-20 grayscale" />
          <h3 className="text-xl font-black mb-10 tracking-[0.3em] text-zinc-600 uppercase">Connect with the developer</h3>
          
          <div className="flex flex-col items-center gap-8">
            <div className="flex gap-4">
               <a href="mailto:abhay@dotbillu.in" className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center hover:bg-[#5cb038] hover:text-white transition-all duration-300 border border-white/5 group shadow-xl">
                  <Mail size={22} className="text-zinc-400 group-hover:text-white transition-colors" />
               </a>
               <a href="https://dotbillu.in" target="_blank" className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center hover:bg-[#5cb038] hover:text-white transition-all duration-300 border border-white/5 group shadow-xl">
                  <Globe size={22} className="text-zinc-400 group-hover:text-white transition-colors" />
               </a>
            </div>
            
            <div className="space-y-3">
              <p className="text-zinc-600 text-[11px] font-black tracking-[0.2em] uppercase">
                Designed & Developed by
              </p>
              <a 
                href="https://dotbillu.in" 
                target="_blank" 
                className="inline-flex flex-col items-center group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl md:text-3xl font-black text-white group-hover:text-[#5cb038] transition-colors tracking-tighter uppercase">
                    dotbillu
                  </span>
                  <ExternalLink size={20} className="text-zinc-600 group-hover:text-[#5cb038] transition-colors" />
                </div>
                <div className="h-1 w-0 group-hover:w-full bg-[#5cb038] transition-all duration-500 rounded-full mt-1" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
