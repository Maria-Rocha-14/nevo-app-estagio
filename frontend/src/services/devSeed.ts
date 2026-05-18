import { db } from '../db/db';
import type { User } from '../db/db';
import { setLoggedInUserId } from './session';

const DEMO_EMAIL = 'demo@nevo.local';
const yesterdayIso = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString();
};

const createDemoUser = (): User => ({
  name: 'Utilizador Demo',
  email: DEMO_EMAIL,
  dob: '2000-01-01',
  password: 'Demo#1234',
  skinHistory: 'pnr',
  createdAt: new Date().toISOString(),
  accountStatus: 'active',
  xp: 9999,
  points: 9999,
  weeksStreak: 52,
  scansCount: 12,
  lastMissionDate: new Date().toISOString().split('T')[0],
  avatar: {
    name: 'Nemi',
    colorId: 'blue',
    outfitId: 'none',
    shoeId: 'none',
    accessoryId: 'none',
    specialId: 'none'
  },
  completedChallenges: ['card-abcde', 'quiz-warning-sign', 'card-protective-barriers'],
  challengeHistory: [
    {
      challengeId: 'card-abcde',
      completedAt: yesterdayIso(),
      pointsAwarded: 10
    },
    {
      challengeId: 'quiz-warning-sign',
      completedAt: yesterdayIso(),
      pointsAwarded: 20
    },
    {
      challengeId: 'card-protective-barriers',
      completedAt: yesterdayIso(),
      pointsAwarded: 15
    }
  ],
  assessmentHistory: [
    {
      createdAt: new Date().toISOString(),
      fileName: 'demo_scan_baixo.jpg',
      probability: 22,
      riskLevel: 'low',
      simulated: true
    },
    {
      createdAt: new Date().toISOString(),
      fileName: 'demo_scan_moderado.jpg',
      probability: 56,
      riskLevel: 'moderate',
      simulated: true
    }
  ]
});

export const seedAndLoginDemoUser = async (): Promise<number> => {
  const demoUser = createDemoUser();
  const existingUser = await db.users.where({ email: DEMO_EMAIL }).first();

  let userId = existingUser?.id;

  if (userId) {
    await db.users.put({ ...demoUser, id: userId });
  } else {
    const createdId = await db.users.add(demoUser);
    if (typeof createdId !== 'number') {
      throw new Error('Could not create demo user');
    }
    userId = createdId;
  }

  setLoggedInUserId(userId);
  return userId;
};
