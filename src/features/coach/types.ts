export type CoachSeverity = 'positive' | 'attention' | 'neutral';

export type CoachInsight = {
  id: string;
  severity: CoachSeverity;
  title: string;
  message: string;
};

export type CoachScore = {
  total: number;
  training: number;
  dataConfidence: 'low' | 'medium' | 'high';
};

export type CoachReport = {
  score: CoachScore;
  priority: CoachInsight;
  insights: CoachInsight[];
  generatedAt: string;
};
