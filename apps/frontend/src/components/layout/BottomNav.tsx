'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/app/today', label: 'Сегодня', icon: '📊' },
  { href: '/app/menu', label: 'Меню', icon: '🍽️' },
  { href: '/app/log/add/photo', label: '+', icon: '📸', isCenter: true },
  { href: '/app/stats', label: 'Графики', icon: '📈' },
  { href: '/app/profile', label: 'Профиль', icon: '👤' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-safe">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors',
                item.isCenter
                  ? 'relative -mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg text-2xl'
                  : isActive
                    ? 'text-primary font-semibold'
                    : 'text-gray-400',
              )}
            >
              <span className={item.isCenter ? 'text-2xl' : 'text-xl'}>{item.icon}</span>
              {!item.isCenter && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
