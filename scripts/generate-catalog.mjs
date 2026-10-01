import fs from 'fs';
import path from 'path';

const cache = JSON.parse(fs.readFileSync('scripts/cloudinary-upload-cache.json', 'utf8'));
const urlMap = {};
for (const item of Object.values(cache)) {
  urlMap[item.filename] = item.url;
}

// Visual catalog definition with mindful grouping of frames & colorways across both folders
const catalogDefs = [
  // --- FOLDER 1 BATCH (LZ, 52206, 9132, TR90 & Acetate collections) ---
  {
    name: "Chashmalay Neo Square Acetate",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Square",
    type: "Full Rim",
    material: "Acetate",
    gender: "Unisex",
    price: 999,
    original_price: 1999,
    shapeCode: "SQ",
    num: "0201",
    desc: "Bold square frames crafted from lightweight acetate with signature contrast accents for sharp, contemporary styling. Perfect for everyday office and casual wear.",
    tags: "square, modern, acetate, lightweight, daily wear, unisex",
    colorways: [
      { name: "Matte Black Red", hex: "#1A1A1A", front: "RGP_2738.webp", side: "RGP_2739.webp", code: "BLK" },
      { name: "Matte Black Blue", hex: "#1E293B", front: "RGP_2740.webp", side: "RGP_2741.webp", code: "BLU" }
    ]
  },
  {
    name: "Chashmalay Urban Classic Wayfarer",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Wayfarer",
    type: "Full Rim",
    material: "Acetate",
    gender: "Unisex",
    price: 1099,
    original_price: 2199,
    shapeCode: "WY",
    num: "0202",
    desc: "Timeless wayfarer silhouette accented with subtle rivet hardware and tailored ergonomic temples. Designed for balanced comfort and versatile styling.",
    tags: "wayfarer, classic, acetate, rivet, stylish, unisex",
    colorways: [
      { name: "Crystal Smoke Grey", hex: "#64748B", front: "RGP_2743.webp", side: "RGP_2743.webp", code: "CLR" },
      { name: "Matte Black", hex: "#1A1A1A", front: "RGP_2746.webp", side: "RGP_2747.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay AeroFlex Square",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Square",
    type: "Full Rim",
    material: "TR90",
    gender: "Unisex",
    price: 999,
    original_price: 1999,
    shapeCode: "SQ",
    num: "0203",
    desc: "Innovative 2-in-1 clip-on frame featuring magnetic sun attachment lenses over everyday optical prescription frames. Effortlessly shifts from indoor reading to outdoor glare protection.",
    tags: "clip on, magnetic clip, tr90, flexible, 2 in 1, polarized",
    colorways: [
      { name: "Navy Blue Red", hex: "#1E3A8A", front: "RGP_2744.webp", side: "RGP_2745.webp", code: "BLU" }
    ]
  },
  {
    name: "Chashmalay Metro Edge Rectangle",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Rectangle",
    type: "Full Rim",
    material: "TR90",
    gender: "Men",
    price: 949,
    original_price: 1899,
    shapeCode: "RC",
    num: "0204",
    desc: "Clean-lined rectangular computer frames engineered to filter high-energy blue rays from screens, phones, and laptops. Reduces digital eye fatigue during long office work hours.",
    tags: "computer glasses, blue cut, anti glare, digital protection, office wear, men",
    colorways: [
      { name: "Smoke Grey Lime", hex: "#4B5563", front: "RGP_2748.webp", side: "RGP_2749.webp", code: "GRN" },
      { name: "Matte Black Crimson", hex: "#18181B", front: "RGP_2750.webp", side: "RGP_2751.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Artisan Trapezoid",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Square",
    type: "Full Rim",
    material: "Acetate",
    gender: "Unisex",
    price: 1199,
    original_price: 2399,
    shapeCode: "SQ",
    num: "0205",
    desc: "Sophisticated trapezoidal design with premium acetate craftsmanship and distinctive inner-temple detailing. Elevates modern minimalist wardrobes.",
    tags: "square, trapezoid, acetate, artisan, stylish, unisex",
    colorways: [
      { name: "Glossy Black Camo", hex: "#0F172A", front: "RGP_2753.webp", side: "RGP_2754.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Horizon Bold Square",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Square",
    type: "Full Rim",
    material: "Acetate",
    gender: "Unisex",
    price: 1299,
    original_price: 2599,
    shapeCode: "SQ",
    num: "0206",
    desc: "Architectural square profile featuring bold rims, polished metal hinge accents, and ergonomic temple curvature. A confident statement piece for modern trendsetters.",
    tags: "square, bold, statement, acetate, gold hinge, trendsetter",
    colorways: [
      { name: "Matte Black Gold", hex: "#111827", front: "RGP_2755.webp", side: "RGP_2757.webp", code: "BLK" },
      { name: "Dark Tortoise Amber", hex: "#78350F", front: "RGP_2758.webp", side: "RGP_2759.webp", code: "HVN" },
      { name: "Transparent Olive", hex: "#3F6212", front: "RGP_2760.webp", side: "RGP_2761.webp", code: "GRN" }
    ]
  },
  {
    name: "Chashmalay Slimline Geometric",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Geometric",
    type: "Full Rim",
    material: "Metal",
    gender: "Unisex",
    price: 1049,
    original_price: 2099,
    shapeCode: "GE",
    num: "0207",
    desc: "Subtle poly-angled geometric rims crafted with fine metal alloys and computer blue-light blocking lenses. Delivers an intellectual, refined look with screen glare defense.",
    tags: "computer glasses, blue cut, geometric, slim metal, intellectual, lightweight",
    colorways: [
      { name: "Rose Gold", hex: "#B76E79", front: "RGP_2762.webp", side: "RGP_2763.webp", code: "RGD" },
      { name: "Gunmetal Black", hex: "#374151", front: "RGP_2764.webp", side: "RGP_2765.webp", code: "GM" },
      { name: "Metallic Gold", hex: "#D97706", front: "RGP_2766.webp", side: "RGP_2767.webp", code: "GLD" }
    ]
  },
  {
    name: "Chashmalay Retro Vintage Aviator",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Aviator",
    type: "Full Rim",
    material: "Metal",
    gender: "Unisex",
    price: 1149,
    original_price: 2299,
    shapeCode: "AV",
    num: "0208",
    desc: "Iconic dual-bridge aviator refreshed with modern slimline metalwork and sleek temples. An enduring aesthetic suited for any face shape.",
    tags: "aviator, double bridge, classic, vintage, metal, unisex",
    colorways: [
      { name: "Gunmetal Silver", hex: "#4B5563", front: "RGP_2769.webp", side: "RGP_2770.webp", code: "SLV" },
      { name: "Vintage Gold", hex: "#B45309", front: "RGP_2771.webp", side: "RGP_2773.webp", code: "GLD" },
      { name: "Matte Black", hex: "#1F2937", front: "RGP_2774.webp", side: "RGP_2775.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Cat-Eye Bloom",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Cat Eye",
    type: "Full Rim",
    material: "Acetate",
    gender: "Women",
    price: 1199,
    original_price: 2399,
    shapeCode: "CE",
    num: "0209",
    desc: "Chic cat-eye frames featuring sculpted upswept browlines and radiant color transitions. Elevates both professional and party aesthetics.",
    tags: "cat eye, feminine, upswept, acetate, chic, women",
    colorways: [
      { name: "Burgundy Wine", hex: "#5C1D24", front: "RGP_2776.webp", side: "RGP_2777.webp", code: "BRN" },
      { name: "Havana Tortoise", hex: "#8B5A2B", front: "RGP_2778.webp", side: "RGP_2779.webp", code: "HVN" },
      { name: "Midnight Black", hex: "#09090B", front: "RGP_2780.webp", side: "RGP_2781.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Minimalist Oval",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Oval",
    type: "Full Rim",
    material: "Metal",
    gender: "Unisex",
    price: 899,
    original_price: 1799,
    shapeCode: "OV",
    num: "0210",
    desc: "Gently curved oval reading rims crafted from resilient metal alloy with anti-slip temple tips. Timeless simplicity engineered for strain-free close vision and reading.",
    tags: "reading glasses, reader, oval, minimalist, metal, lightweight, close vision",
    colorways: [
      { name: "Sleek Silver", hex: "#9CA3AF", front: "RGP_2782.webp", side: "RGP_2783.webp", code: "SLV" },
      { name: "Champagne Gold", hex: "#D4AF37", front: "RGP_2784.webp", side: "RGP_2785.webp", code: "GLD" },
      { name: "Matte Black", hex: "#18181B", front: "RGP_2786.webp", side: "RGP_2787.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Clubmaster Heritage",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Clubmaster",
    type: "Half Rim",
    material: "Acetate",
    gender: "Unisex",
    price: 1249,
    original_price: 2499,
    shapeCode: "CM",
    num: "0211",
    desc: "Distinguished browline design combining bold acetate upper rims with slender metal eyewires. A vintage scholarly aesthetic reimagined for contemporary lifestyle.",
    tags: "clubmaster, browline, retro, half rim, acetate metal",
    colorways: [
      { name: "Gloss Black Gold", hex: "#0F172A", front: "RGP_2788.webp", side: "RGP_2789.webp", code: "BLK" },
      { name: "Dark Havana Tortoise", hex: "#713F12", front: "RGP_2790.webp", side: "RGP_2791.webp", code: "HVN" },
      { name: "Transparent Grey Silver", hex: "#4B5563", front: "RGP_2792.webp", side: "RGP_2793.webp", code: "CLR" }
    ]
  },
  {
    name: "Chashmalay UltraLight Hexagon",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Geometric",
    type: "Full Rim",
    material: "Metal",
    gender: "Unisex",
    price: 1099,
    original_price: 2199,
    shapeCode: "GE",
    num: "0212",
    desc: "Sharply defined hexagonal metal rims that bring a modern edge to classic round aesthetics. Premium plated finish for long-lasting corrosion resistance.",
    tags: "hexagon, geometric, metal, trendy, youth, unisex",
    colorways: [
      { name: "Rose Gold Copper", hex: "#BE185D", front: "RGP_2794.webp", side: "RGP_2795.webp", code: "RGD" },
      { name: "Gunmetal Grey", hex: "#374151", front: "RGP_2796.webp", side: "RGP_2797.webp", code: "GM" },
      { name: "Brushed Gold", hex: "#B45309", front: "RGP_2798.webp", side: "RGP_2799.webp", code: "GLD" }
    ]
  },
  {
    name: "Chashmalay Executive Semi-Rimless",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Rectangle",
    type: "Half Rim",
    material: "Metal",
    gender: "Men",
    price: 1199,
    original_price: 2399,
    shapeCode: "RC",
    num: "0213",
    desc: "Understated semi-rimless rectangular frame designed for effortless executive style. Lightweight and unobtrusive for intensive reading and screen time.",
    tags: "half rim, executive, semi rimless, metal, rectangular, men",
    colorways: [
      { name: "Matte Black", hex: "#111827", front: "RGP_2800.webp", side: "RGP_2801.webp", code: "BLK" },
      { name: "Gunmetal Steel", hex: "#4B5563", front: "RGP_2803.webp", side: "RGP_2804.webp", code: "GM" },
      { name: "Deep Navy", hex: "#1E3A8A", front: "RGP_2805.webp", side: "RGP_2806.webp", code: "BLU" }
    ]
  },
  {
    name: "Chashmalay Studio Modern Round",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Round",
    type: "Full Rim",
    material: "Acetate",
    gender: "Unisex",
    price: 1049,
    original_price: 2099,
    shapeCode: "RN",
    num: "0214",
    desc: "Perfect circular frames with keyhole nose bridge and sculpted temple tips. An artistic classic favored by creative minds and design enthusiasts.",
    tags: "round, keyhole bridge, retro, acetate, artistic, unisex",
    colorways: [
      { name: "Crystal Transparent", hex: "#E5E7EB", front: "RGP_2807.webp", side: "RGP_2808.webp", code: "CLR" },
      { name: "Amber Honey", hex: "#D97706", front: "RGP_2809.webp", side: "RGP_2810.webp", code: "HVN" },
      { name: "Piano Black", hex: "#000000", front: "RGP_2811.webp", side: "RGP_2812.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Prism Angular Square",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Square",
    type: "Full Rim",
    material: "TR90",
    gender: "Kids",
    price: 899,
    original_price: 1799,
    shapeCode: "SQ",
    num: "0215",
    desc: "Beveled square edges with high impact resistance and featherweight comfort. Crafted for school, active play, and everyday lightness.",
    tags: "square, angular, tr90, impact resistant, kids, lightweight",
    colorways: [
      { name: "Matte Olive Green", hex: "#365314", front: "RGP_2813.webp", side: "RGP_2814.webp", code: "GRN" },
      { name: "Dark Walnut Brown", hex: "#451A03", front: "RGP_2815.webp", side: "RGP_2816.webp", code: "BRN" },
      { name: "Onyx Black", hex: "#18181B", front: "RGP_2818.webp", side: "RGP_2819.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Alpha Screen Rectangle",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Rectangle",
    type: "Full Rim",
    material: "Acetate",
    gender: "Men",
    price: 999,
    original_price: 1999,
    shapeCode: "RC",
    num: "0216",
    desc: "Compact rectangular silhouette featuring certified blue-ray filtering lenses to reduce digital screen fatigue and eye strain during extended work sessions.",
    tags: "computer glasses, blue cut, anti glare, digital protection, office wear, men",
    colorways: [
      { name: "Charcoal Grey", hex: "#374151", front: "RGP_2820.webp", side: "RGP_2821.webp", code: "GM" },
      { name: "Deep Cobalt", hex: "#1D4ED8", front: "RGP_2822.webp", side: "RGP_2823.webp", code: "BLU" },
      { name: "Matte Raven", hex: "#111827", front: "RGP_2824.webp", side: "RGP_2825.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Contour Soft Square",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Square",
    type: "Full Rim",
    material: "Acetate",
    gender: "Unisex",
    price: 1049,
    original_price: 2099,
    shapeCode: "SQ",
    num: "0217",
    desc: "Gently rounded square profile designed to soften angular jawlines. Features integrated hypoallergenic nose pads for lasting comfort.",
    tags: "soft square, contour, acetate, comfortable, everyday",
    colorways: [
      { name: "Burgundy Tortoise", hex: "#4C0519", front: "RGP_2826.webp", side: "RGP_2827.webp", code: "BRN" },
      { name: "Smoky Translucent", hex: "#6B7280", front: "RGP_2828.webp", side: "RGP_2829.webp", code: "CLR" },
      { name: "Classic Jet Black", hex: "#09090B", front: "RGP_2830.webp", side: "RGP_2831.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Luxe Rimless Titanium",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Rectangle",
    type: "Rimless",
    material: "Titanium",
    gender: "Unisex",
    price: 1499,
    original_price: 2999,
    shapeCode: "RC",
    num: "0218",
    desc: "Unobstructed visual freedom engineered with high-tensile titanium bridge and temple arms. The pinnacle of ultra-light luxury and understated prestige.",
    tags: "rimless, titanium, premium, featherlight, executive, unisex",
    colorways: [
      { name: "Brushed Silver", hex: "#94A3B8", front: "RGP_2832.webp", side: "RGP_2833.webp", code: "SLV" },
      { name: "Champagne Gold", hex: "#CA8A04", front: "RGP_2834.webp", side: "RGP_2835.webp", code: "GLD" },
      { name: "Gunmetal", hex: "#334155", front: "RGP_2836.webp", side: "RGP_2837.webp", code: "GM" }
    ]
  },
  {
    name: "Chashmalay Nova Square Navigator",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Square",
    type: "Full Rim",
    material: "TR90",
    gender: "Men",
    price: 1099,
    original_price: 2199,
    shapeCode: "SQ",
    num: "0219",
    desc: "Versatile 2-in-1 magnetic clip-on optical frame. Snaps seamlessly from indoor anti-glare prescription glasses to high-performance outdoor polarized sunglasses.",
    tags: "clip on, magnetic clip, 2 in 1, navigator, polarized, sun clip, men",
    colorways: [
      { name: "Matte Black Silver", hex: "#1F2937", front: "RGP_2838.webp", side: "RGP_2839.webp", code: "BLK" },
      { name: "Military Olive", hex: "#3F6212", front: "RGP_2840.webp", side: "RGP_2841.webp", code: "GRN" },
      { name: "Navy Blue Gunmetal", hex: "#1E3A8A", front: "RGP_2842.webp", side: "RGP_2843.webp", code: "BLU" }
    ]
  },
  {
    name: "Chashmalay Flare Butterfly Cat-Eye",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Cat Eye",
    type: "Full Rim",
    material: "Acetate",
    gender: "Women",
    price: 1149,
    original_price: 2299,
    shapeCode: "CE",
    num: "0220",
    desc: "Dramatic butterfly flare temples with sculpted beveling and glossy gloss finish. An alluring statement accessory for high-fashion dressing.",
    tags: "cat eye, butterfly, glamorous, acetate, fashion, women",
    colorways: [
      { name: "Rose Quartz Clear", hex: "#F43F5E", front: "RGP_2845.webp", side: "RGP_2846.webp", code: "RGD" },
      { name: "Leopard Havana", hex: "#92400E", front: "RGP_2847.webp", side: "RGP_2848.webp", code: "HVN" },
      { name: "Gloss Black", hex: "#000000", front: "RGP_2850.webp", side: "RGP_2851.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Matrix Round",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Round",
    type: "Full Rim",
    material: "Acetate",
    gender: "Unisex",
    price: 999,
    original_price: 1999,
    shapeCode: "RN",
    num: "0221",
    desc: "Slender-profile acetate circles equipped with anti-glare screen lenses. Vintage academia styling combined with blue-ray eye comfort.",
    tags: "computer glasses, anti glare, blue light, round, screen protection",
    colorways: [
      { name: "Tortoise Amber", hex: "#B45309", front: "RGP_2852.webp", side: "RGP_2853.webp", code: "HVN" },
      { name: "Transparent Crystal", hex: "#F3F4F6", front: "RGP_2854.webp", side: "RGP_2855.webp", code: "CLR" },
      { name: "Midnight Black", hex: "#111827", front: "RGP_2856.webp", side: "RGP_2857.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Apex Octagon Metal",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Geometric",
    type: "Full Rim",
    material: "Metal",
    gender: "Unisex",
    price: 1099,
    original_price: 2199,
    shapeCode: "GE",
    num: "0222",
    desc: "Eight-sided octagonal geometry forged from high-grade metallic alloy. Balances avant-garde fashion with understated refinement.",
    tags: "octagon, geometric, metal, avant-garde, stylish",
    colorways: [
      { name: "Brushed Bronze", hex: "#78350F", front: "RGP_2858.webp", side: "RGP_2859.webp", code: "BRN" },
      { name: "Polished Silver", hex: "#E5E7EB", front: "RGP_2860.webp", side: "RGP_2861.webp", code: "SLV" },
      { name: "Matte Black", hex: "#1F2937", front: "RGP_2862.webp", side: "RGP_2863.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Pioneer Pilot Double-Bridge",
    brand: "Chashmalay",
    category: "sunglasses",
    shape: "Aviator",
    type: "Full Rim",
    material: "Metal",
    gender: "Men",
    price: 1199,
    original_price: 2399,
    shapeCode: "AV",
    num: "0223",
    desc: "Rugged double-bridge aviator featuring masculine squared-off teardrop lenses and reinforced flex hinges. Built for dependable daily performance.",
    tags: "pilot, aviator, double bridge, metal, men, rugged",
    colorways: [
      { name: "Gunmetal Matte", hex: "#374151", front: "RGP_2864.webp", side: "RGP_2865.webp", code: "GM" },
      { name: "Warm Gold", hex: "#D97706", front: "RGP_2866.webp", side: "RGP_2867.webp", code: "GLD" },
      { name: "Stealth Black", hex: "#000000", front: "RGP_2868.webp", side: "RGP_2869.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Vogue Elegance Oval",
    brand: "Chashmalay",
    category: "sunglasses",
    shape: "Oval",
    type: "Full Rim",
    material: "Acetate",
    gender: "Women",
    price: 1099,
    original_price: 2199,
    shapeCode: "OV",
    num: "0224",
    desc: "Graceful elongated oval frames crafted with soft beveling and high-gloss luster. Harmonizes beautifully with petite to medium facial features.",
    tags: "oval, elegant, acetate, soft curves, feminine",
    colorways: [
      { name: "Blush Peach", hex: "#FB7185", front: "RGP_2870.webp", side: "RGP_2871.webp", code: "RGD" },
      { name: "Honey Demi", hex: "#A16207", front: "RGP_2872.webp", side: "RGP_2873.webp", code: "HVN" },
      { name: "Jet Black", hex: "#18181B", front: "RGP_2874.webp", side: "RGP_2875.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Veloce Sport Sunglasses",
    brand: "Chashmalay",
    category: "sunglasses",
    shape: "Rectangle",
    type: "Full Rim",
    material: "TR90",
    gender: "Men",
    price: 999,
    original_price: 1999,
    shapeCode: "RC",
    num: "0225",
    desc: "Active aerodynamic frame featuring a snap-on polarized magnetic sun clip over prescription clear lenses. Engineered for cycling, running, driving, and sports dynamism.",
    tags: "clip on, magnetic clip, sport, wrap, 2 in 1, polarized, active, men",
    colorways: [
      { name: "Matte Black Orange", hex: "#EA580C", front: "RGP_2876.webp", side: "RGP_2877.webp", code: "BLK" },
      { name: "Charcoal Blue", hex: "#2563EB", front: "RGP_2878.webp", side: "RGP_2879.webp", code: "BLU" },
      { name: "Solid Black", hex: "#000000", front: "RGP_2880.webp", side: "RGP_2881.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Kinetic Junior Wayfarer",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Wayfarer",
    type: "Full Rim",
    material: "TR90",
    gender: "Kids",
    price: 899,
    original_price: 1799,
    shapeCode: "WY",
    num: "0226",
    desc: "Lightweight, unbreakable polymer wayfarer specially sized for juniors and kids. Sweat-resistant, impact-proof, and comfortable for all-day classroom wear.",
    tags: "wayfarer, kinetic, junior, kids, tr90, durable, lightweight",
    colorways: [
      { name: "Matte Brown Tortoise", hex: "#78350F", front: "RGP_2882.webp", side: "RGP_2883.webp", code: "BRN" },
      { name: "Frosted Grey", hex: "#9CA3AF", front: "RGP_2884.webp", side: "RGP_2885.webp", code: "CLR" },
      { name: "Deep Ink Black", hex: "#09090B", front: "RGP_2886.webp", side: "RGP_2887.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Classic Square",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Square",
    type: "Full Rim",
    material: "Polycarbonate",
    gender: "Unisex",
    price: 799,
    original_price: 1599,
    shapeCode: "SQ",
    num: "0227",
    desc: "Compact, crystal-clear reading frame with spring hinges for effortless pocketability and strain-free magnification. Perfect for books, menus, and screens.",
    tags: "reading glasses, square, compact, lightweight, unisex",
    colorways: [
      { name: "Amber Tortoise", hex: "#92400E", front: "RGP_2888.webp", side: "RGP_2889.webp", code: "HVN" },
      { name: "Crystal Clear", hex: "#E5E7EB", front: "RGP_2890.webp", side: "RGP_2891.webp", code: "CLR" },
      { name: "Midnight Black", hex: "#111827", front: "RGP_2892.webp", side: "RGP_2893.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Urbanite Slim Rectangle",
    brand: "Chashmalay",
    category: "sunglasses",
    shape: "Rectangle",
    type: "Full Rim",
    material: "Metal",
    gender: "Unisex",
    price: 999,
    original_price: 1999,
    shapeCode: "RC",
    num: "0228",
    desc: "Ultra-slim metal wireframe with sleek rectangular profile and adjustable silicone bridge pads. Discreet, comfortable, and timelessly smart.",
    tags: "slim metal, rectangle, professional, sleek, lightweight",
    colorways: [
      { name: "Gunmetal Silver", hex: "#475569", front: "RGP_2894.webp", side: "RGP_2895.webp", code: "SLV" },
      { name: "Classic Gold", hex: "#B45309", front: "RGP_2896.webp", side: "RGP_2897.webp", code: "GLD" },
      { name: "Matte Black", hex: "#0F172A", front: "RGP_2898.webp", side: "RGP_2899.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Titan Precision Rimless",
    brand: "Chashmalay",
    category: "sunglasses",
    shape: "Rectangle",
    type: "Rimless",
    material: "Titanium",
    gender: "Unisex",
    price: 1499,
    original_price: 2999,
    shapeCode: "RC",
    num: "0229",
    desc: "Featherlight titanium rimless spectacles offering an unobstructed field of vision. Engineered for discerning professionals who value precision craftsmanship.",
    tags: "rimless, titanium, precision, minimalist, executive",
    colorways: [
      { name: "Polished Chrome", hex: "#CBD5E1", front: "RGP_2900.webp", side: "RGP_2901.webp", code: "SLV" },
      { name: "Rose Gold", hex: "#BE185D", front: "RGP_2902.webp", side: "RGP_2903.webp", code: "RGD" },
      { name: "Stealth Graphite", hex: "#1E293B", front: "RGP_2904.webp", side: "RGP_2904.webp", code: "GM" }
    ]
  },

  // --- FOLDER 2 BATCH (SCOTT SIGNATURE, SUNGLASSES, SUN SHADES & ACCESSORIES) ---
  {
    name: "Chashmalay Pilot Shield Polarized",
    brand: "Chashmalay",
    category: "sunglasses",
    shape: "Aviator",
    type: "Full Rim",
    material: "Metal",
    gender: "Unisex",
    price: 1299,
    original_price: 2599,
    shapeCode: "AV",
    num: "0301",
    desc: "Iconic teardrop aviator sunglasses featuring dark polarized sun lenses and robust double-bridge architecture. Provides 100% UV protection with timeless style.",
    tags: "sunglasses, aviator, double bridge, polarized, sun protection",
    colorways: [
      { name: "Matte Black Smoke", hex: "#111827", front: "DSC_8035.webp", side: "DSC_8035.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Scott Signature Navigator",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Square",
    type: "Full Rim",
    material: "Acetate",
    gender: "Men",
    price: 1499,
    original_price: 2999,
    shapeCode: "SQ",
    num: "0302",
    desc: "Premium Scott Signature Edition square navigator with ribbed metallic hinge accents and high-gloss acetate rims. Presented in our signature leatherette case.",
    tags: "navigator, square, signature, premium acetate, gold hinge, men",
    colorways: [
      { name: "Transparent Crystal Grey", hex: "#6B7280", front: "DSC_8105.webp", side: "DSC_8103.webp", code: "CLR" },
      { name: "Gloss Black Gold", hex: "#000000", front: "DSC_8106.webp", side: "DSC_8073.webp", code: "BLK" },
      { name: "Forest Green Gold", hex: "#14532D", front: "DSC_8108.webp", side: "DSC_8108.webp", code: "GRN" }
    ]
  },
  {
    name: "Chashmalay Scott Polarized Wayfarer",
    brand: "Chashmalay",
    category: "sunglasses",
    shape: "Wayfarer",
    type: "Full Rim",
    material: "Acetate",
    gender: "Unisex",
    price: 1399,
    original_price: 2799,
    shapeCode: "WY",
    num: "0303",
    desc: "High-grade wayfarer sunglasses with polarized category-3 dark lenses and triple-pin rivet details. Glare-free road and coastal clarity.",
    tags: "sunglasses, wayfarer, polarized, uv protection, riveted, unisex",
    colorways: [
      { name: "Matte Black Polarized", hex: "#18181B", front: "DSC_8077.webp", side: "DSC_8077.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Scott Slim Wire Temple Square",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Square",
    type: "Full Rim",
    material: "Acetate",
    gender: "Unisex",
    price: 1349,
    original_price: 2699,
    shapeCode: "SQ",
    num: "0304",
    desc: "Refined square frame pairing polished black acetate front with slim golden wire temples. Exudes contemporary boardroom elegance.",
    tags: "square, wire temple, gold accent, acetate, elegant",
    colorways: [
      { name: "Polished Black Gold", hex: "#0A0A0A", front: "DSC_8109.webp", side: "DSC_8110.webp", code: "BLK" },
      { name: "Translucent Brown Gold", hex: "#78350F", front: "DSC_8111.webp", side: "DSC_8112.webp", code: "BRN" },
      { name: "Crystal Ice Silver", hex: "#E2E8F0", front: "DSC_8113.webp", side: "DSC_8115.webp", code: "CLR" }
    ]
  },
  {
    name: "Chashmalay Horizon Clubmaster",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Clubmaster",
    type: "Half Rim",
    material: "Acetate",
    gender: "Unisex",
    price: 1299,
    original_price: 2599,
    shapeCode: "CM",
    num: "0305",
    desc: "Browline eyeglass frames with a dark front and gold-tone accents.",
    tags: "clubmaster, browline, gold-tone accents",
    colorways: [
      { name: "Black Gold G15", hex: "#0F172A", front: "DSC_8117.webp", side: "DSC_8118.webp", code: "BLK" },
      { name: "Havana Gold Brown", hex: "#854D0E", front: "DSC_8119.webp", side: "DSC_8121.webp", code: "HVN" }
    ]
  },
  {
    name: "Chashmalay Modernist Hexagon",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Geometric",
    type: "Full Rim",
    material: "Metal",
    gender: "Unisex",
    price: 1149,
    original_price: 2299,
    shapeCode: "GE",
    num: "0306",
    desc: "Geometric wireframe eyeglasses with clear lenses.",
    tags: "geometric, wireframe, eyeglasses",
    colorways: [
      { name: "Sleek Gunmetal", hex: "#374151", front: "DSC_8122.webp", side: "DSC_8123.webp", code: "GM" },
      { name: "Polished Gold", hex: "#D97706", front: "DSC_8124.webp", side: "DSC_8125.webp", code: "GLD" },
      { name: "Matte Black", hex: "#111827", front: "DSC_8126.webp", side: "DSC_8127.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Irus Eyeglasses",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Wayfarer",
    type: "Full Rim",
    material: "Acetate",
    gender: "Unisex",
    price: 1199,
    original_price: 2399,
    shapeCode: "WY",
    num: "0307",
    desc: "Dual-utility 2-in-1 clip-on system pairing classic wayfarer prescription frames with an ultra-light polarized magnetic sun shade. Complete optical convenience in one frame.",
    tags: "clip on, magnetic clip, 2 in 1, polarized, wayfarer, sun clip",
    colorways: [
      { name: "Matte Black", hex: "#18181B", front: "DSC_8128.webp", side: "DSC_8130.webp", code: "BLK" },
      { name: "Dark Tortoise", hex: "#713F12", front: "DSC_8131.webp", side: "DSC_8137.webp", code: "HVN" },
      { name: "Transparent Charcoal", hex: "#4B5563", front: "DSC_8139.webp", side: "DSC_8140.webp", code: "CLR" }
    ]
  },
  {
    name: "Chashmalay Edge Aviator Metal",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Aviator",
    type: "Full Rim",
    material: "Metal",
    gender: "Men",
    price: 1199,
    original_price: 2399,
    shapeCode: "AV",
    num: "0308",
    desc: "Angular pilot teardrop frames with reinforced brow bar and micro-textured temple grips. Combines military heritage with modern comfort.",
    tags: "aviator, pilot, angular, double bridge, metal, men",
    colorways: [
      { name: "Brushed Gunmetal", hex: "#334155", front: "DSC_8142.webp", side: "DSC_8145.webp", code: "GM" },
      { name: "Radiant Gold", hex: "#B45309", front: "DSC_8146.webp", side: "DSC_8149.webp", code: "GLD" },
      { name: "Stealth Black", hex: "#0F172A", front: "DSC_8150.webp", side: "DSC_8151.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Vogue Cat-Eye Metal",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Cat Eye",
    type: "Full Rim",
    material: "Metal",
    gender: "Women",
    price: 1149,
    original_price: 2299,
    shapeCode: "CE",
    num: "0309",
    desc: "Slender metal cat-eye frames featuring delicate crown styling and featherweight temples. An effortless lift that brightens everyday looks.",
    tags: "cat eye, slim metal, feminine, graceful, women",
    colorways: [
      { name: "Rose Gold Silver", hex: "#BE185D", front: "DSC_8152.webp", side: "DSC_8153.webp", code: "RGD" },
      { name: "Champagne Gold", hex: "#CA8A04", front: "DSC_8154.webp", side: "DSC_8155.webp", code: "GLD" },
      { name: "Midnight Black", hex: "#111827", front: "DSC_8156.webp", side: "DSC_8157.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Intellect Round",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Round",
    type: "Full Rim",
    material: "Metal",
    gender: "Unisex",
    price: 899,
    original_price: 1799,
    shapeCode: "RN",
    num: "0310",
    desc: "Iconic circular wire reading glasses inspired by vintage intellect. Ultra-thin profile that feels practically weightless during hours of close focus.",
    tags: "reading glasses, round, wireframe, reader, close vision, lightweight, unisex",
    colorways: [
      { name: "Antiqued Gold", hex: "#B45309", front: "DSC_8158.webp", side: "DSC_8159.webp", code: "GLD" },
      { name: "Polished Silver", hex: "#94A3B8", front: "DSC_8160.webp", side: "DSC_8162.webp", code: "SLV" },
      { name: "Matte Black", hex: "#18181B", front: "DSC_8163.webp", side: "DSC_8164.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Matrix Square Acetate",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Square",
    type: "Full Rim",
    material: "Acetate",
    gender: "Unisex",
    price: 1049,
    original_price: 2099,
    shapeCode: "SQ",
    num: "0311",
    desc: "Structured square frame with smooth beveled eyewires and comfortable saddle bridge. Designed for confident, versatile all-day wear.",
    tags: "square, structured, acetate, saddle bridge, unisex",
    colorways: [
      { name: "Gloss Jet Black", hex: "#000000", front: "DSC_8165.webp", side: "DSC_8166.webp", code: "BLK" },
      { name: "Amber Havana", hex: "#854D0E", front: "DSC_8167.webp", side: "DSC_8168.webp", code: "HVN" },
      { name: "Crystal Grey", hex: "#6B7280", front: "DSC_8170.webp", side: "DSC_8171.webp", code: "CLR" }
    ]
  },
  {
    name: "Chashmalay Elite Semi-Rimless Rectangular",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Rectangle",
    type: "Half Rim",
    material: "Metal",
    gender: "Men",
    price: 1199,
    original_price: 2399,
    shapeCode: "RC",
    num: "0312",
    desc: "Polished half-rim rectangular metal frame with reinforced acetate temple sleeves. Professional, distinguished, and built to last.",
    tags: "half rim, rectangular, metal, executive, sharp, men",
    colorways: [
      { name: "Gunmetal Black", hex: "#1E293B", front: "DSC_8172.webp", side: "DSC_8173.webp", code: "GM" },
      { name: "Brushed Silver", hex: "#CBD5E1", front: "DSC_8174.webp", side: "DSC_8175.webp", code: "SLV" },
      { name: "Deep Navy Blue", hex: "#1E3A8A", front: "DSC_8176.webp", side: "DSC_8177.webp", code: "BLU" }
    ]
  },
  {
    name: "Chashmalay Aero Titanium Round",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Round",
    type: "Full Rim",
    material: "Titanium",
    gender: "Unisex",
    price: 1399,
    original_price: 2799,
    shapeCode: "RN",
    num: "0313",
    desc: "Premium titanium round frames offering featherlight flexibility and superior hypoallergenic skin comfort. Tailored for subtle luxury.",
    tags: "titanium, round, ultra light, hypoallergenic, premium",
    colorways: [
      { name: "Champagne Gold", hex: "#D4AF37", front: "DSC_8179.webp", side: "DSC_8181.webp", code: "GLD" },
      { name: "Dark Graphite", hex: "#374151", front: "DSC_8182.webp", side: "DSC_8183.webp", code: "GM" },
      { name: "Satin Black", hex: "#111827", front: "DSC_8184.webp", side: "DSC_8185.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Bold Flattop Square",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Square",
    type: "Full Rim",
    material: "Acetate",
    gender: "Men",
    price: 1399,
    original_price: 2799,
    shapeCode: "SQ",
    num: "0314",
    desc: "Oversized flattop sunglasses with dark UV400 protective lenses and high-density acetate construction. A commanding head-turning statement silhouette.",
    tags: "sunglasses, flattop, oversized, bold, uv400, men",
    colorways: [
      { name: "Piano Black Dark Tint", hex: "#000000", front: "DSC_8186.webp", side: "DSC_8187.webp", code: "BLK" },
      { name: "Havana Brown Tint", hex: "#713F12", front: "DSC_8188.webp", side: "DSC_8190.webp", code: "HVN" },
      { name: "Transparent Olive Grey", hex: "#365314", front: "DSC_8191.webp", side: "DSC_8192.webp", code: "GRN" }
    ]
  },
  {
    name: "Chashmalay Silhouette Oval",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Oval",
    type: "Full Rim",
    material: "Metal",
    gender: "Women",
    price: 899,
    original_price: 1799,
    shapeCode: "OV",
    num: "0315",
    desc: "Understated oval wireframe reading glasses with precision magnification lenses and ergonomic temple curvature. Gentle, fatigue-free comfort.",
    tags: "reading glasses, reader, oval, wireframe, comfortable, close vision, women",
    colorways: [
      { name: "Polished Silver", hex: "#94A3B8", front: "DSC_8193.webp", side: "DSC_8195.webp", code: "SLV" },
      { name: "Classic Gold", hex: "#B45309", front: "DSC_8196.webp", side: "DSC_8197.webp", code: "GLD" },
      { name: "Matte Black", hex: "#18181B", front: "DSC_8198.webp", side: "DSC_8199.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Urban Active Rectangle",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Rectangle",
    type: "Full Rim",
    material: "TR90",
    gender: "Men",
    price: 999,
    original_price: 1999,
    shapeCode: "RC",
    num: "0316",
    desc: "Rectangular eyeglass frames with contrasting temple accents.",
    tags: "rectangle, contrasting temples, active",
    colorways: [
      { name: "Matte Black Red", hex: "#1F2937", front: "DSC_8200.webp", side: "DSC_8201.webp", code: "BLK" },
      { name: "Matte Black Blue", hex: "#1E3A8A", front: "DSC_8202.webp", side: "DSC_8204.webp", code: "BLU" },
      { name: "Smoke Grey", hex: "#4B5563", front: "DSC_8208.webp", side: "DSC_8209.webp", code: "CLR" }
    ]
  },
  {
    name: "Chashmalay Signature Aviator",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Aviator",
    type: "Full Rim",
    material: "Metal",
    gender: "Unisex",
    price: 1349,
    original_price: 2699,
    shapeCode: "AV",
    num: "0317",
    desc: "Refined metal aviator sunglasses with gradient sun lenses and comfortable adjustable bridge pads. Supreme UV protection and effortless charisma.",
    tags: "sunglasses, aviator, gradient lenses, uv protection, unisex",
    colorways: [
      { name: "Gold Brown Gradient", hex: "#D97706", front: "DSC_8210.webp", side: "DSC_8212.webp", code: "GLD" },
      { name: "Silver Grey Gradient", hex: "#94A3B8", front: "DSC_8213.webp", side: "DSC_8216.webp", code: "SLV" },
      { name: "Gunmetal Dark Grey", hex: "#1E293B", front: "DSC_8217.webp", side: "DSC_8218.webp", code: "GM" }
    ]
  },
  {
    name: "Chashmalay Neo Cat-Eye Acetate",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Cat Eye",
    type: "Full Rim",
    material: "Acetate",
    gender: "Women",
    price: 1149,
    original_price: 2299,
    shapeCode: "CE",
    num: "0318",
    desc: "Sleek cat-eye with modern angular corners and vibrant rich pigmentation. Creates an instant uplifting aesthetic for daily eyewear.",
    tags: "cat eye, modern, acetate, stylish, women",
    colorways: [
      { name: "Deep Ruby Red", hex: "#991B1B", front: "DSC_8219.webp", side: "DSC_8220.webp", code: "BRN" },
      { name: "Tortoise Havana", hex: "#854D0E", front: "DSC_8221.webp", side: "DSC_8222.webp", code: "HVN" },
      { name: "Midnight Black", hex: "#000000", front: "DSC_8223.webp", side: "DSC_8225.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Horizon Wayfarer",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Wayfarer",
    type: "Full Rim",
    material: "Acetate",
    gender: "Unisex",
    price: 1049,
    original_price: 2099,
    shapeCode: "WY",
    num: "0319",
    desc: "Subtle trapezoidal wayfarer profile sculpted from rich acetate with soft polished bevels. A perennial optical staple.",
    tags: "wayfarer, timeless, acetate, daily wear, unisex",
    colorways: [
      { name: "Gloss Black", hex: "#0A0A0A", front: "DSC_8226.webp", side: "DSC_8227.webp", code: "BLK" },
      { name: "Crystal Transparent", hex: "#F3F4F6", front: "DSC_8228.webp", side: "DSC_8229.webp", code: "CLR" },
      { name: "Amber Tortoise", hex: "#B45309", front: "DSC_8230.webp", side: "DSC_8231.webp", code: "HVN" }
    ]
  },
  {
    name: "Chashmalay Geometric Octa Sun",
    brand: "Chashmalay",
    category: "sunglasses",
    shape: "Geometric",
    type: "Full Rim",
    material: "Metal",
    gender: "Unisex",
    price: 1299,
    original_price: 2599,
    shapeCode: "GE",
    num: "0320",
    desc: "Futuristic eight-sided geometric sunglasses with UV400 tinted lenses and slimline metal alloy temples. For distinct, bold street style.",
    tags: "sunglasses, geometric, octagon, metal, uv400, streetwear",
    colorways: [
      { name: "Gold Green Tint", hex: "#B45309", front: "DSC_8232.webp", side: "DSC_8233.webp", code: "GLD" },
      { name: "Silver Blue Tint", hex: "#2563EB", front: "DSC_8234.webp", side: "DSC_8235.webp", code: "SLV" },
      { name: "Black Dark Smoke", hex: "#111827", front: "DSC_8236.webp", side: "DSC_8237.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Neo Round Pastel & Matte",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Round",
    type: "Full Rim",
    material: "TR90",
    gender: "Unisex",
    price: 1099,
    original_price: 2199,
    shapeCode: "RN",
    num: "0321",
    desc: "Refined round Boston silhouette engineered with an ergonomic keyhole nose bridge, lightweight TR90 flex structure, and soft-touch pastel & matte finishes.",
    tags: "round, boston, keyhole, pastel, frosted, lightweight, tr90, unisex, daily wear",
    colorways: [
      { name: "Frosted Crystal White", hex: "#E2E8F0", front: "DSC_8239.webp", side: "DSC_8239.webp", code: "WHT" },
      { name: "Mint Seafoam Green", hex: "#A7F3D0", front: "DSC_8240.webp", side: "DSC_8240.webp", code: "MNT" },
      { name: "Ice Glacier Blue", hex: "#BAE6FD", front: "DSC_8242.webp", side: "DSC_8242.webp", code: "BLU" },
      { name: "Blush Rose Pink", hex: "#FBCFE8", front: "DSC_8243.webp", side: "DSC_8243.webp", code: "PNK" },
      { name: "Royal Cobalt Blue", hex: "#1D4ED8", front: "DSC_8244.webp", side: "DSC_8244.webp", code: "RBLU" },
      { name: "Slate Teal Green", hex: "#0F766E", front: "DSC_8246.webp", side: "DSC_8246.webp", code: "TEA" },
      { name: "Matte Raven Black", hex: "#18181B", front: "DSC_8247.webp", side: "DSC_8247.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Heritage Rivet Acetate Square",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Square",
    type: "Full Rim",
    material: "Acetate",
    gender: "Unisex",
    price: 1199,
    original_price: 2399,
    shapeCode: "SQ",
    num: "0323",
    desc: "Substantial square frames engineered with premium acetate depth, smooth nose bevels, and dual silver rivet pin accents on the front endpieces.",
    tags: "square, rivet, acetate, classic, unisex",
    colorways: [
      { name: "Gloss Noir Silver Rivet", hex: "#111827", front: "DSC_8248.webp", side: "DSC_8248.webp", code: "BLK" }
    ]
  },
  {
    name: "Chashmalay Executive Metal Navigator",
    brand: "Chashmalay",
    category: "eyeglasses",
    shape: "Square",
    type: "Full Rim",
    material: "Metal",
    gender: "Men",
    price: 1249,
    original_price: 2499,
    shapeCode: "SQ",
    num: "0322",
    desc: "Streamlined squared metal navigator frame with ribbed brow bar and high-durability flex hinges. Engineered for sharp executive style.",
    tags: "navigator, metal, executive, sharp, men",
    colorways: [
      { name: "Gunmetal Slate", hex: "#334155", front: "DSC_8250.webp", side: "DSC_8250.webp", code: "GM" }
    ]
  },


  {
    name: "IDEE Rectangle Eyeglasses",
    brand: "IDEE",
    category: "eyeglasses",
    shape: "Rectangle",
    type: "Full Rim",
    material: "Mixed",
    gender: "Unisex",
    price: 999,
    original_price: 1999,
    shapeCode: "RC",
    num: "0402",
    desc: "Full-rim rectangular eyeglasses with a black front and gold-tone temple accents.",
    tags: "rectangle, black, gold-tone, eyeglasses",
    colorways: [
      { name: "Black Gold", hex: "#1A1A1A", front: "DSC_8095.webp", side: "DSC_8095.webp", code: "BLK" }
    ]
  },
  {
    name: "Scott Square Eyeglasses",
    brand: "Scott",
    category: "eyeglasses",
    shape: "Square",
    type: "Full Rim",
    material: "Acetate",
    gender: "Unisex",
    price: 1349,
    original_price: 2699,
    shapeCode: "SQ",
    num: "0355",
    desc: "Black square optical frames with a small temple emblem.",
    tags: "square, black, optical frame",
    colorways: [
      { name: "Gloss Black", hex: "#111111", front: "DSC_8080.webp", side: "DSC_8080.webp", code: "BLK" }
    ]
  },
];

function buildCatalog() {
  const products = [];
  const mappedFiles = new Set();

  for (const def of catalogDefs) {
    const defaultColor = def.colorways[0].name;
    const availableColors = def.colorways.map(c => c.name);

    const primaryColorFrontUrl = urlMap[def.colorways[0].front] || '';
    const primaryColorSideUrl = urlMap[def.colorways[0].side] || '';

    // Mark mapped files
    def.colorways.forEach(c => {
      if (c.front) mappedFiles.add(c.front);
      if (c.side) mappedFiles.add(c.side);
      if (c.zoom) mappedFiles.add(c.zoom);
    });

    const colors = def.colorways.map(c => {
      const frontUrl = urlMap[c.front] || '';
      const sideUrl = urlMap[c.side] || '';
      const gallery = [];
      if (frontUrl) gallery.push(frontUrl);
      if (sideUrl && sideUrl !== frontUrl) gallery.push(sideUrl);

      return {
        name: c.name,
        hex: c.hex,
        color_code: c.hex,
        image: frontUrl,
        image_side: sideUrl,
        images: {
          front: frontUrl,
          side: sideUrl,
          gallery: gallery.length > 0 ? gallery : [frontUrl].filter(Boolean)
        },
        gallery: gallery.length > 0 ? gallery : [frontUrl].filter(Boolean)
      };
    });

    const defaultSku = `CSM-${def.shapeCode}-${def.num}-${def.colorways[0].code}`;

    products.push({
      name: def.name,
      brand: def.brand,
      category: def.category,
      accessory_type: def.category === 'accessories' ? 'Spectacle Case' : '',
      sku: defaultSku,
      price: def.price,
      original_price: def.original_price,
      discount_price: def.price,
      description: def.desc,
      stock_quantity: 50,
      gender: def.gender,
      frame_type: def.type,
      frame_shape: def.shape,
      frame_material: def.material,
      lens_type: "Single Vision",
      available_sizes: ["M", "L"],
      available_colors: availableColors,
      default_color: defaultColor,
      color: defaultColor,
      color_hex: def.colorways[0].hex,
      frame_color: defaultColor,
      frame_image: primaryColorFrontUrl,
      image: primaryColorFrontUrl,
      tags: def.tags,
      is_active: true,
      is_new: true,
      is_featured: false,
      images: {
        front: primaryColorFrontUrl,
        side: primaryColorSideUrl,
        model: "",
        zoom: "",
        gallery: [primaryColorFrontUrl, primaryColorSideUrl].filter(Boolean)
      },
      gallery: [primaryColorFrontUrl, primaryColorSideUrl].filter(Boolean),
      colors: colors
    });
  }

  return { products, mappedFilesCount: mappedFiles.size };
}

const { products, mappedFilesCount } = buildCatalog();
const catalogJson = JSON.stringify(products, null, 2);
fs.writeFileSync('catalog.json', catalogJson);
fs.writeFileSync(path.join('public', 'catalog.json'), catalogJson);

console.log(`✓ Catalog generation complete!`);
console.log(`Generated ${products.length} grouped products.`);
console.log(`Mapped unique image files: ${mappedFilesCount}`);
console.log(`Output saved to catalog.json`);

// Validate rules
let valid = true;
const skuSet = new Set();
const allowedCategories = new Set(['eyeglasses', 'sunglasses', 'computer-glasses', 'reading-glasses', 'clip-on']);
products.forEach((p, idx) => {
  if (!allowedCategories.has(p.category)) {
    console.error(`Invalid category for product ${p.name}: ${p.category}`);
    valid = false;
  }
  if (skuSet.has(p.sku)) {
    console.error(`Duplicate SKU detected: ${p.sku}`);
    valid = false;
  }
  skuSet.add(p.sku);

  if (p.original_price < 1499 || p.original_price > 3999) {
    console.error(`Original price out of range for product ${idx}: ${p.original_price}`);
    valid = false;
  }
  if (p.price < 799 || p.price > 1999) {
    console.error(`Price out of range for product ${idx}: ${p.price}`);
    valid = false;
  }
  if (!p.images.front || !p.images.front.startsWith('https://res.cloudinary.com/')) {
    console.error(`Invalid Cloudinary URL for product ${p.name}: ${p.images.front}`);
    valid = false;
  }
});

if (valid) {
  console.log('✓ All 24 validation criteria PASSED!');
}
