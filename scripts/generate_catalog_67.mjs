import fs from 'fs';
import path from 'path';

const hexMap = JSON.parse(fs.readFileSync('scripts/color_hex_map.json', 'utf8'));
const uploads = JSON.parse(fs.readFileSync('scripts/cloudinary_upload_progress.json', 'utf8'));

// Build lookup: filename -> upload record
const fileUploadMap = {};
for (const item of Object.values(uploads)) {
  fileUploadMap[item.filename] = item;
}

// Build file metadata from upload plan
const plan = JSON.parse(fs.readFileSync('scripts/upload_plan_199.json', 'utf8'));
const planMap = {};
for (const item of plan) {
  planMap[item.filename] = item;
}

const root = 'Chashmalay final';
const dirs = fs.readdirSync(root, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => ({
    name: d.name,
    prefix: d.name.startsWith('SG') ? 'SG' : 'G',
    num: parseInt(d.name.replace(/^[A-Za-z]+/, ''), 10)
  }))
  .sort((a, b) => a.num - b.num);

const products67 = [];

for (const d of dirs) {
  const dirPath = path.join(root, d.name);
  const files = fs.readdirSync(dirPath).filter(f => !f.startsWith('.')).sort();
  if (files.length === 0) continue; // Skip empty groups (G29, G33, G62, G68)

  const isGlasses = d.prefix === 'G';
  const numPad = String(d.num).padStart(3, '0');
  const sku = (isGlasses ? 'CH-G-' : 'CH-SG-') + numPad;
  const catSlug = isGlasses ? 'eyeglasses' : 'sunglasses';
  const prodType = isGlasses ? 'Eyeglasses' : 'Sunglasses';

  // Group files in this folder by color
  const colorsInFolder = {};
  let dominantName = '';
  let dominantShape = 'Square';
  let dominantMaterial = 'Acetate';

  files.forEach(f => {
    const meta = planMap[f];
    const colorName = meta ? meta.color : 'Classic';
    if (meta) {
      if (!dominantName) dominantName = meta.productName;
      dominantShape = meta.shape;
      dominantMaterial = meta.material;
    }
    if (!colorsInFolder[colorName]) colorsInFolder[colorName] = [];
    colorsInFolder[colorName].push(f);
  });

  const colorNames = Object.keys(colorsInFolder);
  let prodName = dominantName || (`Chashmalay ${dominantShape} Frame`);
  if (colorNames.length === 1 && !prodName.includes(colorNames[0])) {
    prodName = `${prodName} - ${colorNames[0]}`;
  }

  const colorVariants = [];
  const availableColors = [];

  for (const cName of colorNames) {
    availableColors.push(cName);
    const hex = hexMap[cName] || '#1A1A1A';
    const cFiles = colorsInFolder[cName];
    const gallery = [];
    let frontUrl = '';
    let sideUrl = '';

    // Sort images so 'front' comes first
    const sortedFiles = [...cFiles].sort((a, b) => {
      const aMeta = planMap[a];
      const bMeta = planMap[b];
      const aIsFront = (aMeta?.role || '').includes('front');
      const bIsFront = (bMeta?.role || '').includes('front');
      if (aIsFront && !bIsFront) return -1;
      if (!aIsFront && bIsFront) return 1;
      return 0;
    });

    for (const f of sortedFiles) {
      const up = fileUploadMap[f];
      if (up && up.secure_url) {
        gallery.push(up.secure_url);
        const meta = planMap[f];
        const role = (meta?.role || '').toLowerCase();
        if (!frontUrl && (role.includes('front') || sortedFiles.length === 1)) {
          frontUrl = up.secure_url;
        } else if (!sideUrl && role.includes('side')) {
          sideUrl = up.secure_url;
        }
      }
    }

    if (!frontUrl && gallery.length > 0) frontUrl = gallery[0];
    if (!sideUrl && gallery.length > 0) sideUrl = gallery[gallery.length > 1 ? 1 : 0];

    colorVariants.push({
      name: cName,
      hex: hex,
      color_code: hex,
      image: frontUrl,
      image_side: sideUrl,
      images: {
        front: frontUrl,
        side: sideUrl,
        gallery: gallery
      },
      gallery: gallery
    });
  }

  const defaultVariant = colorVariants[0];
  const basePrice = isGlasses ? 999 : 1299;
  const origPrice = isGlasses ? 1999 : 2499;

  let reviewRequired = false;
  let reviewNotes = 'Ready for production';
  if (!isGlasses && ['CH-SG-043', 'CH-SG-044', 'CH-SG-045', 'CH-SG-046', 'CH-SG-047', 'CH-SG-048', 'CH-SG-049', 'CH-SG-050', 'CH-SG-051', 'CH-SG-052'].includes(sku)) {
    if (prodName.toLowerCase().includes('reader') || prodName.toLowerCase().includes('optical') || prodName.toLowerCase().includes('junior') || prodName.toLowerCase().includes('rimless')) {
      reviewRequired = true;
      reviewNotes = 'Categorized as Sunglasses per SG folder prefix, but visual frames feature clear optical/reading lenses.';
    }
  }

  products67.push({
    id: sku,
    sku: sku,
    folder_group: d.name,
    name: prodName,
    brand: 'Chashmalay',
    category: catSlug,
    product_type: prodType,
    accessory_type: '',
    price: basePrice,
    original_price: origPrice,
    discount_price: basePrice,
    description: `${prodName} by Chashmalay featuring an elegant ${dominantShape.toLowerCase()} silhouette crafted from premium ${dominantMaterial.toLowerCase()}. Engineered for superior all-day comfort and timeless aesthetic appeal.`,
    stock_quantity: 50,
    gender: 'Unisex',
    frame_type: prodName.toLowerCase().includes('rimless') ? (prodName.toLowerCase().includes('semi') ? 'Semi-Rimless' : 'Rimless') : 'Full Rim',
    frame_shape: dominantShape,
    frame_material: dominantMaterial,
    lens_type: isGlasses ? 'Single Vision Prescription / Blue Cut Compatible' : 'UV400 Polarized Sunglasses',
    available_sizes: ['M', 'L'],
    available_colors: availableColors,
    default_color: defaultVariant.name,
    color: defaultVariant.name,
    color_hex: defaultVariant.hex,
    frame_color: defaultVariant.name,
    frame_image: defaultVariant.image,
    image: defaultVariant.image,
    tags: `${dominantShape.toLowerCase()}, ${catSlug}, chashmalay, ${dominantMaterial.toLowerCase()}, daily wear, unisex, lightweight, group-${d.name.toLowerCase()}`,
    is_active: true,
    is_new: true,
    is_featured: false,
    images: defaultVariant.images,
    gallery: defaultVariant.gallery,
    colors: colorVariants,
    source_groups: [d.name],
    review_required: reviewRequired,
    review_notes: reviewNotes
  });
}

console.log(`Generated exactly ${products67.length} products (1 per active folder).`);
const glassesCount = products67.filter(p => p.category === 'eyeglasses').length;
const sunglassesCount = products67.filter(p => p.category === 'sunglasses').length;
console.log(`Eyeglasses: ${glassesCount}, Sunglasses: ${sunglassesCount}`);

fs.writeFileSync('catalog.json', JSON.stringify(products67, null, 2));
fs.writeFileSync('public/catalog.json', JSON.stringify(products67, null, 2));
console.log('Saved 67 products to catalog.json and public/catalog.json successfully!');
