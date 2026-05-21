'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

export default function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user || pathname === '/login') return null;

  const isAdmin = user.email === 'admin@babytrack.com'; 

  const links = isAdmin
    ? [
        { href: '/', label: 'Accueil', icon: '🏠' },
        { href: '/menu', label: 'Menu', icon: '🍽️' },
        { href: '/recap', label: 'Récap', icon: '📊' },
        { href: '/correlation', label: 'Corrélation', icon: '🔬' },
      ]
    : [
        { href: '/', label: 'Accueil', icon: '🏠' },
        { href: '/log', label: 'Saisie', icon: '📋' },
        { href: '/correlation', label: 'Corrélation', icon: '🔬' },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50">
      <div className="flex justify-around max-w-lg mx-auto">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition ${
              pathname === link.href
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-400'
            }`}
          >
            <span className="text-xl">{link.icon}</span>
            <span className="text-xs font-medium">{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
