import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
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
        <h1 className="text-3xl font-black text-ink">Privacy Policy</h1>
        <p className="text-sm">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-bold text-ink pt-4">1. Information We Collect</h2>
        <p>We collect face scans to provide AI-based skin analysis. We do NOT permanently store your images on our servers. Images are processed temporarily for the duration of the scan and then discarded. We collect basic account information via securely encrypted third-party providers (Clerk).</p>
        
        <h2 className="text-xl font-bold text-ink pt-4">2. How We Use Your Information</h2>
        <p>Your data is used entirely to formulate personalized skincare recommendations, track your skin progress over time (using metric data only), and process transactions. We do not sell your personal data.</p>
        
        <h2 className="text-xl font-bold text-ink pt-4">3. Data Security</h2>
        <p>We implement a variety of security measures to maintain the safety of your personal information. Payment processing is handled by Razorpay securely.</p>
      </div>
    </div>
  );
}
