import { db } from "./admin.js";
import fs from 'fs';
import path from 'path';

const IMG_DIR = 'public/assets/im/all_img';
const FRAMES_DIR = 'public/assets/frames';

async function seedEverything() {
    console.log("🚀 Starting Targeted Seeding...");

    // 1. Clean up existing seeded data to avoid duplicates
    console.log("🧹 Cleaning old seed data...");
    const oldProducts = await db.collection("products").get();
    for (const doc of oldProducts.docs) {
        if (doc.data().sku?.startsWith('SKU-')) await doc.ref.delete();
    }
    const oldCarousel = await db.collection("carousel").get();
    for (const doc of oldCarousel.docs) {
        await doc.ref.delete();
    }

    // 2. Process Posters/Banners for Carousel
    const files = fs.readdirSync(IMG_DIR);
    const bannerFiles = files.filter(f => 
        f.toLowerCase().includes('banner') || 
        f.toLowerCase().includes('poster') ||
        f.match(/26march-.*banner/i)
    );

    console.log(`🎞️ Seeding Carousel with ${bannerFiles.length} banners...`);
    const processedBanners = new Set();
    for (let i = 0; i < bannerFiles.length; i++) {
        const file = bannerFiles[i];
        if (processedBanners.has(file)) continue;
        const isMobileVariant = (f) => f.toLowerCase().includes('mobile') || f.toLowerCase().includes('-mb') || f.toLowerCase().startsWith('mobile_');
        if (isMobileVariant(file)) continue;

        let title = file.split('-').join(' ').toUpperCase().split('.')[0];
        if (title.includes('26MARCH')) title = title.replace('26MARCH', 'COLLECTION 2024');

        let mobileImage = '';
        const mobileMatch = bannerFiles.find(f => 
            f !== file && isMobileVariant(f) &&
            (f.replace('mobile', '').replace('banner', '').replace('-mb', '').toLowerCase().includes(file.replace('website', '').replace('banner', '').split('.')[0].toLowerCase()))
        );
        if (mobileMatch) mobileImage = `/assets/im/all_img/${mobileMatch}`;
        
        await db.collection("carousel").add({
            title: title,
            subtitle: 'Vision with Perspective',
            image: `/assets/im/all_img/${file}`,
            mobile_image: mobileImage,
            link: '/category/eyeglasses',
            order: i,
            is_active: true,
            theme: file.toLowerCase().includes('dark') ? 'dark' : 'light',
            created_at: new Date()
        });
        processedBanners.add(file);
        if (mobileMatch) processedBanners.add(mobileMatch);
    }

    // 3. Seed Specific Category Products (Men, Women, Kids)
    console.log("🎯 Seeding Specific Category Products...");
    const specificProducts = [
        { file: '26march-MEN.jpg.jpeg', name: 'Elite Men Collection', category: 'eyeglasses', price: 9999, brand: 'Titan Elite' },
        { file: '26march-WOMEN.jpg.jpeg', name: 'Luxury Women Series', category: 'eyeglasses', price: 10999, brand: 'Chanel Style' },
        { file: '26march-KIDS.jpg.jpeg', name: 'Junior Active Frames', category: 'eyeglasses', price: 4999, brand: 'Vision Kids' }
    ];

    for (const sp of specificProducts) {
        const sku = `SKU-${sp.file.split('.')[0].toUpperCase()}`;
        await db.collection("products").add({
            name: sp.name,
            brand: sp.brand,
            category: sp.category,
            shape: 'Classic',
            theme: 'Modern',
            price: sp.price,
            original_price: Math.floor(sp.price * 1.3),
            frame_image: `/assets/im/all_img/${sp.file}`,
            model_image: "/assets/im/mdel.png",
            is_new: true,
            is_active: true,
            is_featured: true, // Mark for 'Most Loved' section
            stock_quantity: 50,
            description: `Exclusive 2024 collection designed for style and comfort.`,
            sku: sku,
            created_at: new Date()
        });
        console.log(`✅ Added Specific Product: ${sp.name}`);
    }

    // 4. Process Contact Lenses
    console.log("👁️ Seeding Contact Lenses...");
    const CONTACT_DIR = 'public/assets/im/contactlens';
    if (fs.existsSync(CONTACT_DIR)) {
        const contactFiles = fs.readdirSync(CONTACT_DIR).filter(f => f.match(/\.(jpg|jpeg|png|webp|avif)$/i));
        for (const file of contactFiles) {
            const sku = `SKU-CL-${file.split('.')[0].toUpperCase()}`;
            await db.collection("products").add({
                name: file.split('.')[0].replace(/_/g, ' ').toUpperCase() + ' Lens',
                brand: 'Chashmaly Vision',
                category: 'contacts',
                shape: 'Circular',
                theme: 'Healthcare',
                price: 999 + (Math.floor(Math.random() * 5) * 200),
                original_price: 1500,
                frame_image: `/assets/im/contactlens/${file}`, 
                model_image: "/assets/im/mdel.png",
                is_new: true,
                is_active: true,
                is_featured: false,
                stock_quantity: 100,
                description: `High-quality breathable contact lenses for all-day comfort.`,
                sku: sku,
                created_at: new Date()
            });
        }
        console.log(`✅ Seeded ${contactFiles.length} contact lenses.`);
    }

    // 5. Process Remaining Glasses
    console.log("🛍️ Seeding remaining products...");
    let addedCount = specificProducts.length;

    for (const file of files) {
        if (file.toLowerCase().includes('banner') || file.toLowerCase().includes('mb')) continue;
        if (specificProducts.find(sp => sp.file === file)) continue;
        if (!file.match(/\.(jpg|jpeg|png|webp|avif)$/i)) continue;

        const sku = `SKU-${file.split('.')[0].toUpperCase()}`;
        let brand = "Chashmaly Elite", category = "eyeglasses", shape = "Rectangle";
        let name = file.split('.')[0].replace(/_/g, ' ').toUpperCase();

        if (file.startsWith('0rb')) { brand = "Ray-Ban"; category = "sunglasses"; }
        else if (file.startsWith('0rx')) { brand = "Ray-Ban"; category = "eyeglasses"; }
        
        const price = 2999 + (Math.floor(Math.random() * 20) * 500);
        await db.collection("products").add({
            name: name,
            brand: brand,
            category: category,
            shape: shape,
            theme: ['Classic', 'Modern', 'Luxury', 'Minimalist'][Math.floor(Math.random() * 4)],
            price: price,
            original_price: Math.floor(price * 1.4),
            frame_image: `/assets/im/all_img/${file}`,
            model_image: "/assets/im/mdel.png",
            is_new: Math.random() > 0.8,
            is_active: true,
            stock_quantity: 50,
            description: `Premium frames with superior build quality.`,
            sku: sku,
            created_at: new Date()
        });

        addedCount++;
        if (addedCount >= 40) break;
    }

    console.log(`🎉 Success! Seeded ${addedCount} products and carousel.`);
    process.exit(0);
}

seedEverything().catch(console.error);
