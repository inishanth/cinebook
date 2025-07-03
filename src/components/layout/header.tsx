'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, Flame, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Film },
  { href: '/swipe', label: 'Swipe', icon: Flame },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Film className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline text-lg">ReelDeal</span>
          </Link>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'transition-colors hover:text-foreground/80 flex items-center gap-2',
                  isActive ? 'text-foreground' : 'text-foreground/60'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : '')} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
