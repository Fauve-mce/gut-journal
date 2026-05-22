'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

interface AppUser {
  uid: string;
  email: string | null;
  role: 'admin' | 'puer';
  displayName?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Récupère le rôle depuis Firestore
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        const role = docSnap.exists() ? docSnap.data().role : 'puer';

        document.cookie = `role=${role}; path=/; max-age=${60 * 60 * 24 * 7}`;



        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role,
          displayName: firebaseUser.displayName,
        });

        if (pathname === '/login') router.push('/');
      } else {
        document.cookie = 'role=; path=/; max-age=0';
        setUser(null);
        if (pathname !== '/login') router.push('/login');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce">👶</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
