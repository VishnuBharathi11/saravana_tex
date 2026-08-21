import { useMemo, useState, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  UserRound,
  Users,
  UsersRound,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { crm, useCrm } from "@/lib/store";
import { customers, employees, followUps, leads, orders } from "@/data/mock";
import { FollowUpDetailDialog } from "@/components/common/followup-detail-dialog";
import { toast } from "sonner";
import type { AppNotification } from "@/types";
import { StatusChip } from "@/components/common/status-chip";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/customers", label: "Customers", icon: UserCheck },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/employees", label: "Employees", icon: UsersRound, adminOnly: true },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-teal font-display text-sm font-bold text-primary-foreground">
        ST
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block truncate font-display text-sm font-bold">Saravana Traders</span>
          <span className="block truncate text-[11px] text-muted-foreground">
            CRM & Sales Suite
          </span>
        </span>
      )}
    </div>
  );
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { isAdmin } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = NAV.filter((n) => !("adminOnly" in n && n.adminOnly) || isAdmin);

  return (
    <nav className="flex flex-col gap-1">
      <p
        className={cn(
          "px-3 pt-2 pb-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase",
          collapsed && "text-center",
        )}
      >
        {!collapsed && "Workspace"}
      </p>
      {items.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        const link = (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              collapsed && "justify-center px-2",
              active
                ? "bg-gradient-to-r from-primary/20 to-mint/40 text-primary shadow-[0_10px_25px_-18px_var(--primary)]"
                : "text-sidebar-foreground hover:bg-mint/30",
            )}
          >
            <item.icon className="size-[18px] shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
        return collapsed ? (
          <Tooltip key={item.to}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ) : (
          link
        );
      })}
    </nav>
  );
}

function GlobalSearch() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const out: { label: string; kind: string; to: string; params?: Record<string, string> }[] = [];
    leads
      .filter((l) => `${l.name} ${l.company}`.toLowerCase().includes(term))
      .slice(0, 3)
      .forEach((l) =>
        out.push({ label: `${l.name} · ${l.company}`, kind: "Lead", to: `/leads/${l.id}` }),
      );
    customers
      .filter((c) => `${c.name} ${c.company}`.toLowerCase().includes(term))
      .slice(0, 3)
      .forEach((c) =>
        out.push({ label: `${c.name} · ${c.company}`, kind: "Customer", to: `/customers/${c.id}` }),
      );
    orders
      .filter((o) =>
        `${o.invoiceNumber} ${o.customerName} ${o.material}`.toLowerCase().includes(term),
      )
      .slice(0, 3)
      .forEach((o) =>
        out.push({ label: `${o.invoiceNumber} · ${o.customerName}`, kind: "Order", to: `/orders/${o.id}` }),
      );
    employees
      .filter((e) => e.name.toLowerCase().includes(term))
      .slice(0, 3)
      .forEach((e) =>
        out.push({ label: `${e.name} · ${e.role}`, kind: "Employee", to: `/employees/${e.id}` }),
      );
    followUps
      .filter((f) => `${f.title} ${f.relatedName}`.toLowerCase().includes(term))
      .slice(0, 2)
      .forEach((f) =>
        out.push({ label: `${f.title} · ${f.relatedName}`, kind: "Follow-up", to: "/calendar" }),
      );
    return out.slice(0, 10);
  }, [q]);

  return (
    <Popover open={results.length > 0}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-md">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search customers, leads, orders, employees…"
            className="glass-soft h-9 border-0 pl-9 text-sm"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(92vw,26rem)] p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {results.map((r) => (
          <button
            key={`${r.kind}-${r.label}`}
            onClick={() => {
              setQ("");
              navigate({ to: r.to });
            }}
            className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-mint/30"
          >
            <span className="truncate">{r.label}</span>
            <StatusChip value={r.kind} className="shrink-0" />
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function NotificationBell() {
  const { notifications, followUps } = useCrm();
  const navigate = useNavigate();
  const [openDetailId, setOpenDetailId] = useState<string | null>(null);

  const unread = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.read) {
      crm.markNotificationAsRead(n.id);
    }

    if (!n.targetId) {
      toast.error("Notification link broken");
      return;
    }

    if (n.type === "FOLLOW_UP") {
      const fu = followUps.find((f) => f.id === n.targetId);
      if (fu) {
        setOpenDetailId(fu.id);
      } else {
        toast.error("Follow-up no longer exists");
      }
      return;
    }

    const routeMap: Record<string, string> = {
      LEAD: "/leads/$id",
      CUSTOMER: "/customers/$id",
      ORDER: "/orders/$id",
      EMPLOYEE: "/employees/$id",
    };

    const route = routeMap[n.type];
    if (route) {
      navigate({ to: route, params: { id: n.targetId } });
    } else {
      toast.error("Invalid notification target");
    }
  };

  const detailFollowUp = followUps.find((f) => f.id === openDetailId) || null;

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="glass-soft relative size-9 rounded-xl border-0"
          >
            <Bell className="size-[18px]" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-coral text-[10px] font-bold text-primary-foreground">
                {unread}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(92vw,22rem)] p-2">
          <p className="px-2 py-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Notifications
          </p>
          <div className="mt-1 space-y-1">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={cn(
                  "block w-full rounded-lg px-3 py-2 text-left transition-colors",
                  !n.read ? "bg-mint/30" : "hover:bg-muted"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{n.title}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{n.timestamp}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.description}</p>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <FollowUpDetailDialog
        detail={detailFollowUp}
        onClose={() => setOpenDetailId(null)}
      />
    </>
  );
}

// Sidebar state persistence via localStorage and useSyncExternalStore
const SIDEBAR_KEY = "saravana_sidebar_collapsed";
const sidebarListeners = new Set<() => void>();

function getSidebarSnapshot() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIDEBAR_KEY) === "true";
}

function subscribeSidebar(cb: () => void) {
  sidebarListeners.add(cb);
  return () => sidebarListeners.delete(cb);
}

function setSidebarState(collapsed: boolean) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  }
  sidebarListeners.forEach((l) => l());
}

export function AppShell({ children, plain = false }: { children: ReactNode; plain?: boolean }) {
  const collapsed = useSyncExternalStore(subscribeSidebar, getSidebarSnapshot, () => false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const sidebarWidth = collapsed ? 76 : 264;

  const initials = (user?.name ?? "ST")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn("flex min-h-screen w-full flex-col lg:flex-row", plain && "bg-white")}>
        <aside
          className={cn(
            "sidebar-glass fixed inset-y-0 left-0 z-40 hidden h-screen shrink-0 flex-col gap-2 border-r border-sidebar-border bg-sidebar p-3 backdrop-blur-xl transition-[width] duration-300 ease-out lg:flex",
          )}
          style={{ width: sidebarWidth }}
        >
          <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
            {!collapsed && <Logo />}
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto size-9 shrink-0 rounded-xl hover:bg-mint/40"
              onClick={() => setSidebarState(!collapsed)}
            >
              {collapsed ? (
                <Menu className="size-[18px]" />
              ) : (
                <ChevronLeft className="size-[18px]" />
              )}
            </Button>
          </div>

          <div className="no-scrollbar mt-2 flex-1 overflow-y-auto">
            <NavList collapsed={collapsed} />
          </div>

          <button
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-coral/15 hover:text-coral",
              collapsed && "justify-center px-2",
            )}
          >
            <LogOut className="size-[18px] shrink-0" />
            {!collapsed && "Logout"}
          </button>
        </aside>

        <div
          className="flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-out"
          style={{
            marginLeft:
              typeof window !== "undefined" && window.innerWidth >= 1024 ? sidebarWidth : 0,
          }}
        >
          <header
            className={cn(
              "fixed top-0 right-0 z-30 grid h-[65px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border/60 px-3 backdrop-blur-xl transition-[left] duration-300 ease-out sm:px-5 lg:left-[var(--sidebar-offset)] max-lg:left-0",
              plain ? "bg-white/85" : "glass-soft",
            )}
            style={{ "--sidebar-offset": `${sidebarWidth}px` } as React.CSSProperties}
          >
            <div className="flex items-center gap-2 lg:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-9 rounded-xl">
                    <Menu className="size-[18px]" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[262px] border-sidebar-border bg-sidebar p-3 backdrop-blur-xl"
                >
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <Logo />
                  <div className="mt-4">
                    <NavList collapsed={false} onNavigate={() => setMobileOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <div className="hidden lg:block" />

            <div className="hidden min-w-0 justify-center sm:flex">
              <GlobalSearch />
            </div>
            <div className="sm:hidden" />

            <div className="flex shrink-0 items-center gap-2">
              <NotificationBell />
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="glass-soft flex items-center gap-2 rounded-xl px-2 py-1.5">
                    <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-primary to-teal text-[11px] font-bold text-primary-foreground">
                      {initials}
                    </span>
                    <span className="hidden text-left sm:block">
                      <span className="block max-w-[120px] truncate text-xs font-semibold">
                        {user?.name}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">{user?.role}</span>
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="max-w-[calc(100vw-24px)] overflow-hidden"
                >
                  <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      navigate({ to: "/" });
                    }}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="page-enter mt-[65px] min-w-0 flex-1 p-3 sm:p-5">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
