"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, Search, ShoppingBag, Star } from "lucide-react";
import { useState } from "react";

const CATEGORIES = ["All", "Serum", "Moisturizer", "Sunscreen", "Toner", "Retinol"];

const PRODUCTS = [
  { name: "Tarte Serum",           brand: "Tarte",      price: "₹2,400",  rating: 4.5, category: "Serum"      },
  { name: "Anua Serum",            brand: "Anua",       price: "₹1,280",  rating: 4.7, category: "Serum"      },
  { name: "Skin Moisturizer",      brand: "Klairs",     price: "₹1,800",  rating: 4.3, category: "Moisturizer"},
  { name: "SPF 50+ Sunscreen",     brand: "Round Lab",  price: "₹950",    rating: 4.6, category: "Sunscreen"  },
  { name: "Retinol Night Cream",   brand: "COSRX",      price: "₹2,100",  rating: 4.4, category: "Retinol"    },
  { name: "Hydrating Toner",       brand: "Some By Mi", price: "₹1,100",  rating: 4.2, category: "Toner"      },
  { name: "Vitamin C Serum",       brand: "Iunik",      price: "₹1,600",  rating: 4.8, category: "Serum"      },
  { name: "Ceramide Moisturizer",  brand: "Cerave",     price: "₹1,450",  rating: 4.5, category: "Moisturizer"},
];

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [liked, setLiked] = useState<Set<number>>(new Set());

  const filtered =
    activeCategory === "All"
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === activeCategory);

  const toggleLike = (i: number) => {
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-36 font-[var(--font-poppins)]">

      {/* ── HEADER ── */}
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-[22px] font-black text-[#1A1A1A]">Shop</h1>
        <p className="text-[13px] text-[#9A9A9A] mt-0.5">
          AI-recommended products for your skin
        </p>
      </div>

      {/* ── SEARCH ── */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-3 bg-white rounded-[16px] px-4 h-12 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <Search className="w-4 h-4 text-[#BBBBBB]" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Search products..."
            className="flex-1 bg-transparent text-[14px] text-[#1A1A1A] placeholder-[#BBBBBB] outline-none"
          />
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <div className="flex gap-2 px-5 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-semibold transition-all duration-200 ${
              activeCategory === cat
                ? "bg-[#A377D2] text-white shadow-[0_3px_10px_rgba(163,119,210,0.3)]"
                : "bg-white text-[#9A9A9A] shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── PRODUCTS GRID ── */}
      <div className="px-5 grid grid-cols-2 gap-3">
        {filtered.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white rounded-[20px] p-3 shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
          >
            <div className="w-full h-28 bg-[#F3EEFB] rounded-[14px] mb-3 relative flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-[#A377D2]/30" />
              <button
                onClick={() => toggleLike(i)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm"
              >
                <Heart
                  className="w-3.5 h-3.5"
                  fill={liked.has(i) ? "#A377D2" : "none"}
                  stroke={liked.has(i) ? "#A377D2" : "#BBBBBB"}
                />
              </button>
            </div>
            <p className="text-[10px] text-[#9A9A9A]">{p.brand}</p>
            <p className="text-[13px] font-bold text-[#1A1A1A] leading-tight line-clamp-1">{p.name}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 text-amber-400" fill="#FBBF24" />
              <span className="text-[11px] text-[#9A9A9A]">{p.rating}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[14px] font-black text-[#A377D2]">{p.price}</span>
              <button className="w-7 h-7 rounded-full bg-[#A377D2] flex items-center justify-center shadow-[0_2px_8px_rgba(163,119,210,0.3)]">
                <span className="text-white text-[16px] font-bold leading-none -mt-0.5">+</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
