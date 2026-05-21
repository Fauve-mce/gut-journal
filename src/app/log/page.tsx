'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

const REPAS = ['Matin', 'Midi', 'Goûter'];
const BRISTOL = [1, 2, 3, 4, 5, 6, 7];

const BRISTOL_DESC: Record<number, string> = {
  1: '🪨 Dur, séparé',
  2: '🌰 Grumeleux',
  3: '🌿 Craquelé',
  4: '🟤 Lisse normal',
  5: '💧 Mou séparé',
  6: '🌊 Mou, boueux',
  7: '💦 Liquide',
};

export default function LogPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [menuDuJour, setMenuDuJour] = useState<Record<string, string>>({});
  const [consomme, setConsomme] = useState<Record<string, string>>({});
  const [bristol, setBristol] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    if (date) {
      loadMenu();
      loadLog();
    }
  }, [date]);

  const getSemaine = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };

  const getJour = (dateStr: string) => {
    const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return jours[new Date(dateStr).getDay()];
  };

  const loadMenu = async () => {
    const semaine = getSemaine(date);
    const jour = getJour(date);
    const q = query(
      collection(db, 'menus'),
      where('semaine', '==', semaine),
      where('jour', '==', jour)
    );
    const snap = await getDocs(q);
    const data: Record<string, string> = {};
    snap.forEach((d) => {
      const item = d.data();
      data[item.repas] = item.aliments;
    });
    setMenuDuJour(data);
  };

  const loadLog = async () => {
    const q = query(
      collection(db, 'logs'),
      where('date', '==', date),
      where('userId', '==', user?.uid)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data();
      setConsomme(data.consomme || {});
      setBristol(data.bristol || null);
      setNotes(data.notes || '');
    } else {
      setConsomme({});
      setBristol(null);
      setNotes('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await addDoc(collection(db, 'logs'), {
      date,
      userId: user?.uid,
      userEmail: user?.email,
      consomme,
      bristol,
      notes,
      createdAt: new Date(),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return null;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mt-6 mb-4">📋 Saisie du jour</h1>

      <div className="mb-5">
        <label className="text-sm font-medium text-gray-600 block mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-400"
        />
      </div>

      {/* Repas */}
      <div className="flex flex-col gap-4 mb-5">
        {REPAS.map((repas) => (
          <div key={repas} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <h2 className="font-bold text-gray-700 mb-1">{repas}</h2>
            {menuDuJour[repas] && (
              <p className="text-xs text-blue-400 mb-2">📌 Prévu : {menuDuJour[repas]}</p>
            )}
            <input
              type="text"
              value={consomme[repas] || ''}
              onChange={(e) =>
                setConsomme((prev) => ({ ...prev, [repas]: e.target.value }))
              }
              placeholder="Ce qui a été mangé..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </div>
        ))}
      </div>

      {/* Bristol */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-5">
        <h2 className="font-bold text-gray-700 mb-3">💩 Selles (échelle de Bristol)</h2>
        <div className="grid grid-cols-4 gap-2">
          {BRISTOL.map((b) => (
            <button
              key={b}
              onClick={() => setBristol(b)}
              className={`rounded-xl py-2 text-sm font-medium border transition ${
                bristol === b
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
        {bristol && (
          <p className="text-sm text-gray-500 mt-2">{BRISTOL_DESC[bristol]}</p>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-5">
        <h2 className="font-bold text-gray-700 mb-2">📝 Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observations, humeur, autres..."
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium hover:bg-blue-600 transition disabled:opacity-50"
      >
        {saving ? 'Sauvegarde...' : saved ? '✅ Sauvegardé !' : 'Sauvegarder'}
      </button>
    </div>
  );
}
