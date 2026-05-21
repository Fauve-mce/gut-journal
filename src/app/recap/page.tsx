'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const BRISTOL_DESC: Record<number, string> = {
  1: '🪨 Dur, séparé',
  2: '🌰 Grumeleux',
  3: '🌿 Craquelé',
  4: '🟤 Lisse normal',
  5: '💧 Mou séparé',
  6: '🌊 Mou, boueux',
  7: '💦 Liquide',
};

export default function RecapPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [semaine, setSemaine] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    setSemaine(monday.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (semaine) loadLogs();
  }, [semaine]);

  const getDatesOfWeek = (monday: string) => {
    const dates = [];
    const base = new Date(monday);
    for (let i = 0; i < 5; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const loadLogs = async () => {
    setLoadingData(true);
    const dates = getDatesOfWeek(semaine);
    const q = query(
      collection(db, 'logs'),
      where('date', 'in', dates)
    );
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setLogs(data);
    setLoadingData(false);
  };

  const getLog = (date: string) =>
    logs.find((l: any) => l.date === date);

  const dates = semaine ? getDatesOfWeek(semaine) : [];
  const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  const REPAS = ['Matin', 'Midi', 'Goûter'];

  if (loading) return null;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mt-6 mb-4">📊 Récapitulatif</h1>

      <div className="mb-5">
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

      {loadingData ? (
        <p className="text-gray-400 text-sm text-center mt-10">Chargement...</p>
      ) : (
        <div className="flex flex-col gap-4">
          {dates.map((date, i) => {
            const log = getLog(date);
            return (
              <div
                key={date}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
              >
                <h2 className="font-bold text-gray-700 mb-3">
                  {JOURS[i]}{' '}
                  <span className="text-gray-400 font-normal text-sm">
                    {new Date(date).toLocaleDateString('fr-FR')}
                  </span>
                </h2>

                {log ? (
                  <>
                    {REPAS.map((repas) => (
                      <div key={repas} className="mb-2">
                        <span className="text-xs font-medium text-gray-400">{repas} : </span>
                        <span className="text-sm text-gray-700">
                          {log.consomme?.[repas] || (
                            <span className="text-gray-300 italic">non renseigné</span>
                          )}
                        </span>
                      </div>
                    ))}
                    {log.bristol && (
                      <div className="mt-2 text-sm">
                        <span className="text-xs font-medium text-gray-400">Selles : </span>
                        {BRISTOL_DESC[log.bristol]}
                      </div>
                    )}
                    {log.notes && (
                      <div className="mt-2 text-sm">
                        <span className="text-xs font-medium text-gray-400">Notes : </span>
                        <span className="text-gray-600">{log.notes}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-300 italic text-sm">Aucune saisie</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
