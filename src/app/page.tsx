'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  if (loading) return null;

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="mt-8 mb-6">
        <p className="text-gray-400 text-sm capitalize">{today}</p>
        <h1 className="text-3xl font-bold text-gray-800 mt-1">Bonjour👋</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
      {user?.role !== 'puer' && (
        <Link href="/menu">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition cursor-pointer">
            <span className="text-3xl">🍽️</span>
            <h2 className="font-bold text-gray-700 mt-2">Menu</h2>
            <p className="text-xs text-gray-400 mt-1">Gérer les menus de la semaine</p>
          </div>
        </Link>
      )}
        <Link href="/log">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition cursor-pointer">
            <span className="text-3xl">✏️</span>
            <h2 className="font-bold text-gray-700 mt-2">Saisie</h2>
            <p className="text-xs text-gray-400 mt-1">Enregistrer le repas du jour</p>
          </div>
        </Link>

        <Link href="/recap">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition cursor-pointer">
            <span className="text-3xl">📊</span>
            <h2 className="font-bold text-gray-700 mt-2">Récap</h2>
            <p className="text-xs text-gray-400 mt-1">Voir la semaine en un coup d'œil</p>
          </div>
        </Link>

        <Link href="/profil">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition cursor-pointer">
            <span className="text-3xl">👤</span>
            <h2 className="font-bold text-gray-700 mt-2">Profil</h2>
            <p className="text-xs text-gray-400 mt-1">Mon compte</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
