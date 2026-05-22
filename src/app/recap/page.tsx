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

const JOURS_COURT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const REPAS = ['Matin', 'Midi', 'Goûter', 'Souper'];

function getMonday(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function getDatesOfWeek(monday: string) {
  const dates = [];
  const base = new Date(monday + 'T12:00:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export default function RecapPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const today = new Date().toISOString().split('T')[0];
  const [semaine, setSemaine] = useState(getMonday(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    if (semaine) loadLogs();
  }, [semaine]);

  const loadLogs = async () => {
    setLoadingData(true);
    const dates = getDatesOfWeek(semaine);
    const q = query(collection(db, 'logs'), where('date', 'in', dates));
    const snap = await getDocs(q);
    setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoadingData(false);
  };

  const prevWeek = () => {
    const d = new Date(semaine + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    const newMonday = d.toISOString().split('T')[0];
    setSemaine(newMonday);
    setSelectedDate(newMonday);
  };

  const nextWeek = () => {
    const d = new Date(semaine + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    const newMonday = d.toISOString().split('T')[0];
    setSemaine(newMonday);
    setSelectedDate(newMonday);
  };

  const labelSemaine = () => {
    const first = new Date(semaine + 'T12:00:00');
    const last = new Date(semaine + 'T12:00:00');
    last.setDate(last.getDate() + 6);
    return `${first.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} – ${last.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  };

  const getLog = (date: string) => logs.find((l: any) => l.date === date);
  const datesOfWeek = getDatesOfWeek(semaine);
  const selectedLog = getLog(selectedDate);
  const selectedIndex = datesOfWeek.indexOf(selectedDate);

  if (loading) return null;

  return (
    <div className="p-4 max-w-lg mx-auto pb-20">
      <h1 className="text-2xl font-bold text-gray-800 mt-6 mb-4">📊 Récapitulatif</h1>

      {/* Calendrier */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevWeek}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition flex items-center justify-center"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-gray-600">{labelSemaine()}</span>
          <button
            onClick={nextWeek}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition flex items-center justify-center"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {datesOfWeek.map((d, i) => {
            const isSelected = d === selectedDate;
            const isToday = d === today;
            const hasLog = !!getLog(d);
            return (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`flex flex-col items-center rounded-xl py-2 transition ${
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : isToday
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-xs font-medium">{JOURS_COURT[i]}</span>
                <span className="text-sm font-bold mt-0.5">
                  {new Date(d + 'T12:00:00').getDate()}
                </span>
                {hasLog && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-blue-400'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loadingData ? (
        <p className="text-center text-gray-400 text-sm">Chargement...</p>
      ) : (
        <>
          {/* Détail jour sélectionné */}
          <div className="bg-white rounded-2xl border border-blue-100 p-4 shadow-sm mb-5">
            <h2 className="font-bold text-gray-700 mb-3">
              🔍 {selectedIndex >= 0 ? JOURS[selectedIndex] : ''}{' '}
              <span className="text-gray-400 font-normal text-sm">{formatDate(selectedDate)}</span>
            </h2>

            {selectedLog ? (
              <>
                {REPAS.map((repas) => (
                  <div key={repas} className="mb-2">
                    <span className="text-xs font-medium text-gray-400">{repas} : </span>
                    <span className="text-sm text-gray-700">
                      {selectedLog.consomme?.[repas] || (
                        <span className="text-gray-300 italic">non renseigné</span>
                      )}
                    </span>
                  </div>
                ))}

                {selectedLog.nombreSelles > 0 && (
                  <div className="mt-3 text-sm">
                    <span className="text-xs font-medium text-gray-400">Selles : </span>
                    <span className="text-gray-700">{selectedLog.nombreSelles} selle(s)</span>
                    {selectedLog.bristolParSelle?.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1 ml-2">
                        {selectedLog.bristolParSelle.map((b: number, idx: number) => (
                          <span key={idx} className="text-gray-500 text-xs">
                            Selle {idx + 1} : {b ? `Type ${b} — ${BRISTOL_DESC[b]}` : 'non renseigné'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedLog.notes && (
                  <div className="mt-3 text-sm">
                    <span className="text-xs font-medium text-gray-400">Notes : </span>
                    <span className="text-gray-600">{selectedLog.notes}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-300 italic text-sm">Aucune saisie pour ce jour</p>
            )}
          </div>

          {/* Tous les jours de la semaine */}
          <h2 className="font-bold text-gray-700 mb-3">📅 Toute la semaine</h2>
          <div className="flex flex-col gap-3">
            {datesOfWeek.map((d, i) => {
              const log = getLog(d);
              const isToday = d === today;
              return (
                <div
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`bg-white rounded-2xl border p-4 shadow-sm cursor-pointer transition ${
                    d === selectedDate ? 'border-blue-300' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold text-sm ${isToday ? 'text-blue-500' : 'text-gray-700'}`}>
                      {JOURS[i]} {isToday && <span className="text-xs font-normal">(aujourd'hui)</span>}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(d)}</span>
                  </div>

                  {log ? (
                    <>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
                        {REPAS.map((repas) => (
                          <div key={repas} className="text-xs">
                            <span className="text-gray-400">{repas} : </span>
                            <span className="text-gray-600">
                              {log.consomme?.[repas] || <span className="text-gray-300">—</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                      {log.nombreSelles > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          💩 {log.nombreSelles} selle(s)
                          {log.bristolParSelle?.filter(Boolean).length > 0 && (
                            <span className="ml-1 text-gray-400">
                              — types : {log.bristolParSelle.filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>
                      )}
                      {log.notes && (
                        <div className="text-xs text-gray-400 mt-1 italic">📝 {log.notes}</div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-gray-300 italic">Aucune saisie</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
