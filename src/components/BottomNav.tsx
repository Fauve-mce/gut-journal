'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

const NAV_ADMIN = [
  { href: '/', label: 'Accueil', icon: '🏠' },
  { href: '/menu', label: 'Menu', icon: '🍽️' },
  { href: '/log', label: 'Saisie', icon: '✏️' },
  { href: '/recap', label: 'Recap', icon: '📊' },
  { href: '/profil', label: 'Profil', icon: '👤' },
];

const NAV_PUER = [
  { href: '/', label: 'Accueil', icon: '🏠' },
  { href: '/log', label: 'Saisie', icon: '✏️' },
  { href: '/recap', label: 'Recap', icon: '📊' },
  { href: '/profil', label: 'Profil', icon: '👤' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  console.log('role:', user?.role);

  if (!user) return null;

  const NAV = user.role === 'puer' ? NAV_PUER : NAV_ADMIN;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 z-50">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-col items-center gap-1 text-xs font-medium transition ${
            pathname === item.href
              ? 'text-blue-500'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="text-xl">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
