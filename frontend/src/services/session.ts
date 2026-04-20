export type ChallengeHistoryEntry = {
  challengeId: string;
  completedAt: string;
  pointsAwarded: number;
};

export type AssessmentHistoryEntry = {
  createdAt: string;
  fileName: string;
  probability: number;
  riskLevel: 'low' | 'moderate' | 'high';
  simulated: boolean;
};

export type UserSession = {
  id?: number;
  name: string;
  email: string;
  dob: string;
  password: string;
  xp: number;
  points: number;
  weeksStreak: number;
  scansCount: number;
  lastMissionDate?: string;
  completedChallenges: string[];
  challengeHistory: ChallengeHistoryEntry[];
  assessmentHistory: AssessmentHistoryEntry[];
};

const SESSION_KEY = 'user_session';

const asArray = <T>(value: unknown): T[] => {
  if (!Array.isArray(value)) return [];
  return value as T[];
};

const normalizeSession = (value: Partial<UserSession>): UserSession => {
  return {
    id: value.id,
    name: value.name || '',
    email: value.email || '',
    dob: value.dob || '',
    password: value.password || '',
    xp: value.xp || 0,
    points: value.points || 0,
    weeksStreak: value.weeksStreak || 0,
    scansCount: value.scansCount || 0,
    lastMissionDate: value.lastMissionDate,
    completedChallenges: asArray<string>(value.completedChallenges),
    challengeHistory: asArray<ChallengeHistoryEntry>(value.challengeHistory),
    assessmentHistory: asArray<AssessmentHistoryEntry>(value.assessmentHistory)
  };
};

export const getSessionUser = (): UserSession | null => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<UserSession>;
    return normalizeSession(parsed);
  } catch {
    return null;
  }
};

export const setSessionUser = (user: Partial<UserSession>): UserSession => {
  const normalized = normalizeSession(user);
  localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
  return normalized;
};

export const updateSessionUser = (updater: (current: UserSession) => UserSession): UserSession | null => {
  const current = getSessionUser();
  if (!current) return null;

  const next = updater(current);
  localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  return next;
};

export const completeChallengeOnce = (challengeId: string, pointsToAdd: number): UserSession | null => {
  return updateSessionUser((current) => {
    if (current.completedChallenges.includes(challengeId)) {
      return current;
    }

    return {
      ...current,
      points: current.points + pointsToAdd,
      completedChallenges: [...current.completedChallenges, challengeId],
      challengeHistory: [
        ...current.challengeHistory,
        {
          challengeId,
          completedAt: new Date().toISOString(),
          pointsAwarded: pointsToAdd
        }
      ]
    };
  });
};

export const awardDailyMissionXp = (xpToAdd: number): UserSession | null => {
  const today = new Date().toLocaleDateString();

  return updateSessionUser((current) => {
    if (current.lastMissionDate === today) {
      return current;
    }

    return {
      ...current,
      xp: current.xp + xpToAdd,
      lastMissionDate: today
    };
  });
};

export const appendAssessmentHistory = (entry: AssessmentHistoryEntry): UserSession | null => {
  return updateSessionUser((current) => ({
    ...current,
    scansCount: current.scansCount + 1,
    assessmentHistory: [...current.assessmentHistory, entry]
  }));
};
