import { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ui/ProtectedRoute';
import ErrorBoundary from './components/ui/ErrorBoundary';
import Navbar from './components/layout/Navbar.jsx';
import BottomNav from './components/layout/BottomNav.jsx';
import Footer from './components/layout/Footer.jsx';
import Loader from './components/ui/Loader.jsx';
import ScrollToTop from './components/ui/ScrollToTop.jsx';
import { ReactLenis } from '@studio-freight/react-lenis';
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
const FindStore    = lazy(() => import('./pages/FindStore.jsx'));
const NotFound     = lazy(() => import('./pages/NotFound.jsx'));

const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard.jsx'));
const AdminProducts  = lazy(() => import('./pages/Admin/Products.jsx'));
const AdminInventory = lazy(() => import('./pages/Admin/Inventory.jsx'));
const AdminOrders    = lazy(() => import('./pages/Admin/Orders.jsx'));
const AdminCustomers = lazy(() => import('./pages/Admin/Customers.jsx'));
const AdminCoupons   = lazy(() => import('./pages/Admin/Coupons.jsx'));
const AdminOffers    = lazy(() => import('./pages/Admin/Offers.jsx'));
const AdminCarousel  = lazy(() => import('./pages/Admin/Carousel.jsx'));

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
          <ScrollToTop />
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
        </AuthProvider>
      </ReactLenis>
    </Router>
  );
}

export default App;
