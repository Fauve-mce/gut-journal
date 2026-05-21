import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Meal = {
  id: string;
  date: string;
  description: string;
  foods: string[];
};

export type Stool = {
  id: string;
  date: string;
  type: number; // Échelle de Bristol 1-7
  notes?: string;
};

export type Symptom = {
  id: string;
  date: string;
  type: string;
  severity: number; // 1-10
  notes?: string;
};

type AppStore = {
  meals: Meal[];
  stools: Stool[];
  symptoms: Symptom[];
  addMeal: (meal: Meal) => void;
  addStool: (stool: Stool) => void;
  addSymptom: (symptom: Symptom) => void;
  deleteMeal: (id: string) => void;
  deleteStool: (id: string) => void;
  deleteSymptom: (id: string) => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      meals: [],
      stools: [],
      symptoms: [],
      addMeal: (meal) => set((s) => ({ meals: [meal, ...s.meals] })),
      addStool: (stool) => set((s) => ({ stools: [stool, ...s.stools] })),
      addSymptom: (symptom) =>
        set((s) => ({ symptoms: [symptom, ...s.symptoms] })),
      deleteMeal: (id) =>
        set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),
      deleteStool: (id) =>
        set((s) => ({ stools: s.stools.filter((m) => m.id !== id) })),
      deleteSymptom: (id) =>
        set((s) => ({ symptoms: s.symptoms.filter((m) => m.id !== id) })),
    }),
    { name: "gut-tracker-store" }
  )
);
