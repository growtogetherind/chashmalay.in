import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute, AdminRoute } from './components/ui/ProtectedRoute';
import ErrorBoundary from './components/ui/ErrorBoundary';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import Footer from './components/layout/Footer';
import Loader from './components/ui/Loader';
import { ReactLenis } from '@studio-freight/react-lenis';
import './index.css';

// ─── Lazy-load all route-level pages ─────────────────────────────────────────
const Home         = lazy(() => import('./pages/Home'));
const Auth         = lazy(() => import('./pages/Auth'));
const Cart         = lazy(() => import('./pages/Cart'));
const Category     = lazy(() => import('./pages/Category'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout     = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const Account      = lazy(() => import('./pages/Account'));
const OrderDetail  = lazy(() => import('./pages/OrderDetail'));
const Offers       = lazy(() => import('./pages/Offers'));
const FindStore    = lazy(() => import('./pages/FindStore'));
const NotFound     = lazy(() => import('./pages/NotFound'));

const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const AdminProducts  = lazy(() => import('./pages/Admin/Products'));
const AdminInventory = lazy(() => import('./pages/Admin/Inventory'));
const AdminOrders    = lazy(() => import('./pages/Admin/Orders'));
const AdminCustomers = lazy(() => import('./pages/Admin/Customers'));
const AdminCoupons   = lazy(() => import('./pages/Admin/Coupons'));
const AdminOffers    = lazy(() => import('./pages/Admin/Offers'));
const AdminCarousel  = lazy(() => import('./pages/Admin/Carousel'));

// ─── Page-level Suspense fallback ─────────────────────────────────────────────
const PageLoader = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: '40px', height: '40px', border: '4px solid #1e3f8a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

function App() {
  const [isLoading, setIsLoading] = useState(true);

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
        <AuthProvider>
          <CartProvider>
            <ErrorBoundary>
              <div className="app-container">
                {isLoading && <Loader onLoadingComplete={() => setIsLoading(false)} />}

                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: '#161616',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      borderRadius: '999px',
                      padding: '0.75rem 1.25rem',
                      border: '1px solid rgba(255,255,255,0.1)'
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

                  {/* ── Public / Customer routes ── */}
                  <Route path="*" element={
                    <>
                      <Navbar />
                      <main className="main-content">
                        <ErrorBoundary>
                          <Suspense fallback={<PageLoader />}>
                            <Routes>
                              <Route path="/"                         element={<Home />} />
                              <Route path="/auth"                     element={<Auth />} />
                              <Route path="/cart"                     element={<Cart />} />
                              <Route path="/category/:name"           element={<Category />} />
                              <Route path="/offers"                   element={<Offers />} />
                              <Route path="/product/:id"              element={<ProductDetail />} />
                              <Route path="/find-store"               element={<FindStore />} />
                              <Route path="/checkout"                 element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                              <Route path="/order-success/:orderId"   element={<OrderSuccess />} />
                              <Route path="/account"                  element={<ProtectedRoute><Account /></ProtectedRoute>} />
                              <Route path="/account/orders"           element={<ProtectedRoute><Account /></ProtectedRoute>} />
                              <Route path="/account/orders/:orderId"  element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                              <Route path="*"                         element={<NotFound />} />
                            </Routes>
                          </Suspense>
                        </ErrorBoundary>
                      </main>
                      <Footer />
                      <BottomNav />
                    </>
                  } />
                </Routes>
              </div>
            </ErrorBoundary>
          </CartProvider>
        </AuthProvider>
      </ReactLenis>
    </Router>
  );
}

export default App;
