import { db } from '../db/db';
import type { User, AssessmentHistoryEntry } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { achievementService } from './achievementService';

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
  xp?: number;
};

type DailyChallengesCompletionResult = {
  status: ChallengeCompletionStatus;
  pointsAwarded: number;
  xpAwarded: number;
  completedCount: number;
};

const DAILY_CHALLENGE_LIMIT = 4;
export const SCAN_XP_REWARD = 200;
export const SCAN_POINTS_REWARD = 50;

const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getChallengeIdsCompletedOnDate = (challengeHistory: User['challengeHistory'], dateKey: string): Set<string> => (
  new Set((challengeHistory || [])
    .filter((entry) => entry.completedAt.startsWith(dateKey))
    .map((entry) => entry.challengeId))
);

export const completeChallengeOnce = async (challengeId: string, pointsToAdd: number, xpToAdd = pointsToAdd): Promise<ChallengeCompletionStatus> => {
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

    const completedTodayIds = getChallengeIdsCompletedOnDate(current.challengeHistory || [], today);
    if (completedTodayIds.has(challengeId)) {
      status = 'already-completed';
      return;
    }

    const completedToday = (current.challengeHistory || []).filter((entry) => entry.completedAt.startsWith(today)).length;
    if (completedToday >= DAILY_CHALLENGE_LIMIT) {
      status = 'daily-limit';
      return;
    }

    const completedChallengeIds = new Set(current.completedChallenges || []);
    completedChallengeIds.add(challengeId);

    const novoXp = (current.xp || 0) + xpToAdd;

    await db.users.update(userId, {
      points: (current.points || 0) + pointsToAdd,
      xp: novoXp,
      completedChallenges: [...completedChallengeIds],
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

    const atualizado = await db.users.get(userId);
    if (atualizado) void achievementService.checkBadgeProgress(atualizado, 'points', novoXp);
  });

  return status;
};

export const completeDailyChallengesOnce = async (challenges: ChallengeCompletionInput[]): Promise<DailyChallengesCompletionResult> => {
  const userId = getLoggedInUserId();
  if (!userId) return { status: 'no-session', pointsAwarded: 0, xpAwarded: 0, completedCount: 0 };

  let result: DailyChallengesCompletionResult = { status: 'user-missing', pointsAwarded: 0, xpAwarded: 0, completedCount: 0 };
  const today = getLocalDateKey(new Date());

  await db.transaction('rw', db.users, async () => {
    const current = await db.users.get(userId);
    if (!current) {
      result = { status: 'user-missing', pointsAwarded: 0, xpAwarded: 0, completedCount: 0 };
      return;
    }

    const challengeHistory = current.challengeHistory || [];
    const completedTodayIds = getChallengeIdsCompletedOnDate(challengeHistory, today);
    const uniquePendingChallenges = challenges.filter((challenge, index, allChallenges) => (
      !completedTodayIds.has(challenge.id)
      && allChallenges.findIndex((item) => item.id === challenge.id) === index
    ));

    if (uniquePendingChallenges.length === 0) {
      result = { status: 'already-completed', pointsAwarded: 0, xpAwarded: 0, completedCount: 0 };
      return;
    }

    const completedToday = challengeHistory.filter((entry) => entry.completedAt.startsWith(today)).length;
    const remainingToday = DAILY_CHALLENGE_LIMIT - completedToday;

    if (remainingToday < uniquePendingChallenges.length) {
      result = { status: 'daily-limit', pointsAwarded: 0, xpAwarded: 0, completedCount: 0 };
      return;
    }

    const completedAt = new Date().toISOString();
    const pointsAwarded = uniquePendingChallenges.reduce((sum, challenge) => sum + challenge.points, 0);
    const xpAwarded = uniquePendingChallenges.reduce((sum, challenge) => sum + (challenge.xp ?? challenge.points), 0);
    const completedChallengeIds = new Set(current.completedChallenges || []);
    uniquePendingChallenges.forEach((challenge) => completedChallengeIds.add(challenge.id));

    const novoXp = (current.xp || 0) + xpAwarded;

    await db.users.update(userId, {
      points: (current.points || 0) + pointsAwarded,
      xp: novoXp,
      completedChallenges: [...completedChallengeIds],
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
      xpAwarded,
      completedCount: uniquePendingChallenges.length
    };

    const atualizado = await db.users.get(userId);
    if (atualizado) void achievementService.checkBadgeProgress(atualizado, 'points', novoXp);
  });

  return result;
};

// Atualização para a Missão Diária (IPMA)
export const awardDailyMissionXp = async (xpToAdd: number, pointsToAdd = 0): Promise<void> => {
  const userId = getLoggedInUserId();
  if (!userId) return;

  const today = new Date().toISOString().split('T')[0];

  await db.transaction('rw', db.users, async () => {
    const current = await db.users.get(userId);
    if (!current || current.lastMissionDate === today) return;

    const novoXp = (current.xp || 0) + xpToAdd;

    await db.users.update(userId, {
      xp: novoXp,
      points: (current.points || 0) + pointsToAdd,
      lastMissionDate: today
    });

    const atualizado = await db.users.get(userId);
    if (atualizado) void achievementService.checkBadgeProgress(atualizado, 'points', novoXp);
  });
};

export const appendAssessmentHistory = async (entry: AssessmentHistoryEntry): Promise<void> => {
  const userId = getLoggedInUserId();
  if (!userId) return;

  await db.transaction('rw', db.users, async () => {
    const current = await db.users.get(userId);
    if (!current) return;

    const novosScans = (current.scansCount || 0) + 1;
    const novoXp = (current.xp || 0) + SCAN_XP_REWARD;

    await db.users.update(userId, {
      scansCount: novosScans,
      xp: novoXp,
      points: (current.points || 0) + SCAN_POINTS_REWARD,
      assessmentHistory: [...(current.assessmentHistory || []), entry]
    });

    const atualizado = await db.users.get(userId);
    if (atualizado) {
      await achievementService.checkBadgeProgress(atualizado, 'scans', novosScans);
      const utilizadorRecarregado = await db.users.get(userId);
      if (utilizadorRecarregado) {
        void achievementService.checkBadgeProgress(utilizadorRecarregado, 'points', novoXp);
      }
    }
  });
};