import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Bookmark, User, Layout, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import useTabStacks from '@/hooks/useTabStacks';

const navItems = [
  { path: '/', icon: Home, label: 'Feed' },
  { path: '/find-dupes', icon: Search, label: 'Find Dupes' },
  { path: '/saved', icon: Bookmark, label: 'Saved' },
  { path: '/styleboards', icon: Layout, label: 'Styleboards' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const ROOT_PATHS = new Set(navItems.map((n) => n.path));

function isChildRoute(pathname) {
  return !ROOT_PATHS.has(pathname);
}

function getParentLabel(pathname) {
  const match = navItems.find((n) => n.path !== '/' && pathname.startsWith(n.path));
  return match?.label ?? null;
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { navigateToTab } = useTabStacks();

  const isChild = isChildRoute(location.pathname);
  const parentLabel = getParentLabel(location.pathname);

  const activeTab = isChild
    ? (navItems.find((n) => n.path !== '/' && location.pathname.startsWith(n.path))?.path ?? null)
    : location.pathname;

  return (
    <div className="h-[100dvh] overflow-hidden bg-background font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r border-border bg-card z-40"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
        }}
      >
        <div className="p-8">
          <h1 className="font-serif text-2xl font-semibold tracking-tight italic text-foreground">
            déjà
          </h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-widest uppercase">Curated to your taste</p>
        </div>
        <nav aria-label="Desktop navigation" className="flex-1 px-4 space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = activeTab === path || (path === '/' && location.pathname === '/');
            return (
              <button
                key={path}
                onClick={() => navigateToTab(path)}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 select-none min-h-[44px]",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </nav>
        <div className="p-6 border-t border-border">
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Curated by AI</p>
        </div>
      </aside>

      {/* Mobile persistent header for child routes */}
      {isChild && (
        <header
          className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border flex items-center px-2"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
            height: 'calc(3.5rem + env(safe-area-inset-top))',
          }}
        >
          <button
            aria-label={parentLabel ? `Back to ${parentLabel}` : 'Go back'}
            onClick={() => navigate(-1)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <span className="ml-1 text-sm font-medium text-foreground">
            {parentLabel ?? 'Back'}
          </span>
        </header>
      )}

      {/* Main content */}
      <main
        className={cn(
          "lg:ml-64 absolute inset-0 overflow-y-auto overscroll-none",
          isChild
            ? "pt-[calc(3.5rem+env(safe-area-inset-top))] lg:pt-0"
            : "pt-[env(safe-area-inset-top)] lg:pt-0"
        )}
        style={{
          paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
        aria-label="Main content"
      >
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div
          className="flex justify-around items-center"
          style={{
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
          }}
        >
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = activeTab === path;
            return (
              <button
                key={path}
                onClick={() => navigateToTab(path)}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] flex-1 py-2 rounded-lg transition-all select-none",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "text-accent")} aria-hidden="true" />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
