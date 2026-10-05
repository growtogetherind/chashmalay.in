import fs from 'fs';
import path from 'path';

const uploads = JSON.parse(fs.readFileSync('scripts/cloudinary_upload_progress.json', 'utf8'));
const hexMap = JSON.parse(fs.readFileSync('scripts/color_hex_map.json', 'utf8'));
const models = JSON.parse(fs.readFileSync('scripts/catalog_models_44.json', 'utf8'));

// Build lookup: filename -> upload record
const fileUploadMap = {};
for (const item of Object.values(uploads)) {
  fileUploadMap[item.filename] = item;
}

const finalCatalog = [];
let gCount = 0;
let sgCount = 0;

for (const mod of models) {
  const isGlasses = mod.category === 'Glasses';
  const pid = isGlasses 
    ? ('CH-G-' + String(++gCount).padStart(3, '0')) 
    : ('CH-SG-' + String(++sgCount).padStart(3, '0'));

  const categorySlug = isGlasses ? 'eyeglasses' : 'sunglasses';
  const productType = isGlasses ? 'Eyeglasses' : 'Sunglasses';

  // Process color variants
  const colorVariants = [];
  const availableColors = [];

  for (const variant of mod.variants) {
    availableColors.push(variant.color);
    const hex = hexMap[variant.color] || '#1A1A1A';

    // Find front image, side image, and all gallery images for this variant
    let frontImgUrl = '';
    let sideImgUrl = '';
    const variantGallery = [];

    // Sort images so 'front' comes first
    const sortedImages = [...variant.images].sort((a, b) => {
      const aIsFront = (a.role || '').toLowerCase().includes('front');
      const bIsFront = (b.role || '').toLowerCase().includes('front');
      if (aIsFront && !bIsFront) return -1;
      if (!aIsFront && bIsFront) return 1;
      return 0;
    });

    for (const img of sortedImages) {
      const uploadRecord = fileUploadMap[img.filename];
      if (uploadRecord && uploadRecord.secure_url) {
        variantGallery.push(uploadRecord.secure_url);
        const role = (img.role || '').toLowerCase();
        if (!frontImgUrl && (role.includes('front') || sortedImages.length === 1)) {
          frontImgUrl = uploadRecord.secure_url;
        } else if (!sideImgUrl && (role.includes('side') || role.includes('angle'))) {
          sideImgUrl = uploadRecord.secure_url;
        }
      }
    }

    if (!frontImgUrl && variantGallery.length > 0) {
      frontImgUrl = variantGallery[0];
    }
    if (!sideImgUrl && variantGallery.length > 0) {
      sideImgUrl = variantGallery[variantGallery.length > 1 ? 1 : 0];
    }

    colorVariants.push({
      name: variant.color,
      hex: hex,
      color_code: hex,
      image: frontImgUrl,
      image_side: sideImgUrl,
      images: {
        front: frontImgUrl,
        side: sideImgUrl,
        gallery: variantGallery
      },
      gallery: variantGallery
    });
  }

  const defaultVariant = colorVariants[0] || {
    name: 'Standard',
    hex: '#1A1A1A',
    image: '',
    image_side: '',
    images: { front: '', side: '', gallery: [] },
    gallery: []
  };

  // Check if flagged for review
  let reviewRequired = false;
  let reviewNotes = 'Ready for production';

  if (!isGlasses && ['CH-SG-004', 'CH-SG-005', 'CH-SG-006', 'CH-SG-007'].includes(pid)) {
    reviewRequired = true;
    reviewNotes = 'Categorized as Sunglasses per SG folder prefix, but visual frames feature clear optical/reading lenses. Recommended for catalog team review.';
  }

  const basePrice = isGlasses ? 999 : 1299;
  const originalPrice = isGlasses ? 1999 : 2499;

  const productRecord = {
    id: pid,
    sku: pid,
    name: mod.name,
    brand: 'Chashmalay',
    category: categorySlug,
    product_type: productType,
    accessory_type: '',
    price: basePrice,
    original_price: originalPrice,
    discount_price: basePrice,
    description: `${mod.name} by Chashmalay featuring a precision-crafted ${mod.shape.toLowerCase()} silhouette in premium ${mod.material.toLowerCase()}. Designed for balanced ergonomic comfort, daily durability, and timeless styling.`,
    stock_quantity: 50,
    gender: 'Unisex',
    frame_type: mod.name.toLowerCase().includes('rimless') ? (mod.name.toLowerCase().includes('semi') ? 'Semi-Rimless' : 'Rimless') : 'Full Rim',
    frame_shape: mod.shape,
    frame_material: mod.material,
    lens_type: isGlasses ? 'Single Vision Prescription / Blue Cut Compatible' : 'UV400 Polarized Sunglasses',
    available_sizes: ['M', 'L'],
    available_colors: availableColors,
    default_color: defaultVariant.name,
    color: defaultVariant.name,
    color_hex: defaultVariant.hex,
    frame_color: defaultVariant.name,
    frame_image: defaultVariant.image,
    image: defaultVariant.image,
    tags: `${mod.shape.toLowerCase()}, ${categorySlug}, chashmalay, ${mod.material.toLowerCase()}, daily wear, unisex, lightweight`,
    is_active: true,
    is_new: true,
    is_featured: false,
    images: defaultVariant.images,
    gallery: defaultVariant.gallery,
    colors: colorVariants,
    source_groups: mod.sourceGroups,
    review_required: reviewRequired,
    review_notes: reviewNotes
  };

  finalCatalog.push(productRecord);
}

console.log(`Generated ${finalCatalog.length} production catalog products.`);
fs.writeFileSync('catalog.json', JSON.stringify(finalCatalog, null, 2));
fs.writeFileSync('public/catalog.json', JSON.stringify(finalCatalog, null, 2));
console.log('Successfully saved to catalog.json and public/catalog.json!');
