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
  doc,
  updateDoc,
} from 'firebase/firestore';

const REPAS = ['Matin', 'Midi', 'Goûter', 'Souper'];
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

function getLocalToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function LogPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const today = getLocalToday();
  const [date, setDate] = useState(today);
  const [menuDuJour, setMenuDuJour] = useState<Record<string, string>>({});
  const [consomme, setConsomme] = useState<Record<string, string>>({});
  const [nombreSelles, setNombreSelles] = useState(0);
  const [bristolParSelle, setBristolParSelle] = useState<(number | null)[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showBristolRef, setShowBristolRef] = useState(false);
  const [existingLogId, setExistingLogId] = useState<string | null>(null);


  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    if (date && user && !loading) {
      loadMenu();
      loadLog();
    }
  }, [date, user, loading]);

  const handleNombreSelles = (n: number) => {
    const val = Math.max(0, n);
    setNombreSelles(val);
    setBristolParSelle((prev) => {
      const updated = [...prev];
      while (updated.length < val) updated.push(null);
      return updated.slice(0, val);
    });
  };

  const handleBristolSelle = (index: number, stade: number) => {
    setBristolParSelle((prev) => {
      const updated = [...prev];
      updated[index] = stade;
      return updated;
    });
  };

  const getSemaine = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getJour = (dateStr: string) => {
    const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return jours[new Date(dateStr + 'T12:00:00').getDay()];
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
    where('date', '==', date)
    // pas de filtre userId
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    const data = snap.docs[0].data();
    setExistingLogId(snap.docs[0].id);
    setConsomme(data.consomme || {});
    setNombreSelles(data.nombreSelles || 0);
    setBristolParSelle(data.bristolParSelle || []);
    setNotes(data.notes || '');
  } else {
    setExistingLogId(null);
    setConsomme({});
    setNombreSelles(0);
    setBristolParSelle([]);
    setNotes('');
  }
};


  const handleSave = async () => {
    setSaving(true);
    const q = query(
      collection(db, 'logs'),
      where('date', '==', date),
      where('userId', '==', user?.uid)
    );
    const snap = await getDocs(q);
    const payload = {
      date,
      userId: user?.uid,
      userEmail: user?.email,
      consomme,
      nombreSelles,
      bristolParSelle,
      notes,
      createdAt: new Date(),
    };
    if (!snap.empty) {
      await updateDoc(doc(db, 'logs', snap.docs[0].id), payload);
    } else {
      await addDoc(collection(db, 'logs'), payload);
    }
    setSaving(false);
    setSaved(true);
    await loadLog();
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return null;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mt-6 mb-4">📋 Saisie du jour</h1>

      {/* Date */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-5">
        <label className="text-sm text-gray-500 mb-1 block">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
          style={{ colorScheme: 'light' }}
        />
        <p className="text-sm text-gray-600 mt-1">
          {date ? new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
        </p>
      </div>

      {/* Repas */}
      <div className="flex flex-col gap-4 mb-5">
        {REPAS.map((repas) => (
          <div key={repas} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <h2 className="font-bold text-gray-700 mb-1">{repas}</h2>
            {menuDuJour[repas] && (
              <p className="text-xs text-blue-400 mb-2">📌 Prévu : {menuDuJour[repas]}</p>
            )}
            <textarea
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

      {/* Selles */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-5">
        <h2 className="font-bold text-gray-700 mb-3">💩 Selles</h2>

        <button
          onClick={() => setShowBristolRef(!showBristolRef)}
          className="text-xs text-blue-500 underline mb-3 block"
        >
          {showBristolRef ? '▲ Masquer le tableau de référence' : '📊 Voir le tableau de référence Bristol'}
        </button>

        {showBristolRef && (
          <div className="mb-4 rounded-xl overflow-hidden border border-gray-200">
            <img
              src="/échelleDeBristol.png"
              alt="Échelle de Bristol"
              className="w-full object-contain"
            />
          </div>
        )}

        <div className="flex items-center gap-4 mb-4">
          <p className="text-sm text-gray-600">Nombre de selles :</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNombreSelles(nombreSelles - 1)}
              className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition"
            >
              −
            </button>
            <span className="text-lg font-bold w-4 text-center">{nombreSelles}</span>
            <button
              onClick={() => handleNombreSelles(nombreSelles + 1)}
              className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold hover:bg-blue-200 transition"
            >
              +
            </button>
          </div>
        </div>

        {bristolParSelle.map((stade, index) => (
          <div key={index} className="mb-4 bg-gray-50 rounded-xl p-3">
            <p className="text-sm font-medium text-gray-600 mb-2">Selle {index + 1} :</p>
            <div className="grid grid-cols-4 gap-2">
              {BRISTOL.map((b) => (
                <button
                  key={b}
                  onClick={() => handleBristolSelle(index, b)}
                  className={`rounded-xl py-2 text-sm font-medium border transition ${
                    stade === b
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
            {stade && (
              <p className="text-xs text-gray-500 mt-2">{BRISTOL_DESC[stade]}</p>
            )}
          </div>
        ))}
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
