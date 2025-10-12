import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuAction,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}

function AppSidebar() {
  const [pathname, setPathname] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/',
  );

  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const isActive = (p: string) => pathname === p;
  const [openUsers, setOpenUsers] = useState(pathname.startsWith('/users'));
  const [openEmployees, setOpenEmployees] = useState(
    pathname.startsWith('/employees'),
  );
  const [openSettings, setOpenSettings] = useState(
    pathname.startsWith('/settings'),
  );
  useEffect(() => {
    if (pathname.startsWith('/users')) setOpenUsers(true);
    if (pathname.startsWith('/employees')) setOpenEmployees(true);
    if (pathname.startsWith('/settings')) setOpenSettings(true);
  }, [pathname]);

  const { t } = useI18n();
  const role =
    typeof window !== 'undefined' ? localStorage.getItem('auth.role') : null;
  const isAdmin = role === 'superadmin';

  return (
    <Sidebar
      className="bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]"
      collapsible="icon"
    >
      <SidebarHeader className="px-4 py-3">
        <div className="flex items-center justify-center">
          <Link to="/" className="select-none">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Fbd65b3cd7a86452e803a3d7dc7a3d048%2F88c65af5aa594e4eb74b03e70886ef92?format=webp&width=1200"
              alt="ACES Managed Services"
              className="h-auto w-[140px] mx-auto drop-shadow-[0_0_10px_rgba(255,255,255,0.18)]"
              loading="eager"
              decoding="async"
            />
          </Link>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/')}
                  className={cn(
                    'hover:bg-[#002b59]',
                    isActive('/') && 'border-l-4 border-[#E30613]',
                  )}
                >
                  <Link to="/" className="flex items-center">
                    <span className="font-bold text-white">
                      {t('dashboard')}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/users')}
                    className={cn(
                      'hover:bg-[#002b59]',
                      isActive('/users') && 'border-l-4 border-[#E30613]',
                    )}
                  >
                    <Link to="/users" className="flex items-center">
                      <span className="font-bold text-white">
                        {t('usersAuth')}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/missions')}
                  className={cn(
                    'hover:bg-[#002b59]',
                    isActive('/missions') && 'border-l-4 border-[#E30613]',
                  )}
                >
                  <Link to="/missions" className="flex items-center">
                    <span className="font-bold text-white">
                      {t('missions')}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/employees')}
                  className={cn(
                    'hover:bg-[#002b59]',
                    isActive('/employees') && 'border-l-4 border-[#E30613]',
                  )}
                >
                  <Link to="/employees" className="flex items-center">
                    <span className="font-bold text-white">
                      {t('employees')}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/sites')}
                  className={cn(
                    'hover:bg-[#002b59]',
                    isActive('/sites') && 'border-l-4 border-[#E30613]',
                  )}
                >
                  <Link to="/sites" className="flex items-center">
                    <span className="font-bold text-white">{t('sites')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/reports')}
                  className={cn(
                    'hover:bg-[#002b59]',
                    isActive('/reports') && 'border-l-4 border-[#E30613]',
                  )}
                >
                  <Link to="/reports" className="flex items-center">
                    <span className="font-bold text-white">{t('reports')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/notifications')}
                  className={cn(
                    'hover:bg-[#002b59]',
                    isActive('/notifications') && 'border-l-4 border-[#E30613]',
                  )}
                >
                  <Link to="/notifications" className="flex items-center">
                    <span className="font-bold text-white">
                      {t('notifications')}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/settings')}
                  className={cn(
                    'hover:bg-[#002b59]',
                    isActive('/settings') && 'border-l-4 border-[#E30613]',
                  )}
                >
                  <Link to="/settings" className="flex items-center">
                    <span className="font-bold text-white">
                      {t('settings')}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
