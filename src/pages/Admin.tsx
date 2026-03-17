import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Factory,
  Inbox,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  Settings,
  Sparkles,
  Wallet,
  Warehouse,
} from 'lucide-react';
import { LogoMark } from '../components/primitives';
import { cn } from '../lib/utils';
import { useTailoredStore } from '../store/useTailoredStore';
import {
  AccountingPage,
  AdminDashboardPage,
  AdminLoginPage,
  CataloguePage,
  ConsultationsPage,
  EnquiriesPage,
  InventoryPage,
  ProductionPage,
  SettingsPage,
  VisualiserSessionsPage,
} from './admin/AdminModules';

const adminNav = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Enquiries & CRM', href: '/admin/enquiries', icon: Inbox },
  { label: 'Catalogue CMS', href: '/admin/catalogue', icon: PackageSearch },
  { label: 'Visualiser Sessions', href: '/admin/visualiser-sessions', icon: Sparkles },
  { label: 'Consultations', href: '/admin/consultations', icon: CalendarDays },
  { label: 'Production', href: '/admin/production', icon: Factory },
  { label: 'Inventory', href: '/admin/inventory', icon: Warehouse },
  { label: 'Accounting', href: '/admin/accounting', icon: Wallet },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function Admin() {
  const location = useLocation();
  const navigate = useNavigate();
  const authenticated = useTailoredStore((state) => state.isAdminAuthenticated);
  const logout = useTailoredStore((state) => state.logoutAdmin);
  const teamMembers = useTailoredStore((state) => state.teamMembers);
  const enquiries = useTailoredStore((state) => state.enquiries);
  const consultations = useTailoredStore((state) => state.consultations);
  const productionOrders = useTailoredStore((state) => state.productionOrders);
  const inventoryItems = useTailoredStore((state) => state.inventoryItems);
  const activeMember = teamMembers[0];
  const currentPage = adminNav.find((item) => item.href === location.pathname)?.label || 'Admin';

  const quickStats = [
    { label: 'New leads', value: String(enquiries.filter((item) => item.status === 'New').length) },
    { label: 'Scheduled consults', value: String(consultations.filter((item) => item.status === 'Scheduled').length) },
    { label: 'Active production', value: String(productionOrders.filter((item) => item.status !== 'Delivered').length) },
    { label: 'Reorder alerts', value: String(inventoryItems.filter((item) => item.onHand <= item.reorderPoint).length) },
  ];

  const signOut = () => {
    logout();
    navigate('/admin');
  };

  if (location.pathname === '/admin') {
    return authenticated ? <Navigate to="/admin/dashboard" replace /> : <AdminLoginPage />;
  }

  if (!authenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#f5ede2] text-tm-obsidian">
      <aside className="hidden w-80 shrink-0 flex-col border-r border-black/8 bg-[linear-gradient(180deg,#1c1814_0%,#141110_100%)] px-6 py-8 text-tm-cream xl:flex">
        <LogoMark inverted />
        <p className="mt-6 font-dm text-[0.72rem] uppercase tracking-[0.26em] text-tm-gold">Operations console</p>
        <nav className="mt-10 space-y-2">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-[1.2rem] px-4 py-3 font-dm text-[0.76rem] uppercase tracking-[0.2em] transition',
                  active ? 'bg-tm-gold text-tm-charcoal' : 'text-tm-cream/68 hover:bg-white/6 hover:text-tm-cream',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-[1.6rem] border border-white/10 bg-white/4 p-5">
          <p className="font-cormorant text-3xl tracking-[-0.03em] text-tm-cream">{activeMember.name}</p>
          <p className="mt-2 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-gold">{activeMember.role}</p>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center justify-between rounded-[1.3rem] border border-white/10 bg-white/4 px-4 py-4 font-dm text-[0.72rem] uppercase tracking-[0.22em] text-tm-cream/82 transition hover:border-tm-gold/40 hover:text-tm-cream hover:-translate-y-0.5"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-50 border-b border-black/8 bg-[rgba(245,237,226,0.88)] px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1400px] space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-dm text-[0.72rem] uppercase tracking-[0.28em] text-tm-gold">Tailored Manor admin</p>
                <h1 className="mt-2 font-cormorant text-[2rem] leading-none tracking-[-0.03em] text-tm-obsidian">
                  {currentPage}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden rounded-full border border-black/8 bg-white px-4 py-2 font-dm text-[0.72rem] uppercase tracking-[0.22em] text-tm-warm-gray sm:block">
                  Auto-refreshing live workspace
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex rounded-full border border-black/8 bg-white px-4 py-2 font-dm text-[0.72rem] uppercase tracking-[0.22em] text-tm-warm-gray transition hover:border-tm-gold/40 hover:text-tm-obsidian xl:hidden"
                >
                  Sign out
                </button>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-tm-obsidian font-cormorant text-lg text-tm-cream">
                  {activeMember.initials}
                </div>
              </div>
            </div>

            <nav className="hide-scrollbar -mx-1 flex gap-2 overflow-x-auto pb-1 xl:hidden">
              {adminNav.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 font-dm text-[0.7rem] uppercase tracking-[0.2em] transition',
                      active
                        ? 'border-tm-gold bg-tm-gold text-tm-charcoal'
                        : 'border-black/8 bg-white text-tm-warm-gray hover:border-tm-gold/40 hover:text-tm-obsidian',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-4">
              {quickStats.map((item) => (
                <div key={item.label} className="rounded-[1.3rem] border border-black/8 bg-white/80 px-4 py-3 shadow-[0_14px_36px_rgba(12,12,12,0.04)]">
                  <p className="font-dm text-[0.68rem] uppercase tracking-[0.22em] text-tm-warm-gray">{item.label}</p>
                  <p className="mt-2 font-cormorant text-[2rem] leading-none tracking-[-0.03em] text-tm-obsidian">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/dashboard" element={<AdminDashboardPage />} />
            <Route path="/enquiries" element={<EnquiriesPage />} />
            <Route path="/catalogue" element={<CataloguePage />} />
            <Route path="/visualiser-sessions" element={<VisualiserSessionsPage />} />
            <Route path="/consultations" element={<ConsultationsPage />} />
            <Route path="/production" element={<ProductionPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/accounting" element={<AccountingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
