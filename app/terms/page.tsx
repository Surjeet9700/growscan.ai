import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="px-6 pt-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-xl z-10 pb-4 border-b border-black/5">
        <Link href="/">
          <button className="w-10 h-10 rounded-full bg-white border border-black/5 flex items-center justify-center text-black/60 shadow-sm active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <span className="text-[10px] font-black uppercase tracking-widest text-black/40">GlowScan Legal</span>
      </div>
      <div className="px-6 pt-8 max-w-prose mx-auto font-medium text-black/80 space-y-6">
        <h1 className="text-3xl font-black text-ink">Terms & Conditions</h1>
        <p className="text-sm">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-bold text-ink pt-4">1. Acceptance of Terms</h2>
        <p>By accessing and using GlowScan, you accept and agree to be bound by the terms and provision of this agreement. Our skin analysis relies on an AI model; results are purely informational and should NOT be taken as medical advice.</p>
        
        <h2 className="text-xl font-bold text-ink pt-4">2. Service Description</h2>
        <p>GlowScan provides a digital analysis of the user's face mapping hydration, texture, and concerns utilizing computer vision AI. Standard scans are free, whereas detailed clinical-grade metric reports require a one-time purchase.</p>
        
        <h2 className="text-xl font-bold text-ink pt-4">3. Medical Disclaimer</h2>
        <p>The GlowScan service is NOT a substitute for professional dermatological advice, diagnosis, or treatment. Always seek the advice of your physician or qualified health provider.</p>
      </div>
    </div>
  );
}
