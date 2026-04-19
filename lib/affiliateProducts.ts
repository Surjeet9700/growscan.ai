// lib/affiliateProducts.ts

export interface AffiliateProduct {
  brand: string;
  name: string;
  price: string;
  url: string;
  for: string[];
  tier2_available: boolean;
  image?: string;
}

export const ingredientProductMap: Record<string, AffiliateProduct[]> = {
  'niacinamide': [
    {
      brand: 'Minimalist',
      name: '10% Niacinamide Face Serum',
      price: '₹599 approx.',
      url: 'https://www.minimalistcare.com/products/niacinamide',
      for: ['pigmentation', 'oiliness', 'pores'],
      tier2_available: true
    },
    {
      brand: 'Plum',
      name: '10% Niacinamide Serum with Rice Water',
      price: '₹745 approx.',
      url: 'https://plumgoodness.com/products/10-niacinamide-serum-with-rice-water-30-ml',
      for: ['pigmentation', 'texture'],
      tier2_available: true
    }
  ],
  'salicylic_acid': [
    {
      brand: 'Minimalist',
      name: '2% Salicylic Acid Face Serum',
      price: '₹549 approx.',
      url: 'https://www.minimalistcare.com/products/salicylic-acid-2',
      for: ['acne_or_breakouts', 'pores', 'oiliness'],
      tier2_available: true
    },
    {
      brand: 'The Derma Co.',
      name: '2% Salicylic Acid Face Serum',
      price: '₹499 approx.',
      url: 'https://thedermaco.com/product/2-salicylic-acid-face-serum-for-active-acne-30-ml',
      for: ['acne_or_breakouts', 'pores'],
      tier2_available: true
    }
  ],
  'vitamin_c': [
    {
      brand: 'Minimalist',
      name: '10% Vitamin C Face Serum',
      price: '₹699 approx.',
      url: 'https://www.minimalistcare.com/products/vitamin-c-10-acetyl-glucosamine-1',
      for: ['pigmentation', 'dullness', 'texture'],
      tier2_available: true
    },
    {
      brand: 'Plum',
      name: '15% Vitamin C Face Serum',
      price: '₹790 approx.',
      url: 'https://plumgoodness.com/products/15-vitamin-c-face-serum-with-mandarin-30-ml',
      for: ['pigmentation', 'dullness'],
      tier2_available: true
    }
  ],
  'hyaluronic_acid': [
    {
      brand: 'Minimalist',
      name: '2% Hyaluronic Acid + B5',
      price: '₹599 approx.',
      url: 'https://www.minimalistcare.com/products/hyaluronic-acid-2-vitamin-b5',
      for: ['hydration', 'texture'],
      tier2_available: true
    },
    {
      brand: 'Loreal Paris',
      name: 'Revitalift 1.5% Hyaluronic Acid Serum',
      price: '₹999 approx.',
      url: 'https://www.nykaa.com/l-oreal-paris-revitalift-1-5-percentage-hyaluronic-acid-serum/p/782294',
      for: ['hydration', 'aging'],
      tier2_available: true
    }
  ],
  'retinol': [
    {
      brand: 'Minimalist',
      name: '0.3% Retinol Face Serum',
      price: '₹599 approx.',
      url: 'https://www.minimalistcare.com/products/retinol-0-3-q10',
      for: ['texture', 'aging', 'pores'],
      tier2_available: true
    },
    {
      brand: 'The Derma Co.',
      name: '0.3% Retinol Face Serum',
      price: '₹599 approx.',
      url: 'https://thedermaco.com/product/0-3-retinol-serum-for-fine-lines-wrinkles-30-ml',
      for: ['aging', 'pigmentation'],
      tier2_available: true
    }
  ],
  'spf': [
    {
      brand: 'The Derma Co.',
      name: '1% Hyaluronic Sunscreen Aqua Gel SPF 50',
      price: '₹499 approx.',
      url: 'https://thedermaco.com/product/1-hyaluronic-sunscreen-aqua-gel',
      for: ['spf', 'pigmentation', 'aging'],
      tier2_available: true
    },
    {
      brand: 'Minimalist',
      name: 'Sunscreen SPF 50 with Multi-vitamins',
      price: '₹399 approx.',
      url: 'https://www.minimalistcare.com/products/sunscreen-spf-50',
      for: ['spf', 'pigmentation'],
      tier2_available: true
    }
  ],
  'ceramide': [
    {
      brand: 'The Derma Co.',
      name: 'Ceramide + HA Intense Face Moisturizer',
      price: '₹349 approx.',
      url: 'https://thedermaco.com/product/ceramide-ha-intense-moisturizer-50g',
      for: ['dryness', 'barrier', 'hydration'],
      tier2_available: true
    },
    {
      brand: 'Dot & Key',
      name: 'Ceramide + Hyaluronic Skin Barrier Repair Moisturizer',
      price: '₹395 approx.',
      url: 'https://www.dotandkey.com/products/skin-barrier-repair-face-cream-with-ceramides-hyaluronic-acid',
      for: ['barrier', 'hydration'],
      tier2_available: true
    }
  ],
  'glycolic_acid': [
    {
      brand: 'Loreal Paris',
      name: 'Glycolic Bright Skin Brightening Serum',
      price: '₹749 approx.',
      url: 'https://www.nykaa.com/l-oreal-paris-glycolic-bright-skin-brightening-serum/p/5013915',
      for: ['pigmentation', 'texture', 'dullness'],
      tier2_available: true
    }
  ],
  'azelaic_acid': [
    {
      brand: 'The Derma Co.',
      name: '10% Azelaic Acid Face Serum',
      price: '₹499 approx.',
      url: 'https://thedermaco.com/product/10-azelaic-acid-face-serum',
      for: ['acne_or_breakouts', 'pigmentation', 'redness'],
      tier2_available: true
    }
  ],
  'kojic_acid': [
    {
      brand: 'The Derma Co.',
      name: '2% Kojic Acid Face Serum',
      price: '₹499 approx.',
      url: 'https://thedermaco.com/product/2-kojic-acid-face-serum-for-dark-spots-pigmentation-30ml',
      for: ['pigmentation', 'dark_spots'],
      tier2_available: true
    }
  ]
};

// Generic helper to find products by ingredient name or keyword
export function getProductsForIngredient(ingredientName: string): AffiliateProduct[] {
  if (!ingredientName) return [];
  
  // Normalize: lowercase, remove special chars, handle plurals
  const normalized = ingredientName.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim();
  const words = normalized.split(/\s+/);
  
  for (const [key, products] of Object.entries(ingredientProductMap)) {
    const keyClean = key.replace('_', ' ');
    
    // Check for direct inclusion or word-level matches (handles "Ceramides" vs "Ceramide")
    const isMatch = normalized.includes(keyClean) || 
                   words.some(word => 
                     word === keyClean || 
                     word === keyClean + 's' || 
                     (keyClean.endsWith('y') && word === keyClean.slice(0, -1) + 'ies')
                   );

    if (isMatch) {
      return products;
    }
  }
  
  return [];
}
