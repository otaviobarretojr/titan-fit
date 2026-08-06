export type CardioType = 'walk' | 'zone2' | 'run' | 'hiit' | 'bike' | 'stairs' | 'other';

export type CardioPlanSession = {
  id: string;
  title: string;
  type: CardioType;
  durationMinutes: number;
  description: string;
  target?: string;
};

export type CardioPlanWeek = {
  week: number;
  title: string;
  sessions: CardioPlanSession[];
};

export type CardioPlan = {
  schemaVersion: 1;
  id: string;
  name: string;
  goal: 'first-5k';
  description?: string;
  weeks: CardioPlanWeek[];
};

export type CardioRecord = {
  id: string;
  planId?: string;
  planSessionId?: string;
  type: CardioType;
  startedAt: string;
  completedAt: string;
  durationMinutes: number;
  distanceKm?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  effort?: number;
  notes?: string;
};
