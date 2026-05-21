'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ProfilPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading) return null;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mt-8 mb-6">Mon profil</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-4">
        <p className="text-xs text-gray-400 mb-1">Email</p>
        <p className="text-gray-700 font-medium">{user?.email}</p>
      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-red-50 text-red-500 font-semibold py-3 rounded-2xl border border-red-100 hover:bg-red-100 transition"
      >
        Se déconnecter
      </button>
    </div>
  );
}
