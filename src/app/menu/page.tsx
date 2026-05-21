'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const REPAS = ['Matin', 'Midi', 'Goûter'];

export default function MenuPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [semaine, setSemaine] = useState('');
  const [menu, setMenu] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  // Semaine courante par défaut (lundi)
  useEffect(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    setSemaine(monday.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (semaine) loadMenu();
  }, [semaine]);

  const loadMenu = async () => {
    const q = query(collection(db, 'menus'), where('semaine', '==', semaine));
    const snap = await getDocs(q);
    const data: Record<string, Record<string, string>> = {};
    snap.forEach((d) => {
      const item = d.data();
      if (!data[item.jour]) data[item.jour] = {};
      data[item.jour][item.repas] = item.aliments;
    });
    setMenu(data);
  };

  const handleChange = (jour: string, repas: string, value: string) => {
    setMenu((prev) => ({
      ...prev,
      [jour]: { ...(prev[jour] || {}), [repas]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Supprimer anciens
    const q = query(collection(db, 'menus'), where('semaine', '==', semaine));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, 'menus', d.id))));
    // Sauvegarder nouveaux
    const promises: Promise<any>[] = [];
    JOURS.forEach((jour) => {
      REPAS.forEach((repas) => {
        const val = menu[jour]?.[repas];
        if (val?.trim()) {
          promises.push(
            addDoc(collection(db, 'menus'), {
              semaine,
              jour,
              repas,
              aliments: val.trim(),
            })
          );
        }
      });
    });
    await Promise.all(promises);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return null;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mt-6 mb-4">🍽️ Menu semaine</h1>

      <div className="mb-4">
        <label className="text-sm font-medium text-gray-600 block mb-1">
          Semaine du (lundi)
        </label>
        <input
          type="date"
          value={semaine}
          onChange={(e) => setSemaine(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-400"
        />
      </div>

      <div className="flex flex-col gap-4">
        {JOURS.map((jour) => (
          <div key={jour} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <h2 className="font-bold text-gray-700 mb-3">{jour}</h2>
            <div className="flex flex-col gap-2">
              {REPAS.map((repas) => (
                <div key={repas}>
                  <label className="text-xs text-gray-400 font-medium">{repas}</label>
                  <input
                    type="text"
                    value={menu[jour]?.[repas] || ''}
                    onChange={(e) => handleChange(jour, repas, e.target.value)}
                    placeholder="ex: purée carottes, compote..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-400"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-6 bg-blue-500 text-white rounded-xl py-3 font-medium hover:bg-blue-600 transition disabled:opacity-50"
      >
        {saving ? 'Sauvegarde...' : saved ? '✅ Sauvegardé !' : 'Sauvegarder le menu'}
      </button>
    </div>
  );
}
