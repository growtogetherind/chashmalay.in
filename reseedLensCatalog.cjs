const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteCollection(collectionPath) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(100);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject);
  });
}

async function deleteQueryBatch(query, resolve, reject) {
  try {
    const snapshot = await query.get();

    if (snapshot.size === 0) {
      resolve();
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    // Recurse until the collection is fully deleted
    process.nextTick(() => {
      deleteQueryBatch(query, resolve, reject);
    });
  } catch (error) {
    reject(error);
  }
}

async function reseed() {
  try {
    console.log("Cleaning old lens catalog...");
    await deleteCollection('lens_categories');
    await deleteCollection('lenses');
    await deleteCollection('lens_addons');
    console.log("Old collections cleaned!");

    const now = admin.firestore.FieldValue.serverTimestamp();

    // 1. Seed Categories
    console.log("Seeding categories...");
    const categoryIds = {};
    const defaultCats = [
      { name: 'Single Vision', slug: 'single-vision', description: 'Corrects one field of vision (Distance or Reading).', sort_order: 1, is_active: true },
      { name: 'Bifocal', slug: 'bifocal', description: 'Two optical powers in one lens for Distance and Reading.', sort_order: 2, is_active: true },
      { name: 'Progressive', slug: 'progressive', description: 'Seamless transition between Distance, Intermediate and Reading vision.', sort_order: 3, is_active: true },
    ];

    for (const cat of defaultCats) {
      const ref = await db.collection("lens_categories").add({
        ...cat,
        created_at: now,
        updated_at: now
      });
      categoryIds[cat.slug] = ref.id;
    }
    console.log("Categories seeded successfully!");

    // 2. Seed Lenses
    console.log("Seeding lenses...");
    const defaultLenses = [
      // Single Vision Lenses
      {
        name: 'Anti Glare Premium (Echo HMC)',
        category_id: categoryIds['single-vision'] || '',
        category_name: 'Single Vision',
        price: 490,
        description: 'Affordable anti-glare lens for everyday use.',
        features: ['Anti Glare Coating', 'Scratch Resistant', 'Better Clarity', 'Daily Use', 'Lightweight'],
        badge: 'Budget',
        sort_order: 1,
        is_active: true
      },
      {
        name: 'Blue Protection (Nature UV)',
        category_id: categoryIds['single-vision'] || '',
        category_name: 'Single Vision',
        price: 749,
        description: 'Protects eyes from blue light emitted by digital screens.',
        features: ['Blue Light Protection', 'UV Protection', 'Scratch Resistant', 'Clear Vision', 'Suitable for Office Use'],
        badge: 'Popular',
        sort_order: 2,
        is_active: true
      },
      {
        name: 'Low Reflection Blue Screen',
        category_id: categoryIds['single-vision'] || '',
        category_name: 'Single Vision',
        price: 1349,
        description: 'Premium blue-cut lens with low reflection coating.',
        features: ['Premium Blue Filter', 'Low Reflection', 'UV Protection', 'Anti Glare', 'Scratch Resistant', 'High Clarity'],
        badge: 'Top Selling',
        sort_order: 3,
        is_active: true
      },
      {
        name: 'Night Driving + Blue Protection',
        category_id: categoryIds['single-vision'] || '',
        category_name: 'Single Vision',
        price: 1499,
        description: 'Special coating for reduced glare while driving at night.',
        features: ['Night Driving Technology', 'Blue Protection', 'Anti Glare', 'Better Contrast', 'Scratch Resistant'],
        badge: 'Recommended',
        sort_order: 4,
        is_active: true
      },

      // Bifocal Lenses
      {
        name: 'Round Top Bifocal',
        category_id: categoryIds['bifocal'] || '',
        category_name: 'Bifocal',
        price: 699,
        description: 'Traditional bifocal lens.',
        features: ['UV Protection', 'Free Anti Reflection', 'Reading Segment', 'Scratch Resistant'],
        badge: 'Budget',
        sort_order: 1,
        is_active: true
      },
      {
        name: 'Anti Glare Round Top (Echo HMC)',
        category_id: categoryIds['bifocal'] || '',
        category_name: 'Bifocal',
        price: 1249,
        description: 'Round-top bifocal with anti-glare coating.',
        features: ['Anti Glare', 'Scratch Resistant', 'Better Clarity', 'UV Protection'],
        badge: 'Popular',
        sort_order: 2,
        is_active: true
      },
      {
        name: 'Blue Protection (Nature UV)',
        category_id: categoryIds['bifocal'] || '',
        category_name: 'Bifocal',
        price: 1799,
        description: 'Blue light protection bifocal lens.',
        features: ['Blue Light Protection', 'UV Protection', 'Anti Glare', 'Scratch Resistant', 'Premium Finish'],
        badge: 'Top Selling',
        sort_order: 3,
        is_active: true
      },
      {
        name: 'Blue Screen Protect Lens',
        category_id: categoryIds['bifocal'] || '',
        category_name: 'Bifocal',
        price: 2490,
        description: 'Premium bifocal lens for heavy screen users.',
        features: ['Advanced Blue Filter', 'UV Protection', 'Premium Anti Reflection', 'Better Eye Comfort', 'Scratch Resistant'],
        badge: 'Recommended',
        sort_order: 4,
        is_active: true
      },

      // Progressive Lenses
      {
        name: 'Anti Glare Premium (Echo HMC)',
        category_id: categoryIds['progressive'] || '',
        category_name: 'Progressive',
        price: 1190,
        description: 'Entry-level progressive lens.',
        features: ['Anti Glare', 'Scratch Resistant', 'Smooth Transition', 'Daily Use'],
        badge: 'Budget',
        sort_order: 1,
        is_active: true
      },
      {
        name: 'Blue Protection (Nature UV)',
        category_id: categoryIds['progressive'] || '',
        category_name: 'Progressive',
        price: 1549,
        description: 'Progressive lens with blue light protection.',
        features: ['Blue Protection', 'UV Protection', 'Anti Glare', 'Scratch Resistant'],
        badge: 'Popular',
        sort_order: 2,
        is_active: true
      },
      {
        name: 'Low Reflection Blue Screen',
        category_id: categoryIds['progressive'] || '',
        category_name: 'Progressive',
        price: 2490,
        description: 'Premium progressive lens with low reflection coating.',
        features: ['Premium Blue Filter', 'Low Reflection', 'Anti Glare', 'UV Protection', 'Scratch Resistant'],
        badge: 'Top Selling',
        sort_order: 3,
        is_active: true
      },
      {
        name: 'Wide Corridor Blue Protection',
        category_id: categoryIds['progressive'] || '',
        category_name: 'Progressive',
        price: 2490,
        description: 'Wide viewing area with blue light protection.',
        features: ['Wide Corridor Design', 'Blue Protection', 'Smooth Transition', 'Comfortable Vision'],
        badge: 'Recommended',
        sort_order: 4,
        is_active: true
      },
      {
        name: 'Wide Corridor + Low Reflection Blue Screen',
        category_id: categoryIds['progressive'] || '',
        category_name: 'Progressive',
        price: 3490,
        description: 'Wide corridor premium lens with blue filter.',
        features: ['Wide Corridor', 'Premium Blue Filter', 'Low Reflection', 'Anti Glare', 'UV Protection'],
        badge: 'Best Value',
        sort_order: 5,
        is_active: true
      },
      {
        name: 'Wide Corridor Night Driving + Blue Protection',
        category_id: categoryIds['progressive'] || '',
        category_name: 'Progressive',
        price: 3890,
        description: 'Ultimate progressive lens for professionals and frequent drivers.',
        features: ['Night Driving Technology', 'Wide Corridor', 'Blue Protection', 'Premium Anti Reflection', 'UV Protection', 'Scratch Resistant'],
        badge: 'Premium',
        sort_order: 6,
        is_active: true
      }
    ];

    for (const lens of defaultLenses) {
      await db.collection("lenses").add({
        ...lens,
        created_at: now,
        updated_at: now
      });
    }
    console.log("Lenses seeded successfully!");

    // 3. Seed Addons
    console.log("Seeding addons...");
    const defaultAddons = [
      // Lens Treatment
      {
        name: 'Base Lens',
        group: 'Lens Treatment',
        price: 0,
        description: 'Standard clear lens included.',
        applicable_categories: ['single-vision', 'bifocal', 'progressive'],
        sort_order: 1,
        is_active: true,
        is_default: true
      },
      {
        name: 'Photochromic Grey',
        group: 'Lens Treatment',
        price: 500,
        description: 'Automatically darkens outdoors and becomes clear indoors.',
        applicable_categories: ['single-vision', 'bifocal', 'progressive'],
        sort_order: 2,
        is_active: true,
        is_default: false
      },
      {
        name: 'Photochromic Brown',
        group: 'Lens Treatment',
        price: 500,
        description: 'Brown transition tint for better outdoor contrast.',
        applicable_categories: ['single-vision', 'bifocal', 'progressive'],
        sort_order: 3,
        is_active: true,
        is_default: false
      }
    ];

    for (const addon of defaultAddons) {
      await db.collection("lens_addons").add({
        ...addon,
        created_at: now,
        updated_at: now
      });
    }
    console.log("Addons seeded successfully!");
    console.log("ALL SEEDING COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("FATAL ERROR DURING RESEED:", err);
    process.exit(1);
  }
}

reseed();
