import { db } from '../db/db';
import type { User, AssessmentHistoryEntry } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';

const SESSION_KEY = 'logged_in_user_id';

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
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? parseInt(raw, 10) : null;
};

export const setLoggedInUserId = (id: number | undefined) => {
  if (id === undefined) {
    localStorage.removeItem(SESSION_KEY);
  } else {
    localStorage.setItem(SESSION_KEY, id.toString());
  }
};

export const logoutUser = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const completeChallengeOnce = async (challengeId: string, pointsToAdd: number): Promise<void> => {
  const userId = getLoggedInUserId();
  if (!userId) return;

  await db.transaction('rw', db.users, async () => {
    const current = await db.users.get(userId);
    if (!current) return;
    
    if (current.completedChallenges.includes(challengeId)) return;

    await db.users.update(userId, {
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
    });
  });
};

export const awardDailyMissionXp = async (xpToAdd: number): Promise<void> => {
  const userId = getLoggedInUserId();
  if (!userId) return;

  const today = new Date().toLocaleDateString();

  await db.transaction('rw', db.users, async () => {
    const current = await db.users.get(userId);
    if (!current) return;

    if (current.lastMissionDate === today) return;

    await db.users.update(userId, {
      xp: current.xp + xpToAdd,
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
      scansCount: current.scansCount + 1,
      assessmentHistory: [...current.assessmentHistory, entry]
    });
  });
};
