import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Boxes, BriefcaseBusiness, ChevronLeft, ChevronRight, Command, LayoutDashboard, LogOut, Menu, PackageSearch, Shield, Wallet, X } from 'lucide-react';
import { LogoMark } from '../components/primitives';
import { cn } from '../lib/utils';
import { canAccessWorkspace, type AdminWorkspace } from '../lib/adminAccess';
import { useTailoredStore } from '../store/useTailoredStore';
import type { TeamMember } from '../types';
import { AdminAuthLoadingPage, AdminLoginPage } from './admin/AdminModules';
import { CommandCenterPage } from './admin/workspaces/CommandCenterPage';
import { FinanceWorkspacePage } from './admin/workspaces/FinanceWorkspacePage';
import { JobsWorkspacePage } from './admin/workspaces/JobsWorkspacePage';
import { MaterialsWorkspacePage } from './admin/workspaces/MaterialsWorkspacePage';
import { PipelineWorkspacePage } from './admin/workspaces/PipelineWorkspacePage';
import { ProductsWorkspacePage } from './admin/workspaces/ProductsWorkspacePage';
import { SystemWorkspacePage } from './admin/workspaces/SystemWorkspacePage';

const workspaceGroups: Array<{ label: string; items: Array<{ label: string; href: string; match: string; workspace: AdminWorkspace; icon: typeof LayoutDashboard; description: string }> }> = [
  {
    label: 'Operate',
    items: [
      { label: 'Command Center', href: '/admin/command-center', match: '/admin/command-center', workspace: 'command-center', icon: LayoutDashboard, description: 'Daily summary' },
      { label: 'Pipeline', href: '/admin/pipeline/leads', match: '/admin/pipeline', workspace: 'pipeline', icon: BriefcaseBusiness, description: 'Leads to quotes' },
      { label: 'Jobs', href: '/admin/jobs/board', match: '/admin/jobs', workspace: 'jobs', icon: Boxes, description: 'Production flow' },
      { label: 'Materials', href: '/admin/materials/stock', match: '/admin/materials', workspace: 'materials', icon: PackageSearch, description: 'Stock & PO' },
    ],
  },
  {
    label: 'Grow',
    items: [
      { label: 'Finance', href: '/admin/finance/invoices', match: '/admin/finance', workspace: 'finance', icon: Wallet, description: 'Billing & cash' },
      { label: 'Products', href: '/admin/products/library', match: '/admin/products', workspace: 'products', icon: PackageSearch, description: 'Library & publishing' },
    ],
  },
  {
    label: 'Govern',
    items: [{ label: 'System', href: '/admin/system/team', match: '/admin/system', workspace: 'system', icon: Shield, description: 'Roles & automations' }],
  },
];

function WorkspaceRoute({ workspace, children }: { workspace: AdminWorkspace; children: ReactNode }) {
  const activeAdminId = useTailoredStore((state) => state.activeAdminId);
  const teamMembers = useTailoredStore((state) => state.teamMembers);
  const authUser = useTailoredStore((state) => state.authUser);
  const activeMember =
    teamMembers.find((member) => member.id === activeAdminId) ??
    teamMembers.find((member) => member.uid === authUser?.uid) ??
    teamMembers.find((member) => member.email.toLowerCase() === authUser?.email?.toLowerCase()) ??
    teamMembers[0] ??
    (authUser
      ? {
          id: authUser.uid,
          uid: authUser.uid,
          name: authUser.email || 'Admin',
          role: authUser.role,
          email: authUser.email || '',
          phone: '',
          initials: 'TM',
        }
      : undefined);
  return canAccessWorkspace(workspace, activeMember?.role) ? <>{children}</> : <Navigate to="/admin/command-center" replace />;
}

export default function Admin() {
  const location = useLocation();
  const navigate = useNavigate();
  const authenticated = useTailoredStore((state) => state.isAdminAuthenticated);
  const authReady = useTailoredStore((state) => state.authReady);
  const logout = useTailoredStore((state) => state.logoutAdmin);
  const teamMembers = useTailoredStore((state) => state.teamMembers);
  const activeAdminId = useTailoredStore((state) => state.activeAdminId);
  const notifications = useTailoredStore((state) => state.notifications);
  const authUser = useTailoredStore((state) => state.authUser);
  const activeMember =
    teamMembers.find((member) => member.id === activeAdminId) ??
    teamMembers.find((member) => member.uid === authUser?.uid) ??
    teamMembers.find((member) => member.email.toLowerCase() === authUser?.email?.toLowerCase()) ??
    teamMembers[0] ??
    (authUser
      ? {
          id: authUser.uid,
          uid: authUser.uid,
          name: authUser.email || 'Admin',
          role: authUser.role,
          email: authUser.email || '',
          phone: '',
          initials: 'TM',
        }
      : undefined);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const mainScrollRef = useRef<HTMLElement | null>(null);

  const visibleGroups = workspaceGroups.map((group) => ({ ...group, items: group.items.filter((item) => canAccessWorkspace(item.workspace, activeMember?.role)) })).filter((group) => group.items.length);
  const activeItem = visibleGroups.flatMap((group) => group.items).find((item) => location.pathname.startsWith(item.match));
  const notificationsCount = useMemo(() => {
    const role = activeMember?.role;
    const uid = authUser?.uid;
    if (!role || !uid) return 0;
    return notifications.filter((notification) => notification.targetRoles.includes(role) && !notification.readBy.includes(uid)).length;
  }, [activeMember?.role, authUser?.uid, notifications]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((current) => !current);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setPaletteOpen(false);
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  }, [location.pathname, location.search]);

  const paletteItems = useMemo(() => [
    { label: 'Go to Command Center', href: '/admin/command-center' },
    { label: 'New lead', href: '/admin/pipeline/leads?action=new-lead' },
    { label: 'Book consultation', href: '/admin/pipeline/consultations?action=book-consultation' },
    { label: 'Adjust stock', href: '/admin/materials/stock?action=receive-stock' },
    { label: 'Create purchase order', href: '/admin/materials/purchase-orders?action=create-po' },
    { label: 'Record payment', href: '/admin/finance/deposits?action=record-payment' },
    { label: 'Open product library', href: '/admin/products/library' },
  ], []);

  if (!authReady) return <AdminAuthLoadingPage />;
  if (location.pathname === '/admin') return authenticated ? <Navigate to="/admin/command-center" replace /> : <AdminLoginPage />;
  if (!authenticated) return <Navigate to="/admin" replace />;

  return (
    <div className="h-full bg-[radial-gradient(circle_at_top,#f7f1e8_0%,#efe7db_42%,#ece2d4_100%)] p-3 text-tm-obsidian sm:p-4">
      <div className="flex h-full gap-3 overflow-hidden sm:gap-4">
        <SidebarContent visibleGroups={visibleGroups} activePath={location.pathname} collapsed={collapsed} onNavigate={() => setMobileOpen(false)} onSignOut={() => { logout(); navigate('/admin'); }} activeMember={activeMember} className={cn('hidden lg:flex', collapsed ? 'w-[76px]' : 'w-[278px]')} />
        <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)}>
          <SidebarContent visibleGroups={visibleGroups} activePath={location.pathname} collapsed={false} onNavigate={() => setMobileOpen(false)} onSignOut={() => { logout(); navigate('/admin'); }} activeMember={activeMember} className="w-full" />
        </MobileSidebar>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[2.05rem] border border-black/5 bg-[rgba(251,248,243,0.94)] shadow-[0_16px_38px_rgba(28,24,20,0.055)] backdrop-blur-xl">
          <header className="shrink-0 border-b border-black/7 bg-[rgba(250,247,242,0.82)] backdrop-blur-xl">
            <div className="flex h-14 items-center gap-2.5 px-4 sm:h-16 sm:gap-3 sm:px-6 lg:px-8">
              <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="inline-flex h-10 w-10 items-center justify-center rounded-[1rem] border border-black/7 bg-white/92 text-tm-charcoal shadow-[0_6px_16px_rgba(12,12,12,0.04)] transition duration-200 ease-out hover:border-black/12 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tm-gold/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f2ea] lg:hidden"><Menu className="h-4 w-4" /></button>
              <button type="button" onClick={() => setCollapsed((current) => !current)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed} className="hidden h-10 w-10 items-center justify-center rounded-[1rem] border border-black/7 bg-white/92 text-tm-charcoal shadow-[0_6px_16px_rgba(12,12,12,0.04)] transition duration-200 ease-out hover:border-black/12 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tm-gold/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f2ea] lg:inline-flex">{collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button>
              <div className="min-w-0">
                <p className="text-[0.62rem] uppercase tracking-[0.24em] text-tm-warm-gray">Tailored Manor Admin</p>
                <p className="truncate text-[0.92rem] font-semibold tracking-[-0.01em] text-tm-charcoal">{activeItem?.label ?? 'Workspace'}</p>
              </div>
              <button type="button" onClick={() => setPaletteOpen(true)} className="ml-auto hidden min-w-[320px] max-w-[460px] flex-1 items-center justify-between rounded-[1.1rem] border border-black/7 bg-white/90 px-4 py-3 text-left text-[0.82rem] text-tm-warm-gray shadow-[0_8px_18px_rgba(12,12,12,0.04)] transition duration-200 ease-out hover:border-black/12 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tm-gold/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f2ea] md:flex"><span className="truncate">Search pages, actions, or records</span><span className="ml-3 inline-flex shrink-0 items-center gap-1 rounded-full border border-black/8 bg-[#fcfaf7] px-2 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-tm-warm-gray"><Command className="h-3 w-3" />K</span></button>
              <button type="button" onClick={() => setPaletteOpen(true)} aria-label="Open command search" className="inline-flex h-10 w-10 items-center justify-center rounded-[1rem] border border-black/7 bg-white/92 text-tm-charcoal shadow-[0_6px_16px_rgba(12,12,12,0.04)] transition duration-200 ease-out hover:border-black/12 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tm-gold/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f2ea] md:hidden"><Command className="h-4 w-4" /></button>
              <div className="inline-flex min-w-[3.1rem] items-center justify-center gap-1.5 rounded-[1rem] border border-black/7 bg-white/90 px-3 py-2 text-[0.64rem] font-medium uppercase tracking-[0.18em] text-tm-warm-gray shadow-[0_6px_16px_rgba(12,12,12,0.035)]"><Bell className="h-3.5 w-3.5 text-tm-gold" />{notificationsCount}</div>
              <div className="hidden items-center gap-3 rounded-[1rem] border border-black/7 bg-white/90 px-2.5 py-2 shadow-[0_6px_16px_rgba(12,12,12,0.035)] sm:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-tm-charcoal text-xs font-semibold uppercase tracking-[0.16em] text-tm-cream">{activeMember?.initials ?? 'TM'}</div>
                <div className="pr-2"><p className="text-[0.84rem] font-semibold leading-none text-tm-charcoal">{activeMember?.name ?? 'Admin'}</p><p className="mt-1 text-[0.6rem] uppercase tracking-[0.22em] text-tm-warm-gray">{activeMember?.role ?? 'Admin'}</p></div>
              </div>
            </div>
          </header>

          <main ref={mainScrollRef} className="flex-1 overflow-y-auto overscroll-contain">
            <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <Routes>
                <Route path="/dashboard" element={<Navigate to="/admin/command-center" replace />} />
                <Route path="/enquiries" element={<Navigate to="/admin/pipeline/leads" replace />} />
                <Route path="/visualiser-sessions" element={<Navigate to="/admin/pipeline/sessions" replace />} />
                <Route path="/consultations" element={<Navigate to="/admin/pipeline/consultations" replace />} />
                <Route path="/production" element={<Navigate to="/admin/jobs/board" replace />} />
                <Route path="/inventory" element={<Navigate to="/admin/materials/stock" replace />} />
                <Route path="/accounting" element={<Navigate to="/admin/finance/invoices" replace />} />
                <Route path="/catalogue" element={<Navigate to="/admin/products/library" replace />} />
                <Route path="/settings" element={<Navigate to="/admin/system/team" replace />} />
                <Route path="/command-center" element={<WorkspaceRoute workspace="command-center"><CommandCenterPage /></WorkspaceRoute>} />
                <Route path="/pipeline/:tab?" element={<WorkspaceRoute workspace="pipeline"><PipelineWorkspacePage /></WorkspaceRoute>} />
                <Route path="/jobs/:tab?" element={<WorkspaceRoute workspace="jobs"><JobsWorkspacePage /></WorkspaceRoute>} />
                <Route path="/materials/:tab?" element={<WorkspaceRoute workspace="materials"><MaterialsWorkspacePage /></WorkspaceRoute>} />
                <Route path="/finance/:tab?" element={<WorkspaceRoute workspace="finance"><FinanceWorkspacePage /></WorkspaceRoute>} />
                <Route path="/products/:tab?" element={<WorkspaceRoute workspace="products"><ProductsWorkspacePage /></WorkspaceRoute>} />
                <Route path="/system/:tab?" element={<WorkspaceRoute workspace="system"><SystemWorkspacePage /></WorkspaceRoute>} />
                <Route path="*" element={<Navigate to="/admin/command-center" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
      {paletteOpen ? <CommandPalette items={paletteItems} onClose={() => setPaletteOpen(false)} onNavigate={(href) => { navigate(href); setPaletteOpen(false); }} /> : null}
    </div>
  );
}

function SidebarContent({ visibleGroups, activePath, collapsed, onNavigate, onSignOut, activeMember, className }: { visibleGroups: typeof workspaceGroups; activePath: string; collapsed: boolean; onNavigate: () => void; onSignOut: () => void; activeMember?: TeamMember; className?: string }) {
  return (
    <aside className={cn('relative h-full shrink-0 flex-col overflow-hidden rounded-[1.9rem] border border-[#2a241d] bg-[linear-gradient(180deg,#16130f_0%,#13100d_54%,#0f0c09_100%)] px-3 py-4 text-tm-cream shadow-[0_14px_30px_rgba(10,8,6,0.14)] transition-[width] duration-200 ease-out', className)}>
      <div className="flex h-full flex-col">
        <div className={cn('rounded-[1.25rem]', collapsed ? 'flex justify-center px-1 py-2' : 'border border-white/5 bg-white/[0.02] px-3 py-3')}>
          {collapsed ? (
            <LogoMark inverted compact size={34} />
          ) : (
            <div className="flex items-center gap-3">
              <LogoMark inverted compact size={36} />
              <div className="min-w-0">
                <p className="font-cormorant text-[1rem] uppercase tracking-[0.24em] text-tm-cream">Tailored Manor</p>
                <p className="mt-1 text-[0.69rem] leading-5 text-tm-gold/84">Your Space Masterfully Tailored</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex min-h-0 flex-1 flex-col">
          {!collapsed ? (
            <div className="px-2">
              <p className="text-[0.56rem] font-medium uppercase tracking-[0.28em] text-tm-gold/64">Workspace Navigation</p>
              <p className="mt-1 text-[0.7rem] leading-5 text-tm-cream/50">Move between operating areas without leaving the admin flow.</p>
            </div>
          ) : null}

          <div className="relative mt-4 min-h-0 flex-1 border-y border-white/5 py-2">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-5 bg-gradient-to-b from-[#14110d] to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-6 bg-gradient-to-t from-[#100d0a] to-transparent" />

            <div className="tm-sidebar-scroll h-full overflow-y-auto pr-1">
              <div className="space-y-6 pb-4 pt-1">
                {visibleGroups.map((group) => (
                  <div key={group.label}>
                    {!collapsed ? <p className="px-2 text-[0.56rem] font-medium uppercase tracking-[0.28em] text-tm-gold/52">{group.label}</p> : null}
                    <nav className="mt-2 space-y-1.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = activePath.startsWith(item.match);
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={onNavigate}
                            aria-label={item.label}
                            title={collapsed ? item.label : undefined}
                            className={cn(
                              'group flex items-center gap-3 rounded-[1rem] border px-3 py-2.5 transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tm-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#15120f]',
                              collapsed ? 'mx-auto h-11 w-11 justify-center px-0' : '',
                              active
                                ? 'border-white/8 bg-white/[0.05] text-tm-cream shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]'
                                : 'border-transparent text-tm-cream/74 hover:border-white/6 hover:bg-white/[0.03] hover:text-tm-cream',
                            )}
                          >
                            {!collapsed ? <span className={cn('h-8 w-[1.5px] rounded-full transition', active ? 'bg-tm-gold' : 'bg-transparent group-hover:bg-white/16')} /> : null}
                            <Icon className={cn('shrink-0', collapsed ? 'h-[1.05rem] w-[1.05rem]' : 'h-[0.95rem] w-[0.95rem]', active ? 'text-tm-gold' : 'text-tm-cream/78 group-hover:text-tm-cream')} />
                            {!collapsed ? (
                              <div className="min-w-0">
                                <p className="text-[0.72rem] font-medium uppercase tracking-[0.15em] text-inherit">{item.label}</p>
                                <p className={cn('mt-0.5 text-[0.67rem] leading-5', active ? 'text-tm-cream/60' : 'text-tm-cream/44 group-hover:text-tm-cream/58')}>
                                  {item.description}
                                </p>
                              </div>
                            ) : null}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={cn('mt-4 rounded-[1.25rem] border border-white/6 bg-white/[0.03] p-3.5', collapsed && 'p-2.5')}>
            {!collapsed ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-tm-cream">{activeMember?.initials ?? 'TM'}</div>
                  <div className="min-w-0">
                    <p className="truncate font-cormorant text-[1.08rem] leading-none tracking-[-0.02em] text-tm-cream">{activeMember?.name ?? 'Admin'}</p>
                    <p className="mt-1 text-[0.58rem] font-medium uppercase tracking-[0.24em] text-tm-gold/74">{activeMember?.role ?? 'Admin'}</p>
                  </div>
                </div>
              </>
            ) : null}
            <button type="button" onClick={onSignOut} aria-label="Sign out" title={collapsed ? 'Sign out' : undefined} className={cn('mt-3 inline-flex items-center justify-center gap-2 rounded-[1rem] border border-white/8 bg-white/[0.03] text-[0.66rem] font-medium uppercase tracking-[0.18em] text-tm-cream/82 transition duration-200 ease-out hover:border-white/14 hover:bg-white/[0.06] hover:text-tm-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tm-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#15120f]', collapsed ? 'h-11 w-full' : 'min-h-11 w-full px-4 py-3')}><LogOut className="h-4 w-4" />{collapsed ? <span className="sr-only">Sign out</span> : 'Sign out'}</button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MobileSidebar({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <div className={cn('fixed inset-0 z-50 bg-[rgba(12,12,12,0.42)] backdrop-blur-[3px] transition duration-200 ease-out lg:hidden', open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0')} onClick={onClose}>
      <div className={cn('h-full w-[min(368px,82vw)] overflow-hidden rounded-r-[1.8rem] border-r border-[#2a231c] shadow-[0_24px_54px_rgba(0,0,0,0.28)] transition duration-200 ease-out', open ? 'translate-x-0' : '-translate-x-full')} onClick={(event) => event.stopPropagation()}>
        <div className="flex justify-end px-3 pt-3"><button type="button" onClick={onClose} aria-label="Close navigation" className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/10 bg-black/28 text-tm-cream transition duration-200 ease-out hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tm-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#15120f]"><X className="h-4 w-4" /></button></div>
        {children}
      </div>
    </div>
  );
}

function CommandPalette({ items, onClose, onNavigate }: { items: Array<{ label: string; href: string }>; onClose: () => void; onNavigate: (href: string) => void }) {
  const [query, setQuery] = useState('');
  const filtered = items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-[rgba(12,12,12,0.48)] px-4 py-[10vh]" onClick={onClose}>
      <div className="w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-black/8 bg-[#faf7f2] shadow-[0_30px_90px_rgba(0,0,0,0.28)]" onClick={(event) => event.stopPropagation()}>
        <div className="border-b border-black/7 px-5 py-4"><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search actions or workspaces" className="w-full border-none bg-transparent text-base outline-none" /></div>
        <div className="max-h-[60vh] overflow-y-auto p-3">{filtered.map((item) => <button key={item.href} type="button" onClick={() => onNavigate(item.href)} className="flex w-full items-center justify-between rounded-[1rem] px-4 py-4 text-left transition hover:bg-white"><span className="text-sm font-medium text-tm-charcoal">{item.label}</span><ChevronRight className="h-4 w-4 text-tm-warm-gray" /></button>)}</div>
      </div>
    </div>
  );
}
