/**
 * Intelligent, product-aware recommendation engine for Chashmalay Eyewear.
 * 
 * Prioritization:
 * 1. Related frames from the same brand/collection first.
 * 2. Similar shape, design notes, style, material, color, and category.
 * 3. Graceful fallback to similar products from other brands if same-brand is limited.
 * 4. Deterministic per-product affinity jitter to eliminate repetitive duplicate lists across pages.
 */

// Common words to exclude when extracting distinctive model line / collection keywords
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'for', 'in', 'on', 'with', 'by', 'at', 'of',
  'frame', 'frames', 'glasses', 'eyeglasses', 'sunglasses', 'eyewear', 'lens',
  'lenses', 'unisex', 'men', 'women', 'mens', 'womens', 'male', 'female',
  'edition', 'luxury', 'collection', 'pair', 'pack', 'classic', 'standard',
  'new', 'best', 'premium', 'high', 'quality', 'optical', 'spectacles'
]);

/**
 * Extracts distinctive tokens from a product name, brand, or model.
 */
function extractTokens(str = '') {
  if (!str || typeof str !== 'string') return [];
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
}

/**
 * Computes a deterministic pseudo-random float between 0 and 5
 * based on hashing (currentProductId + candidateId).
 * This ensures two different product pages don't show the exact same
 * tie-broken list of models, while keeping the output 100% deterministic per page.
 */
function getProductAffinityJitter(currentId = '', candidateId = '') {
  const combined = `${currentId}:${candidateId}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 1000) / 200; // Value between 0.00 and 4.99
}

/**
 * Checks if a candidate's colors overlap with the current product's colors.
 */
function hasColorMatch(currentProduct, candidate) {
  const getColors = (p) => {
    const list = [];
    if (p.color) list.push(p.color.toLowerCase());
    if (p.frame_color) list.push(p.frame_color.toLowerCase());
    if (Array.isArray(p.colors)) {
      p.colors.forEach(c => {
        if (c?.name) list.push(c.name.toLowerCase());
      });
    }
    return list;
  };

  const currentColors = getColors(currentProduct);
  const candidateColors = getColors(candidate);

  return currentColors.some(c1 => 
    candidateColors.some(c2 => c1.includes(c2) || c2.includes(c1))
  );
}

/**
 * Calculates a comprehensive similarity and relevance score between currentProduct and candidate.
 */
export function calculateProductRelevance(currentProduct, candidate) {
  if (!currentProduct || !candidate || currentProduct.id === candidate.id) {
    return -1;
  }

  let score = 0;

  const currentBrand = (currentProduct.brand || '').trim().toLowerCase();
  const candidateBrand = (candidate.brand || '').trim().toLowerCase();

  const currentCategory = (currentProduct.category || '').trim().toLowerCase();
  const candidateCategory = (candidate.category || '').trim().toLowerCase();

  const currentShape = (currentProduct.shape || '').trim().toLowerCase();
  const candidateShape = (candidate.shape || '').trim().toLowerCase();

  const currentFrameType = (currentProduct.frame_type || currentProduct.style || '').trim().toLowerCase();
  const candidateFrameType = (candidate.frame_type || candidate.style || '').trim().toLowerCase();

  const currentMaterial = (currentProduct.frame_material || '').trim().toLowerCase();
  const candidateMaterial = (candidate.frame_material || '').trim().toLowerCase();

  const currentGender = (currentProduct.gender || '').trim().toLowerCase();
  const candidateGender = (candidate.gender || '').trim().toLowerCase();

  const currentPrice = Number(currentProduct.price || currentProduct.consumersPrice || 0);
  const candidatePrice = Number(candidate.price || candidate.consumersPrice || 0);

  const currentTokens = extractTokens(currentProduct.name);
  const candidateTokens = new Set(extractTokens(candidate.name));

  // ── 1. Category Matching (Anchor Context) ──────────────────────────────────
  if (currentCategory && candidateCategory) {
    if (currentCategory === candidateCategory) {
      score += 25;
    } else {
      // Disfavor recommending contact lenses on eyeglasses pages or vice versa
      score -= 30;
    }
  }

  // ── 2. Brand Matching (Highest Priority: Same Brand First) ────────────────
  const isSameBrand = currentBrand && candidateBrand && currentBrand === candidateBrand;
  if (isSameBrand) {
    score += 55; // Large boost ensuring same-brand products float to the top
  } else if (currentBrand && candidate.name?.toLowerCase().includes(currentBrand)) {
    score += 45;
  }

  // ── 3. Collection / Series / Model Name Keyword Overlap ────────────────────
  // E.g., "13th Century", "Titanium", "Aviator", "Square", "Round"
  let matchingTokensCount = 0;
  for (const token of currentTokens) {
    if (candidateTokens.has(token)) {
      matchingTokensCount++;
      score += 15; // 15 points per matching distinctive title word
    }
  }

  // ── 4. Shape & Silhouette Similarity (Tier 2 Priority) ─────────────────────
  if (currentShape && candidateShape) {
    if (currentShape === candidateShape) {
      score += 30;
    }
  } else if (currentShape && candidate.name?.toLowerCase().includes(currentShape)) {
    score += 20;
  }

  // ── 5. Design, Style & Material ───────────────────────────────────────────
  if (currentFrameType && candidateFrameType && currentFrameType === candidateFrameType) {
    score += 12; // E.g., both Full Rim, Rimless, Semi-Rimless
  }

  if (currentMaterial && candidateMaterial && currentMaterial === candidateMaterial) {
    score += 10; // E.g., both TR90, Acetate, Metal, Titanium
  }

  // ── 6. Color & Aesthetic Match ─────────────────────────────────────────────
  if (hasColorMatch(currentProduct, candidate)) {
    score += 14;
  }

  // ── 7. Gender / Demographic Alignment ─────────────────────────────────────
  if (currentGender && candidateGender) {
    if (currentGender === candidateGender || currentGender === 'unisex' || candidateGender === 'unisex') {
      score += 6;
    }
  }

  // ── 8. Price Tier Similarity (within 35%) ─────────────────────────────────
  if (currentPrice > 0 && candidatePrice > 0) {
    const diff = Math.abs(currentPrice - candidatePrice) / currentPrice;
    if (diff <= 0.35) {
      score += 8;
    }
  }

  // ── 9. Per-Product Affinity Tie-Breaker (Anti-Repetition) ──────────────────
  // Adds a micro-score (0 to 4.99) deterministic to this exact product pair.
  // This shuffles candidates with close scores per product page, so the customer
  // never sees the exact same static repeated recommendations across different frames.
  const affinityJitter = getProductAffinityJitter(currentProduct.id, candidate.id);
  score += affinityJitter;

  return {
    score,
    isSameBrand,
    matchingTokensCount
  };
}

/**
 * Returns intelligent, product-aware recommendations from an active product catalog.
 * 
 * @param {Object} currentProduct The product currently being viewed
 * @param {Array} catalog Full list of candidate products
 * @param {Object} options Configuration options
 * @param {number} options.limit Maximum recommendations to return (default: 8)
 * @param {number} options.maxSameBrand Max same-brand slots before showing cross-brand similar styles (default: 5)
 * @returns {Array} Ordered recommended products
 */
export function getRecommendedProducts(currentProduct, catalog = [], options = {}) {
  if (!currentProduct || !Array.isArray(catalog) || catalog.length === 0) {
    return [];
  }

  const {
    limit = 8,
    maxSameBrand = 5
  } = options;

  // Filter out the current product and inactive products
  const candidates = catalog.filter(p => 
    p && 
    p.id !== currentProduct.id && 
    p.is_active !== false &&
    (p.price || p.consumersPrice)
  );

  if (candidates.length === 0) return [];

  // Score all candidates
  const scored = candidates.map(candidate => {
    const analysis = calculateProductRelevance(currentProduct, candidate);
    return {
      product: candidate,
      score: analysis.score,
      isSameBrand: analysis.isSameBrand
    };
  }).filter(item => item.score > 0);

  // Split into same-brand pool and cross-brand similar pool
  const sameBrandPool = scored
    .filter(item => item.isSameBrand)
    .sort((a, b) => b.score - a.score);

  const crossBrandPool = scored
    .filter(item => !item.isSameBrand)
    .sort((a, b) => b.score - a.score);

  const finalRecommendations = [];
  const pickedIds = new Set();

  // 1. Prioritize related frames from the same brand first (up to maxSameBrand)
  for (const item of sameBrandPool) {
    if (finalRecommendations.length >= maxSameBrand) break;
    if (!pickedIds.has(item.product.id)) {
      finalRecommendations.push(item.product);
      pickedIds.add(item.product.id);
    }
  }

  // 2. Fill remaining slots with the highest-scoring similar products from other brands
  // (or remaining same-brand items if cross-brand pool is exhausted)
  for (const item of crossBrandPool) {
    if (finalRecommendations.length >= limit) break;
    if (!pickedIds.has(item.product.id)) {
      finalRecommendations.push(item.product);
      pickedIds.add(item.product.id);
    }
  }

  // 3. If there are still slots left and same-brand pool had more items, add them
  if (finalRecommendations.length < limit) {
    for (const item of sameBrandPool) {
      if (finalRecommendations.length >= limit) break;
      if (!pickedIds.has(item.product.id)) {
        finalRecommendations.push(item.product);
        pickedIds.add(item.product.id);
      }
    }
  }

  // 4. Fallback: if we still don't have enough, fill with any remaining candidates
  if (finalRecommendations.length < limit) {
    const remaining = candidates
      .filter(c => !pickedIds.has(c.id))
      .sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
    
    for (const p of remaining) {
      if (finalRecommendations.length >= limit) break;
      finalRecommendations.push(p);
      pickedIds.add(p.id);
    }
  }

  return finalRecommendations;
}
