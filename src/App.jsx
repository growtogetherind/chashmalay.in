import { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute, AdminRoute } from './components/ui/ProtectedRoute';
import ErrorBoundary from './components/ui/ErrorBoundary';
import Navbar from './components/layout/Navbar.jsx';
import BottomNav from './components/layout/BottomNav.jsx';
import Footer from './components/layout/Footer.jsx';
import ScrollToTop from './components/ui/ScrollToTop.jsx';
import { ReactLenis } from '@studio-freight/react-lenis';
import CartDrawer from './components/ui/CartDrawer.jsx';
import { subscribeSettings } from './lib/firebase';
import './index.css';

// ─── Lazy-load all route-level pages ─────────────────────────────────────────
const Home         = lazy(() => import('./pages/Home.jsx'));
const Auth         = lazy(() => import('./pages/Auth.jsx'));
const Cart         = lazy(() => import('./pages/Cart.jsx'));
const Category     = lazy(() => import('./pages/Category.jsx'));
const ProductDetail = lazy(() => import('./pages/ProductDetail.jsx'));
const Checkout     = lazy(() => import('./pages/Checkout.jsx'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess.jsx'));
const Account      = lazy(() => import('./pages/Account.jsx'));
const OrderDetail  = lazy(() => import('./pages/OrderDetail.jsx'));
const Offers       = lazy(() => import('./pages/Offers.jsx'));
const ContactLens       = lazy(() => import('./pages/ContactLens.jsx'));
const ContactLensDetail = lazy(() => import('./pages/ContactLensDetail.jsx'));
const FindStore         = lazy(() => import('./pages/FindStore.jsx'));
const About             = lazy(() => import('./pages/About.jsx'));
const Terms             = lazy(() => import('./pages/Terms.jsx'));
const Privacy           = lazy(() => import('./pages/Privacy.jsx'));
const Contact           = lazy(() => import('./pages/Contact.jsx'));
const Faq               = lazy(() => import('./pages/Faq.jsx'));
const NotFound     = lazy(() => import('./pages/NotFound.jsx'));

const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard.jsx'));
const AdminProducts  = lazy(() => import('./pages/Admin/Products.jsx'));
const AdminInventory = lazy(() => import('./pages/Admin/Inventory.jsx'));
const AdminOrders    = lazy(() => import('./pages/Admin/Orders.jsx'));
const AdminCustomers = lazy(() => import('./pages/Admin/Customers.jsx'));
const AdminCoupons   = lazy(() => import('./pages/Admin/Coupons.jsx'));
const AdminOffers    = lazy(() => import('./pages/Admin/Offers.jsx'));
const AdminCarousel  = lazy(() => import('./pages/Admin/Carousel.jsx'));
const AdminCategories = lazy(() => import('./pages/Admin/Categories.jsx'));
const AdminBrands     = lazy(() => import('./pages/Admin/Brands.jsx'));
const AdminPrescriptions = lazy(() => import('./pages/Admin/Prescriptions.jsx'));
const AdminReviews       = lazy(() => import('./pages/Admin/Reviews.jsx'));
const AdminSettings      = lazy(() => import('./pages/Admin/Settings.jsx'));

// ─── Page-level Suspense fallback ─────────────────────────────────────────────
const PageLoader = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: '40px', height: '40px', border: '4px solid #1e3f8a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

const MaintenancePage = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
    <div className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70 sm:p-10">
      <p className="mb-4 text-[11px] font-black uppercase tracking-[0.35em] text-red-500">Maintenance Mode</p>
      <h1 className="mb-4 text-3xl font-black text-slate-900 sm:text-5xl">We’ll Be Back Soon</h1>
      <p className="mx-auto max-w-lg text-sm leading-7 text-slate-500 sm:text-base">
        The storefront is temporarily unavailable while we complete important updates. Admin access remains available.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a href="/auth" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-slate-700">
          Admin Login
        </a>
        <a href="/admin" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
          Open Admin
        </a>
      </div>
    </div>
  </div>
);

const PublicRoutes = ({ settings }) => {
  const location = useLocation();
  const isMaintenanceMode = Boolean(settings?.maintenance_mode);
  const isAllowedMaintenancePath = location.pathname === '/auth' || location.pathname.startsWith('/admin');

  if (isMaintenanceMode && !isAllowedMaintenancePath) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 sm:py-16">
        <MaintenancePage />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="main-content">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/category/:name" element={<Category />} />
              <Route path="/contact-lenses" element={<ContactLens />} />
              <Route path="/contact-lens/:id" element={<ContactLensDetail />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/find-store" element={<FindStore />} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/order-success/:orderId" element={<OrderSuccess />} />
              <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
              <Route path="/account/orders" element={<ProtectedRoute><Account /></ProtectedRoute>} />
              <Route path="/account/orders/:orderId" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
              <Route path="/about" element={<About />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/shipping" element={<Terms />} />
              <Route path="/returns" element={<Terms />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<Faq />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
};

function App() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const unsubscribe = subscribeSettings(setSettings);
    return unsubscribe;
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ReactLenis root options={{ 
        duration: 1.5, 
        lerp: 0.08, 
        smoothWheel: true, 
        wheelMultiplier: 1, 
        touchMultiplier: 2,
        infinite: false 
      }}>
        <ConfirmProvider>
          <AuthProvider>
            <CartProvider>
              <CartDrawer />
              <ScrollToTop />
              <ErrorBoundary>
                <div className="app-container">

                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: '#ffffff',
                      color: '#0f172a',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      borderRadius: '16px',
                      padding: '12px 20px',
                      border: '1px solid #f1f5f9',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
                    }
                  }}
                />

                <Routes>
                  {/* ── Admin routes — no Navbar/Footer ── */}
                  <Route path="/admin" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense></AdminRoute>} />
                  <Route path="/admin/products" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminProducts /></Suspense></AdminRoute>} />
                  <Route path="/admin/inventory" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminInventory /></Suspense></AdminRoute>} />
                  <Route path="/admin/orders" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminOrders /></Suspense></AdminRoute>} />
                  <Route path="/admin/customers" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminCustomers /></Suspense></AdminRoute>} />
                  <Route path="/admin/coupons" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminCoupons /></Suspense></AdminRoute>} />
                  <Route path="/admin/offers" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminOffers /></Suspense></AdminRoute>} />
                  <Route path="/admin/carousel" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminCarousel /></Suspense></AdminRoute>} />
                  <Route path="/admin/categories" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminCategories /></Suspense></AdminRoute>} />
                  <Route path="/admin/brands" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminBrands /></Suspense></AdminRoute>} />
                  <Route path="/admin/prescriptions" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminPrescriptions /></Suspense></AdminRoute>} />
                  <Route path="/admin/reviews" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminReviews /></Suspense></AdminRoute>} />
                  <Route path="/admin/settings" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminSettings /></Suspense></AdminRoute>} />

                  {/* ── Public / Customer routes ── */}
                  <Route path="*" element={<PublicRoutes settings={settings} />} />
                </Routes>
                </div>
              </ErrorBoundary>
            </CartProvider>
          </AuthProvider>
        </ConfirmProvider>
      </ReactLenis>
    </Router>
  );
}

export default App;
