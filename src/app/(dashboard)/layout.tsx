
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Clock,
  Home,
  LogOut,
  Target,
  Bot,
  TestTube2,
  Replace,
  PlusCircle,
  Dumbbell,
  Soup,
  ClipboardCheck,
  Sparkles,
  Scan,
  GlassWater,
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
  { href: '/goal', label: 'Goal', icon: Target },
  { href: '/fasting', label: 'Fasting Calc.', icon: Clock },
];

const aiMenuItems = [
    { href: '/ai-body-scan', label: 'AI Body Scan', icon: Scan },
    { href: '/ai-meal-plan', label: 'AI Meal Plan', icon: ClipboardCheck },
    { href: '/blood-test', label: 'Blood Test Analysis', icon: TestTube2 },
    { href: '/healthy-swaps', label: 'Healthy Swaps', icon: Replace },
];


function BottomNavigation() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  if (!isMobile) {
    return null;
  }
  
  const bottomNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/goal', label: 'Goal', icon: Target },
    { type: 'log' },
    { href: '/fasting', label: 'Fasting Calc.', icon: Clock },
    { type: 'ai' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around bg-background border-t p-2">
      {bottomNavItems.map((navItem, index) => {
        if (navItem.type === 'log') {
          return (
             <DropdownMenu key="log-menu">
                <DropdownMenuTrigger asChild>
                  <div
                    className={cn(
                      'flex flex-1 flex-col items-center justify-center p-2 rounded-md transition-colors',
                      ['/log-meal', '/log-activity', '/log-water'].includes(pathname)
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    <PlusCircle className="size-5" />
                    <span className="text-xs mt-1">Log</span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="center" className="mb-2">
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
                     <DropdownMenuItem asChild>
                        <Link href="/log-water" className="flex items-center gap-2">
                            <GlassWater className="size-4" />
                            <span>Log Water Intake</span>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          )
        }
        if (navItem.type === 'ai') {
            return (
                 <DropdownMenu key="ai-menu">
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
                        <DropdownMenuLabel className="flex items-center gap-2">
                            <Sparkles className="size-4 text-yellow-500" />
                            AI Tools
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {aiMenuItems.map(item => (
                            <DropdownMenuItem key={item.href} asChild>
                                <Link href={item.href} className="flex items-center gap-2">
                                <item.icon className="size-4 text-primary" />
                                <span>{item.label}</span>
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }

        const item = navItem as { href: string; label: string; icon: React.ElementType };
        return (
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
        )
      })}
    </nav>
  );
}


function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
      <div className="relative flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <Logo />
              <SidebarTrigger className="ml-auto" />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                  <Link href="/">
                      <SidebarMenuButton
                      isActive={pathname === '/'}
                      tooltip="Home"
                      className="w-full justify-start"
                      >
                      <Home className="size-4" />
                      <span>Home</span>
                      </SidebarMenuButton>
                  </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <Link href="/goal">
                      <SidebarMenuButton
                      isActive={pathname === '/goal'}
                      tooltip="Goal"
                      className="w-full justify-start"
                      >
                      <Target className="size-4" />
                      <span>Goal</span>
                      </SidebarMenuButton>
                  </Link>
              </SidebarMenuItem>

              <DropdownMenu>
                <SidebarMenuItem>
                    <DropdownMenuTrigger asChild>
                       <SidebarMenuButton
                        isActive={['/log-meal', '/log-activity', '/log-water'].includes(pathname)}
                        tooltip="Log Data"
                        className="w-full justify-start"
                        >
                            <PlusCircle className="size-4" />
                            <span>Log</span>
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
                    <DropdownMenuItem asChild>
                        <Link href="/log-water" className="flex items-center gap-2">
                            <GlassWater className="size-4" />
                            <span>Log Water Intake</span>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

               <SidebarMenuItem>
                  <Link href="/fasting">
                      <SidebarMenuButton
                      isActive={pathname === '/fasting'}
                      tooltip="Fasting Calc."
                      className="w-full justify-start"
                      >
                      <Clock className="size-4" />
                      <span>Fasting Calc.</span>
                      </SidebarMenuButton>
                  </Link>
              </SidebarMenuItem>

              <DropdownMenu>
                <SidebarMenuItem>
                    <DropdownMenuTrigger asChild>
                       <SidebarMenuButton
                        isActive={aiMenuItems.some(item => pathname === item.href)}
                        tooltip="AI Tools"
                        className="w-full justify-start"
                        >
                            <Bot className="size-4" />
                            <span className='flex items-center gap-2'>
                                AI 
                                <Sparkles className="size-4 text-yellow-500"/>
                            </span>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                </SidebarMenuItem>
                <DropdownMenuContent side="right" align="start" sideOffset={8}>
                    <DropdownMenuLabel className="flex items-center gap-2">
                        <Sparkles className="size-4 text-yellow-500" />
                        AI Tools
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {aiMenuItems.map(item => (
                        <DropdownMenuItem key={item.href} asChild>
                            <Link href={item.href} className="flex items-center gap-2">
                                <item.icon className="size-4 text-primary" />
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
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-0">
            {children}
          </main>
          <BottomNavigation />
        </SidebarInset>
      </div>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </SidebarProvider>
    )
}
