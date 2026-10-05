import fs from 'fs';
import path from 'path';

const models = JSON.parse(fs.readFileSync('scripts/catalog_models_44.json', 'utf8'));

function slugify(text) {
  return text.toString().toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '_');
}

const uploadPlan = [];
let gCount = 0;
let sgCount = 0;

models.forEach(mod => {
  const isGlasses = mod.category === 'Glasses';
  const pid = isGlasses ? ('CH-G-' + String(++gCount).padStart(3, '0')) : ('CH-SG-' + String(++sgCount).padStart(3, '0'));
  const catSlug = isGlasses ? 'glasses' : 'sunglasses';

  mod.variants.forEach(variant => {
    const colorSlug = slugify(variant.color).replace(/_/g, '-');
    const targetFolder = `chashmalay/${catSlug}/${pid}/${colorSlug}`;

    const roleTracker = {};
    variant.images.forEach(img => {
      let role = (img.role || 'front').toLowerCase();
      if (role === 'front' || role === 'front view') role = 'front';
      else if (role === 'side' || role === 'side view') role = 'side';
      else if (role.includes('clip')) role = 'clipon';
      else role = 'view';

      roleTracker[role] = (roleTracker[role] || 0) + 1;
      const roleSuffix = roleTracker[role] > 1 ? `${role}_${roleTracker[role]}` : role;
      const publicId = `chashmalay_${catSlug}_${pid.toLowerCase().replace(/-/g, '_')}_${slugify(variant.color)}_${roleSuffix}`;

      uploadPlan.push({
        productId: pid,
        productName: mod.name,
        category: mod.category,
        productType: mod.productType,
        shape: mod.shape,
        material: mod.material,
        sourceGroup: img.group,
        filename: img.filename,
        localPath: path.join('Chashmalay final', img.group, img.filename).replace(/\\/g, '/'),
        color: variant.color,
        role: role,
        cloudinaryFolder: targetFolder,
        publicId: publicId
      });
    });
  });
});

console.log('Total items in upload plan:', uploadPlan.length);
console.log('Sample plan item:', JSON.stringify(uploadPlan[0], null, 2));
fs.writeFileSync('scripts/upload_plan_199.json', JSON.stringify(uploadPlan, null, 2));
