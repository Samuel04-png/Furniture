import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import GlobalFloatingUI from './components/GlobalFloatingUI';
import { useTailoredStore } from './store/useTailoredStore';
import { initAnalytics } from './lib/firebase';
import { cn } from './lib/utils';

const Home = lazy(() => import('./pages/Home'));
const Collections = lazy(() => import('./pages/Collections'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Visualiser = lazy(() => import('./pages/Visualiser'));
const Configurator = lazy(() => import('./pages/Configurator'));
const Admin = lazy(() => import('./pages/Admin'));
const BookConsultation = lazy(() => import('./pages/BookConsultation'));
const Materials = lazy(() => import('./pages/Materials'));
const MaterialDetail = lazy(() => import('./pages/MaterialDetail'));
const TheProcess = lazy(() => import('./pages/TheProcess'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const PortfolioDetail = lazy(() => import('./pages/PortfolioDetail'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

function AppShell() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const loadProducts = useTailoredStore((state) => state.loadProducts);
  const initAuth = useTailoredStore((state) => state.initAuth);
  const authReady = useTailoredStore((state) => state.authReady);
  const isAdminAuthenticated = useTailoredStore((state) => state.isAdminAuthenticated);
  const isAdminLocked = isAdminRoute && authReady && isAdminAuthenticated;

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    void initAnalytics();
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    html.classList.toggle('tm-admin-lock', isAdminLocked);
    body.classList.toggle('tm-admin-lock', isAdminLocked);
    root?.classList.toggle('tm-admin-lock', isAdminLocked);

    return () => {
      html.classList.remove('tm-admin-lock');
      body.classList.remove('tm-admin-lock');
      root?.classList.remove('tm-admin-lock');
    };
  }, [isAdminLocked]);

  return (
    <div
      className={cn(
        isAdminLocked ? 'h-screen overflow-hidden bg-[#ece3d6] text-tm-obsidian' : 'min-h-screen bg-tm-off-white text-tm-obsidian',
      )}
    >
      <ScrollToTop />
      {!isAdminRoute && <Navbar />}
      <main className={cn(isAdminLocked && 'h-full overflow-hidden')}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/collections/:slug" element={<ProductDetail />} />
            <Route path="/visualise" element={<Visualiser />} />
            <Route path="/visualise/canvas" element={<Visualiser />} />
            <Route path="/visualise/submit" element={<Visualiser />} />
            <Route path="/configure" element={<Configurator />} />
            <Route path="/configure/step-2" element={<Configurator />} />
            <Route path="/configure/step-3" element={<Configurator />} />
            <Route path="/configure/step-4" element={<Configurator />} />
            <Route path="/configure/confirmation" element={<Configurator />} />
            <Route path="/book-consultation" element={<BookConsultation />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/materials/:slug" element={<MaterialDetail />} />
            <Route path="/the-process" element={<TheProcess />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/portfolio/:slug" element={<PortfolioDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <GlobalFloatingUI />}
    </div>
  );
}

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-tm-off-white px-4 py-24">
      <div className="border border-black/12 bg-tm-off-white px-8 py-6 font-dm text-[13px] uppercase tracking-[0.14em] text-tm-warm-gray">
        Loading Tailored Manor...
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}
