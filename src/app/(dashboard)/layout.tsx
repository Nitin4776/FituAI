
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Clock,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Replace,
  TestTube2,
  User,
  Utensils,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons/logo';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/profile', label: 'Profile & Goal', icon: User },
  { href: '/activity', label: 'Activity Tracker', icon: HeartPulse },
  { href: '/meals', label: 'Meal Planner', icon: Utensils },
  { href: '/fasting', label: 'Intermittent Fasting', icon: Clock },
  { href: '/healthy-swaps', label: 'Healthy Swaps', icon: Replace },
  { href: '/blood-test', label: 'Blood Test Analysis', icon: TestTube2 },
];

function BottomNavigation() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  if (!isMobile) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around bg-background border-t p-2">
      {menuItems.slice(0, 5).map((item) => (
        <Link href={item.href} key={item.href} className="flex-1">
          <div
            className={cn(
              'flex flex-col items-center justify-center p-2 rounded-md transition-colors',
              pathname === item.href
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground'
            )}
          >
            <item.icon className="size-5" />
            <span className="text-xs mt-1">{item.label}</span>
          </div>
        </Link>
      ))}
    </nav>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <Logo />
              <SidebarTrigger className="ml-auto" />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      tooltip={item.label}
                      className="w-full justify-start"
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <Button variant="ghost" className="justify-start gap-2" onClick={signOut}>
                <LogOut className="size-4" />
                <span>Sign Out</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
            {children}
          </main>
          <BottomNavigation />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
