// app/api/products/route.ts
// Amazon PA-API product search endpoint
// Falls back to static affiliate data if Amazon keys are not configured

import { NextRequest, NextResponse } from "next/server";

// ── Static fallback products (used if Amazon keys not set) ───────────────────
const STATIC_FALLBACK: Record<string, StaticProduct[]> = {
  niacinamide: [
    {
      asin: "STATIC001",
      title: "Minimalist Niacinamide 10% + Zinc 1% Face Serum 30ml",
      brand: "Minimalist",
      image: null,
      price: "₹599",
      url: "https://www.minimalistcare.com/products/niacinamide",
    },
  ],
  "salicylic acid": [
    {
      asin: "STATIC002",
      title: "Minimalist 2% Salicylic Acid Face Serum 30ml",
      brand: "Minimalist",
      image: null,
      price: "₹549",
      url: "https://www.minimalistcare.com/products/salicylic-acid-2",
    },
  ],
  "hyaluronic acid": [
    {
      asin: "STATIC003",
      title: "Minimalist 2% Hyaluronic Acid + B5 Face Serum 30ml",
      brand: "Minimalist",
      image: null,
      price: "₹599",
      url: "https://www.minimalistcare.com/products/hyaluronic-acid-2-vitamin-b5",
    },
  ],
  "vitamin c": [
    {
      asin: "STATIC004",
      title: "Minimalist 10% Vitamin C Face Serum 30ml",
      brand: "Minimalist",
      image: null,
      price: "₹699",
      url: "https://www.minimalistcare.com/products/vitamin-c-10-acetyl-glucosamine-1",
    },
  ],
  retinol: [
    {
      asin: "STATIC005",
      title: "Minimalist 0.3% Retinol Face Serum 30ml",
      brand: "Minimalist",
      image: null,
      price: "₹599",
      url: "https://www.minimalistcare.com/products/retinol-0-3-q10",
    },
  ],
};

interface StaticProduct {
  asin: string;
  title: string;
  brand: string;
  image: string | null;
  price: string;
  url: string;
}

// ── Normalize keyword for static lookup ─────────────────────────────────────
function matchStaticKey(keyword: string): StaticProduct[] | null {
  const kw = keyword.toLowerCase().trim();
  for (const [key, products] of Object.entries(STATIC_FALLBACK)) {
    if (kw.includes(key) || key.includes(kw.split(" ")[0])) {
      return products;
    }
  }
  return null;
}

// ── Amazon PA-API config ─────────────────────────────────────────────────────
const AMAZON_CONFIG = {
  AccessKey: process.env.AMAZON_ACCESS_KEY,
  SecretKey: process.env.AMAZON_SECRET_KEY,
  PartnerTag: process.env.AMAZON_PARTNER_TAG, // e.g. "glowscan-21"
  PartnerType: "Associates",
  Marketplace: "www.amazon.in",
};

const amazonConfigured =
  !!AMAZON_CONFIG.AccessKey &&
  !!AMAZON_CONFIG.SecretKey &&
  !!AMAZON_CONFIG.PartnerTag;

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get("q");
  if (!keyword) return NextResponse.json([]);

  // ── If Amazon API is not configured, return static fallback ─────────────
  if (!amazonConfigured) {
    const staticProducts = matchStaticKey(keyword);
    if (staticProducts) return NextResponse.json(staticProducts);
    return NextResponse.json([]);
  }

  // ── Amazon PA-API search ─────────────────────────────────────────────────
  try {
    // Dynamic import with string eval to prevent TS static analysis error
    // when amazon-paapi is not yet installed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const amazonPaapi = await (eval('import("amazon-paapi")') as Promise<any>).catch(() => null);

    if (!amazonPaapi) {
      // Package not installed yet — return static fallback
      const staticProducts = matchStaticKey(keyword);
      return NextResponse.json(staticProducts ?? []);
    }

    const params = {
      Keywords: keyword,
      SearchIndex: "BeautyRotary", // Amazon India beauty category
      ItemCount: 3,
      Resources: [
        "Images.Primary.Large",
        "ItemInfo.Title",
        "Offers.Listings.Price",
        "ItemInfo.ByLineInfo",
      ],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await (amazonPaapi as any).SearchItems(AMAZON_CONFIG, params);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (data as any).SearchResult?.Items ?? [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const products = items.map((item: any) => ({
      asin: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue ?? "Skincare Product",
      brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue ?? "Brand",
      image: item.Images?.Primary?.Large?.URL ?? null,
      price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount ?? null,
      url: item.DetailPageURL, // already tagged with affiliate ID
    }));

    return NextResponse.json(products);
  } catch (err) {
    console.error("[/api/products] Amazon PA-API error:", err);
    // On error, serve static fallback
    const staticProducts = matchStaticKey(keyword);
    return NextResponse.json(staticProducts ?? []);
  }
}
