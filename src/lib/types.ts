
export type MealLog = {
  id: string;
  mealType: 'breakfast' | 'morningSnack' | 'lunch' | 'eveningSnack' | 'dinner';
  mealName: string;
  quantity: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  recipe?: string;
  createdAt: { seconds: number; nanoseconds: number };
};

export type ActivityLog = {
  id: string;
  activity: string;
  duration: number;
  caloriesBurned: number;
  description?: string;
  date?: string;
  createdAt: { seconds: number; nanoseconds: number };
};

export type AnalysisRecord = {
    id: string;
    summary: string;
    criticalMarkers: { marker: string; value: string; level: string }[];
    dosAndDonts: { dos: string, donts: string };
    lifestyleModifications: string;
    createdAt: { seconds: number; nanoseconds: number };
}

export type SleepLog = {
  quality: 'excellent' | 'good' | 'moderate' | 'low';
  createdAt: { seconds: number; nanoseconds: number };
};
