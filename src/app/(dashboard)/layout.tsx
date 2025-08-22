
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Clock,
  Home,
  LogOut,
  User,
  Bot,
  TestTube2,
  Replace,
  PlusCircle,
  Dumbbell,
  Soup,
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

const menuItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/fasting', label: 'Intermittent Fasting', icon: Clock },
];

const aiMenuItems = [
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
      {menuItems.map((item) => (
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
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
             <div
                className={cn(
                'flex flex-1 flex-col items-center justify-center p-2 rounded-md transition-colors',
                aiMenuItems.some(item => pathname === item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground'
                )}
            >
                <Bot className="size-5" />
                <span className="text-xs mt-1">AI</span>
            </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="center" className="mb-2">
            {aiMenuItems.map(item => (
                 <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex items-center gap-2">
                       <item.icon className="size-4" />
                       <span>{item.label}</span>
                    </Link>
                </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
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

              <DropdownMenu>
                <SidebarMenuItem>
                    <DropdownMenuTrigger asChild>
                       <SidebarMenuButton
                        isActive={['/log-meal', '/log-activity'].includes(pathname)}
                        tooltip="Log Data"
                        className="w-full justify-start"
                        >
                            <PlusCircle className="size-4 text-accent" />
                            <span className="text-accent">Log Data</span>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                </SidebarMenuItem>
                <DropdownMenuContent side="right" align="start" sideOffset={8}>
                    <DropdownMenuLabel>What would you like to log?</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/log-meal" className="flex items-center gap-2">
                            <Soup className="size-4" />
                            <span>Log Meal/Food</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                         <Link href="/log-activity" className="flex items-center gap-2">
                            <Dumbbell className="size-4" />
                            <span>Log Activity/Workout</span>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <SidebarMenuItem>
                    <DropdownMenuTrigger asChild>
                       <SidebarMenuButton
                        isActive={aiMenuItems.some(item => pathname === item.href)}
                        tooltip="AI Tools"
                        className="w-full justify-start"
                        >
                            <Bot className="size-4" />
                            <span>AI</span>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                </SidebarMenuItem>
                <DropdownMenuContent side="right" align="start" sideOffset={8}>
                    {aiMenuItems.map(item => (
                        <DropdownMenuItem key={item.href} asChild>
                            <Link href={item.href} className="flex items-center gap-2">
                                <item.icon className="size-4" />
                                <span>{item.label}</span>
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
