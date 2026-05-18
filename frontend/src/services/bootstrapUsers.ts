import { db, type User } from '../db/db';

const BOOTSTRAP_USERS: Array<Omit<User, 'id'>> = [
  {
    name: 'Utilizador Normal',
    email: 'user@nevo.local',
    dob: '1995-01-01',
    password: 'User@1234',
    skinHistory: 'Sem histórico',
    createdAt: '',
    accountStatus: 'active',
    xp: 0,
    points: 0,
    unlockedAvatarItems: [],
    weeksStreak: 0,
    scansCount: 0,
    earnedBadges: [],
    lastMissionDate: undefined,
    avatar: {
      name: 'Nevo',
      colorId: 'green',
      outfitId: 'none',
      shoeId: 'none',
      accessoryId: 'none',
      specialId: 'none'
    },
    completedChallenges: [],
    challengeHistory: [],
    assessmentHistory: []
  },
  {
    name: 'Utilizador Power',
    email: 'power@nevo.local',
    dob: '1990-01-01',
    password: 'Power@1234',
    skinHistory: 'Sem histórico',
    createdAt: '',
    accountStatus: 'active',
    xp: 25000,
    points: 10000,
    unlockedAvatarItems: ['blue', 'simpleTee', 'glasses'],
    weeksStreak: 18,
    scansCount: 32,
    earnedBadges: [],
    lastMissionDate: undefined,
    avatar: {
      name: 'Nevo',
      colorId: 'blue',
      outfitId: 'simpleTee',
      shoeId: 'none',
      accessoryId: 'glasses',
      specialId: 'programmer'
    },
    completedChallenges: [],
    challengeHistory: [],
    assessmentHistory: []
  }
];

export const ensureBootstrapUsers = async (): Promise<void> => {
  const now = new Date().toISOString();

  for (const user of BOOTSTRAP_USERS) {
    const existingUser = await db.users.where('email').equals(user.email).first();
    if (!existingUser) {
      await db.users.add({
        ...user,
        createdAt: now
      });
    } else if (user.email === 'user@nevo.local') {
      await db.users.update(existingUser.id!, {
        xp: user.xp,
        points: user.points,
        unlockedAvatarItems: user.unlockedAvatarItems,
        weeksStreak: user.weeksStreak,
        scansCount: user.scansCount,
        earnedBadges: user.earnedBadges,
        lastMissionDate: user.lastMissionDate,
        avatar: user.avatar,
        completedChallenges: user.completedChallenges,
        challengeHistory: user.challengeHistory,
        assessmentHistory: user.assessmentHistory
      });
    }
  }
};
