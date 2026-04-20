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
        <p>By using GlowScan, you agree to these terms. Our skin analysis is powered by Artificial Intelligence and is for <strong>educational purposes only</strong>. It is not a clinical diagnosis.</p>
        
        <h2 className="text-xl font-bold text-ink pt-4">2. Medical Disclaimer</h2>
        <p>GlowScan is NOT a medical device. Results should not be used for medical diagnosis, treatment, or prevention of skin diseases. Always consult a board-certified dermatologist for medical skin concerns. You use the information provided at your own risk.</p>
        
        <h2 className="text-xl font-bold text-ink pt-4">3. Affiliate Links & Recommendations</h2>
        <p>GlowScan provides curated skincare recommendations. Some links to third-party stores (like Amazon, Myntra, or Nykaa) are affiliate links managed via <strong>Cuelinks</strong>. We earn a commission on qualifying purchases. We are not responsible for the products, delivery, or transactions occurring on third-party websites.</p>

        <h2 className="text-xl font-bold text-ink pt-4">4. Digital Services</h2>
        <p>Premium Scan Reports are delivered instantly upon payment verification. Access to these reports is tied to your account and local browser cache. We reserve the right to modify the AI models and reporting structure at any time.</p>
      </div>
    </div>
  );
}
