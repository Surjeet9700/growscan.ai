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
        
        <h2 className="text-xl font-bold text-ink pt-4">1. Digital Goods Policy</h2>
        <p>GlowScan provides non-tangible, irrevocable digital goods (Premium Scan Reports). As these reports are generated and delivered instantly to your dashboard upon payment, we <strong>do not issue refunds</strong> once the order is completed and the report is successfully generated.</p>
        
        <h2 className="text-xl font-bold text-ink pt-4">2. Exceptions (Technical Failures)</h2>
        <p>You may be eligible for a refund only if:</p>
        <ul className="list-disc ml-5 space-y-2 text-sm mt-2">
          <li>A technical error occurred during the payment-to-report generation process that prevented the report from being created.</li>
          <li>You were charged multiple times for a single successful scan.</li>
        </ul>

        <h2 className="text-xl font-bold text-ink pt-4">3. Request Pipeline</h2>
        <p>Refund requests must be submitted to <strong>support@glowscan.app</strong> within 7 days of the transaction. Please include your Razorpay Payment ID. Approved refunds will be processed back to the original payment method within 5-7 business days.</p>
      </div>
    </div>
  );
}
