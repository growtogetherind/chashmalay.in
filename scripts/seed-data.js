import { db } from "./admin.js";

const products = [
  {
    name: "Aviator Classic 1971",
    brand: "Ray-Ban",
    category: "sunglasses",
    shape: "Aviator",
    theme: "Classic",
    price: 8499,
    original_price: 11999,
    frame_image: "/assets/im/all_img/0rb1971_914751_030a_2.png",
    model_image: "/assets/im/mdel.png",
    is_new: true,
    is_active: true,
    stock_quantity: 45,
    description: "The return of a legend. The 70s vibe is back with these oversized square metal frames."
  },
  {
    name: "Wayfarer Onyx",
    brand: "Ray-Ban",
    category: "sunglasses",
    shape: "Wayfarer",
    theme: "Modern",
    price: 6599,
    original_price: 8999,
    frame_image: "/assets/im/all_img/0rb2132_601s78_030a_1.png",
    model_image: "/assets/im/mdel.png",
    is_new: false,
    is_active: true,
    stock_quantity: 120,
    description: "Sleek matte finish on the classic Wayfarer silhouette. A modern take on an icon."
  },
  {
    name: "Titanium Tech Frame",
    brand: "Titan",
    category: "eyeglasses",
    shape: "Rectangle",
    theme: "Luxury",
    price: 12499,
    original_price: 15000,
    frame_image: "/assets/frames/Create_video_showing_202604260251_009.jpg",
    model_image: "/assets/im/mdel.png",
    is_new: true,
    is_active: true,
    stock_quantity: 25,
    description: "Ultra-lightweight titanium frames with Japanese engineering for maximum comfort."
  },
  {
    name: "Retro Gold Round",
    brand: "Chashmaly Elite",
    category: "eyeglasses",
    shape: "Round",
    theme: "Vintage",
    price: 3899,
    original_price: 5499,
    frame_image: "/assets/frames/Create_video_showing_202604260251_015.jpg",
    model_image: "/assets/im/mdel.png",
    is_new: true,
    is_active: true,
    stock_quantity: 60,
    description: "Vintage-inspired round gold frames for those who appreciate timeless style."
  },
  {
    name: "Minimalist Black Rim",
    brand: "VisionPlus",
    category: "eyeglasses",
    shape: "Square",
    theme: "Minimalist",
    price: 2499,
    original_price: 3500,
    frame_image: "/assets/im/all_img/0rx5154_8375_6.png",
    model_image: "/assets/im/mdel.png",
    is_new: false,
    is_active: true,
    stock_quantity: 100,
    description: "Clean, sharp lines define this minimalist masterpiece. Less is more."
  },
  {
    name: "Round Matte Gunmetal",
    brand: "Chashmaly Elite",
    category: "eyeglasses",
    shape: "Round",
    theme: "Modern",
    price: 4299,
    original_price: 5999,
    frame_image: "/assets/im/all_img/0rx6465_2890_030a_1.png",
    model_image: "/assets/im/mdel.png",
    is_new: true,
    is_active: true,
    stock_quantity: 30,
    description: "Modern round frames in a sophisticated gunmetal finish."
  },
  {
    name: "Classic Tortoise Shell",
    brand: "Ray-Ban",
    category: "sunglasses",
    shape: "Wayfarer",
    theme: "Classic",
    price: 7299,
    original_price: 9999,
    frame_image: "/assets/im/all_img/0rb2132_710_51_030a_1.png",
    model_image: "/assets/im/mdel.png",
    is_new: false,
    is_active: true,
    stock_quantity: 80,
    description: "The timeless Wayfarer in a rich tortoise shell pattern."
  },
  {
    name: "Blue Light Pro",
    brand: "VisionPlus",
    category: "special-power",
    shape: "Rectangle",
    theme: "Minimalist",
    price: 1599,
    original_price: 2200,
    frame_image: "/assets/im/all_img/0rx3929v__3207__p21__shad__qt_1.png",
    model_image: "/assets/im/mdel.png",
    is_new: false,
    is_active: true,
    stock_quantity: 200,
    description: "Advanced blue light filtering for the digital professional."
  }
];

async function seed() {
  console.log("Seeding products...");
  for (const product of products) {
    const docRef = await db.collection("products").add({
      ...product,
      created_at: new Date(),
      sku: `SKU-${Math.floor(Math.random() * 100000)}`
    });
    console.log(`Added product: ${product.name} with ID: ${docRef.id}`);
  }
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Error seeding data:", err);
  process.exit(1);
});
