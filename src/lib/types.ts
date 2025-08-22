
export type MealLog = {
  id: string;
  mealType: string;
  mealName: string;
  quantity: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  createdAt: { seconds: number; nanoseconds: number };
};

export type ActivityLog = {
  id: string;
  activityName: string;
  duration: string;
  description?: string;
  caloriesBurned: number;
  createdAt: { seconds: number; nanoseconds: number };
}

export type AnalysisRecord = {
    id: string;
    summary: string;
    criticalMarkers: { marker: string; value: string; level: string }[];
    dosAndDonts: { dos: string, donts: string };
    lifestyleModifications: string;
    createdAt: { seconds: number; nanoseconds: number };
}

export type SleepLog = {
  id: string;
  quality: 'excellent' | 'good' | 'moderate' | 'low';
  createdAt: { seconds: number; nanoseconds: number };
};
