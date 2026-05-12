import { db } from '../db/db';
import type { User, AssessmentHistoryEntry } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';

const SESSION_KEY = 'logged_in_user_id';
const ADMIN_SESSION_KEY = 'admin_logged_in';

export const ADMIN_EMAIL = 'admin@nevo.local';
export const ADMIN_PASSWORD = 'Admin#1234';

export const useSessionUser = (): User | null | undefined => {
    const userId = getLoggedInUserId();
    return useLiveQuery<User | null>(
      async () => {
        if (!userId) return null;
        const u = await db.users.get(userId);
        return u || null;
      },
      [userId]
    );
};

export const getLoggedInUserId = (): number | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
};

export const setLoggedInUserId = (id: number | undefined) => {
  try {
    if (id === undefined) {
      localStorage.removeItem(SESSION_KEY);
    } else {
      localStorage.setItem(SESSION_KEY, id.toString());
    }
  } catch {
    return;
  }
};

export const logoutUser = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    return;
  }
};

export const isAdminLoggedIn = (): boolean => {
  try {
    return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setAdminLoggedIn = (loggedIn: boolean) => {
  try {
    if (loggedIn) {
      localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      localStorage.removeItem(SESSION_KEY);
    } else {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  } catch {
    return;
  }
};

export const validateAdminCredentials = (email: string, password: string): boolean => {
  return email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD;
};

export const logoutAdmin = () => {
  setAdminLoggedIn(false);
};

export const validatePassword = (password: string): boolean => {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
};

type ChallengeCompletionStatus = 'awarded' | 'already-completed' | 'daily-limit' | 'no-session' | 'user-missing';

type ChallengeCompletionInput = {
  id: string;
  points: number;
};

type DailyChallengesCompletionResult = {
  status: ChallengeCompletionStatus;
  pointsAwarded: number;
  completedCount: number;
};

const DAILY_CHALLENGE_LIMIT = 4;

const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const completeChallengeOnce = async (challengeId: string, pointsToAdd: number): Promise<ChallengeCompletionStatus> => {
  const userId = getLoggedInUserId();
  if (!userId) return 'no-session';

  let status: ChallengeCompletionStatus = 'user-missing';
  const today = getLocalDateKey(new Date());

  await db.transaction('rw', db.users, async () => {
    const current = await db.users.get(userId);
    if (!current) {
      status = 'user-missing';
      return;
    }

    if (current.completedChallenges.includes(challengeId)) {
      status = 'already-completed';
      return;
    }

    const completedToday = (current.challengeHistory || []).filter((entry) => entry.completedAt.startsWith(today)).length;
    if (completedToday >= DAILY_CHALLENGE_LIMIT) {
      status = 'daily-limit';
      return;
    }

    await db.users.update(userId, {
      points: (current.points || 0) + pointsToAdd,
      xp: (current.xp || 0) + pointsToAdd, // Unificação aqui também
      completedChallenges: [...(current.completedChallenges || []), challengeId],
      challengeHistory: [
        ...(current.challengeHistory || []),
        {
          challengeId,
          completedAt: new Date().toISOString(),
          pointsAwarded: pointsToAdd
        }
      ]
    });

    status = 'awarded';
  });

  return status;
};

export const completeDailyChallengesOnce = async (challenges: ChallengeCompletionInput[]): Promise<DailyChallengesCompletionResult> => {
  const userId = getLoggedInUserId();
  if (!userId) return { status: 'no-session', pointsAwarded: 0, completedCount: 0 };

  let result: DailyChallengesCompletionResult = { status: 'user-missing', pointsAwarded: 0, completedCount: 0 };
  const today = getLocalDateKey(new Date());

  await db.transaction('rw', db.users, async () => {
    const current = await db.users.get(userId);
    if (!current) {
      result = { status: 'user-missing', pointsAwarded: 0, completedCount: 0 };
      return;
    }

    const completedChallengeIds = new Set(current.completedChallenges || []);
    const uniquePendingChallenges = challenges.filter((challenge, index, allChallenges) => (
      !completedChallengeIds.has(challenge.id)
      && allChallenges.findIndex((item) => item.id === challenge.id) === index
    ));

    if (uniquePendingChallenges.length === 0) {
      result = { status: 'already-completed', pointsAwarded: 0, completedCount: 0 };
      return;
    }

    const challengeHistory = current.challengeHistory || [];
    const completedToday = challengeHistory.filter((entry) => entry.completedAt.startsWith(today)).length;
    const remainingToday = DAILY_CHALLENGE_LIMIT - completedToday;

    if (remainingToday < uniquePendingChallenges.length) {
      result = { status: 'daily-limit', pointsAwarded: 0, completedCount: 0 };
      return;
    }

    const completedAt = new Date().toISOString();
    const pointsAwarded = uniquePendingChallenges.reduce((sum, challenge) => sum + challenge.points, 0);

    await db.users.update(userId, {
      points: (current.points || 0) + pointsAwarded,
      xp: (current.xp || 0) + pointsAwarded,
      completedChallenges: [
        ...(current.completedChallenges || []),
        ...uniquePendingChallenges.map((challenge) => challenge.id)
      ],
      challengeHistory: [
        ...challengeHistory,
        ...uniquePendingChallenges.map((challenge) => ({
          challengeId: challenge.id,
          completedAt,
          pointsAwarded: challenge.points
        }))
      ]
    });

    result = {
      status: 'awarded',
      pointsAwarded,
      completedCount: uniquePendingChallenges.length
    };
  });

  return result;
};

// Atualização para a Missão Diária (IPMA)
export const awardDailyMissionXp = async (xpToAdd: number): Promise<void> => {
  const userId = getLoggedInUserId();
  if (!userId) return;

  const today = new Date().toISOString().split('T')[0];

  await db.transaction('rw', db.users, async () => {
    const current = await db.users.get(userId);
    if (!current || current.lastMissionDate === today) return;

    await db.users.update(userId, {
      xp: (current.xp || 0) + xpToAdd,
      points: (current.points || 0) + xpToAdd, // Unificação: XP e Pontos sobem juntos
      lastMissionDate: today
    });
  });
};



export const appendAssessmentHistory = async (entry: AssessmentHistoryEntry): Promise<void> => {
  const userId = getLoggedInUserId();
  if (!userId) return;

  await db.transaction('rw', db.users, async () => {
    const current = await db.users.get(userId);
    if (!current) return;

    await db.users.update(userId, {
      scansCount: (current.scansCount || 0) + 1,
      assessmentHistory: [...(current.assessmentHistory || []), entry]
    });
  });
};
