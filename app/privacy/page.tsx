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
        <p>GlowScan collects facial analysis data to provide skincare insights. Highlights of our data handling:</p>
        <ul className="list-disc ml-5 space-y-2 text-sm mt-2">
          <li><strong>No Photo Storage</strong>: Your face photographs are processed in temporary server memory and permanently deleted within 30 seconds of the scan. We do NOT store your images.</li>
          <li><strong>Progress Data</strong>: We store numerical skin metrics (scores and zone descriptors) in your browser's LocalStorage to allow you to track progress.</li>
          <li><strong>Account Data</strong>: Basic identity information is managed securely via Clerk.</li>
        </ul>

        <h2 className="text-xl font-bold text-ink pt-4">2. Affiliate & Third-Party Disclosure</h2>
        <p>GlowScan is a participant in the <strong>Cuelinks</strong> affiliate advertising program. We recommend skincare products based on your AI scan results. Clicking on these links may result in a commission for GlowScan at no additional cost to you. We do not share your facial data with these third-party merchants.</p>
        
        <h2 className="text-xl font-bold text-ink pt-4">3. How We Use Data</h2>
        <p>Your data is used solely to generate personalized skin reports, provide product recommendations, and process payments via <strong>Razorpay</strong>. We never sell your personal metrics to third-party data brokers.</p>
        
        <h2 className="text-xl font-bold text-ink pt-4">4. Security</h2>
        <p>We use industry-standard encryption to protect your account and transaction data. Since we do not store facial images, the risk of biometric data leaks is eliminated by design.</p>
      </div>
    </div>
  );
}
