import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function RefundPolicy() {
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
        <h1 className="text-3xl font-black text-ink">Refund Policy</h1>
        <p className="text-sm">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-bold text-ink pt-4">1. Digital Goods</h2>
        <p>GlowScan provides a premium digital service (Full Skin Analysis Report). Due to the instant delivery and nature of digital goods, all sales are considered final once the report has been successfully generated and delivered.</p>
        
        <h2 className="text-xl font-bold text-ink pt-4">2. Technical Failures</h2>
        <p>If you made a payment but were unable to view or receive your premium report due to a technical server error, please contact us immediately to manually restore your premium scan or initiate a refund.</p>
        
        <h2 className="text-xl font-bold text-ink pt-4">3. Processing Time</h2>
        <p>Approved refunds are processed back to the original method of payment (via Razorpay) within 5-7 business days.</p>
      </div>
    </div>
  );
}
