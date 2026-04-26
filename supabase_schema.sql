-- ============================================================
-- CHASHMALY.IN — SUPABASE DATABASE SCHEMA
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ─────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  shipping_addresses jsonb default '[]'::jsonb,
  is_admin boolean default false,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for all using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── CATEGORIES ───────────────────────────────────────────────────────────────
create table if not exists categories (
  id serial primary key,
  slug text unique not null,
  name text not null,
  description text,
  image_url text
);

insert into categories (slug, name, description) values
  ('eyeglasses', 'Eyeglasses', 'Prescription eyeglasses for all powers'),
  ('sunglasses', 'Sunglasses', 'UV-protected sunglasses'),
  ('contacts', 'Contact Lenses', 'Daily, monthly and colored lenses'),
  ('special-power', 'Special Power', 'High power and progressive lenses')
on conflict (slug) do nothing;

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────
create table if not exists products (
  id uuid default uuid_generate_v4() primary key,
  sku text unique,
  name text not null,
  brand text not null,
  category text references categories(slug),
  shape text,
  description text,
  price numeric(10,2) not null,
  original_price numeric(10,2),
  stock_quantity integer default 100,
  frame_image text,
  model_image text,
  images text[] default array[]::text[],
  colors jsonb default '[]'::jsonb,
  sizes jsonb default '{}'::jsonb,
  tags text[] default array[]::text[],
  is_new boolean default false,
  is_active boolean default true,
  rating numeric(3,2) default 4.5,
  review_count integer default 0,
  created_at timestamptz default now()
);

alter table products enable row level security;
create policy "Anyone can view active products" on products for select using (is_active = true);
create policy "Admins can manage products" on products for all using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- ─── CART ITEMS ───────────────────────────────────────────────────────────────
create table if not exists cart_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  quantity integer default 1 check (quantity > 0),
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

alter table cart_items enable row level security;
create policy "Users can manage own cart" on cart_items for all using (auth.uid() = user_id);

-- ─── WISHLISTS ────────────────────────────────────────────────────────────────
create table if not exists wishlists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

alter table wishlists enable row level security;
create policy "Users can manage own wishlist" on wishlists for all using (auth.uid() = user_id);

-- ─── ORDERS ───────────────────────────────────────────────────────────────────
create table if not exists orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  total_amount numeric(10,2) not null,
  status text default 'confirmed' check (status in ('pending','confirmed','packed','shipped','delivered','cancelled')),
  shipping_address jsonb not null,
  razorpay_payment_id text,
  razorpay_order_id text,
  tracking_number text,
  estimated_delivery date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table orders enable row level security;
create policy "Users can view own orders" on orders for select using (auth.uid() = user_id);
create policy "Users can create orders" on orders for insert with check (auth.uid() = user_id);
create policy "Admins can manage all orders" on orders for all using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- ─── ORDER ITEMS ──────────────────────────────────────────────────────────────
create table if not exists order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  product_name text not null,
  quantity integer not null,
  price numeric(10,2) not null
);

alter table order_items enable row level security;
create policy "Users can view own order items" on order_items for select using (
  exists (select 1 from orders where id = order_id and user_id = auth.uid())
);
create policy "Users can create order items" on order_items for insert with check (
  exists (select 1 from orders where id = order_id and user_id = auth.uid())
);

-- ─── REVIEWS ──────────────────────────────────────────────────────────────────
create table if not exists reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  product_id uuid references products(id) on delete cascade,
  rating integer check (rating between 1 and 5) default 5,
  comment text,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

alter table reviews enable row level security;
create policy "Anyone can read reviews" on reviews for select using (true);
create policy "Logged in users can add reviews" on reviews for insert with check (auth.uid() = user_id);

-- ─── SEED PRODUCTS ────────────────────────────────────────────────────────────
insert into products (sku, name, brand, category, shape, description, price, original_price, is_new, tags, frame_image, model_image) values
  ('CE-TI-AV-001', 'Titanium Aviator Elite', 'Chashmaly Elite', 'eyeglasses', 'Aviator', 'Ultra-lightweight titanium frame with anti-glare coating', 3499, 4999, true, array['Best Seller', 'Anti-Glare'], 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800'),
  ('CE-TI-RT-002', 'Classic Tortoise Round', 'VisionPlus', 'eyeglasses', 'Round', 'Handcrafted acetate round frame in rich tortoise shell', 2199, 2999, false, array['Trending'], 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800'),
  ('CE-MB-WF-003', 'Wayfarer Matte Black', 'SunBlock', 'sunglasses', 'Wayfarer', 'Polarized UV400 matte black wayfarer', 1899, 2799, true, array['New Arrival', 'UV400'], 'https://images.unsplash.com/photo-1572635196237-14b3f281501f?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1520975954732-57dd22299614?auto=format&fit=crop&q=80&w=800'),
  ('CE-PR-RL-004', 'Rimless Rectangular', 'Chashmaly Pro', 'eyeglasses', 'Rectangle', 'Featherlight rimless design ideal for high power', 4299, 5599, false, array['Premium'], 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800'),
  ('CE-GD-AV-005', 'Gold Aviator Classic', 'Chashmaly Elite', 'sunglasses', 'Aviator', 'Stainless steel gold frame with gradient green lenses', 2799, 3499, false, array['Classic', 'Polarized'], 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800'),
  ('CE-BL-CT-006', 'Blu-Light Cat Eye', 'VisionPlus', 'eyeglasses', 'Cat Eye', 'Premium blue-light blocking cat eye frame for screens', 1599, 2199, true, array['Blue Light', 'New Arrival'], 'https://images.unsplash.com/photo-1582142407894-ec85a1260a46?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800'),
  ('CE-DL-CL-007', 'Daily Comfort Lenses', 'FreshVision', 'contacts', 'N/A', '30-day pack of ultra-comfortable daily disposable lenses', 999, 1299, false, array['Best Seller'], 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=800'),
  ('CE-SP-HI-008', 'High Power Progressive', 'Chashmaly Pro', 'special-power', 'Rectangle', 'Precision progressive lenses for powers above -8.0', 6999, 9999, false, array['Progressive', 'Premium'], 'https://images.unsplash.com/photo-1553695563-d4082f7b1da4?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800')
on conflict (sku) do nothing;

-- Done! Your database is ready.
select 'Schema created successfully!' as status;
