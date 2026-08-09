import type { PlanOrigin } from '../plan/types';

export type TitanProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export type TitanProjectRecord = {
  id: string;
  profileId: string | null;
  name: string;
  objective: string;
  source: PlanOrigin;
  status: TitanProjectStatus;
  trainingPlanId?: string;
  cardioPlanId?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
};
