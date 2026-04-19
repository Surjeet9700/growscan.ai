import Link from "next/link";
import { ArrowLeft, Mail, MapPin } from "lucide-react";

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="px-6 pt-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-xl z-10 pb-4 border-b border-black/5">
        <Link href="/">
          <button className="w-10 h-10 rounded-full bg-white border border-black/5 flex items-center justify-center text-black/60 shadow-sm active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <span className="text-[10px] font-black uppercase tracking-widest text-black/40">GlowScan Support</span>
      </div>
      <div className="px-6 pt-8 max-w-prose mx-auto font-medium text-black/80 space-y-6">
        <h1 className="text-3xl font-black text-ink">Contact Us</h1>
        <p>We are here to help you. Reach out to the GlowScan team for any technical support, questions about your report, or business inquiries.</p>
        
        <div className="mt-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-bold text-ink">Email Support</h3>
              <p className="text-sm">support@glowscan.app</p>
              <p className="text-xs text-black/40 mt-1">We typically reply within 24 hours.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-bold text-ink">Business Address</h3>
              <p className="text-sm">India</p>
              <p className="text-xs text-black/40 mt-1">(Please contact via email for operational queries)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
