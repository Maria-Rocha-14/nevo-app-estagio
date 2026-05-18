const BASE_XP_PER_LEVEL = 100;
const XP_LEVEL_MULTIPLIER = 1.35;

export type LevelProgress = {
  currentLevel: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  levelStartTotalXp: number;
  nextLevelTotalXp: number;
  remainingXpForNextLevel: number;
  progressPercentage: number;
  totalXp: number;
};

const normalizeXp = (xp: number): number => Math.max(0, Math.floor(xp || 0));

// Calculates the XP needed to advance from this level to the next one.
export const getXpRequiredForLevel = (level: number): number => {
  const safeLevel = Math.max(1, Math.floor(level || 1));
  return Math.round(BASE_XP_PER_LEVEL * Math.pow(XP_LEVEL_MULTIPLIER, safeLevel - 1));
};

// Calculates the total XP required to reach a level.
// Level 1 always starts at 0 XP; level 2 starts after level 1's 100 XP.
export const getTotalXpRequiredForLevel = (level: number): number => {
  const safeLevel = Math.max(1, Math.floor(level || 1));
  let requiredXp = 0;

  for (let currentLevel = 1; currentLevel < safeLevel; currentLevel += 1) {
    requiredXp += getXpRequiredForLevel(currentLevel);
  }

  return requiredXp;
};

// Walks through cumulative level thresholds so large XP gains can skip multiple levels.
export const calculateLevelFromTotalXp = (totalXp: number): number => {
  const safeTotalXp = normalizeXp(totalXp);
  let level = 1;

  while (safeTotalXp >= getTotalXpRequiredForLevel(level + 1)) {
    level += 1;
  }

  return level;
};

// Returns progress inside the current level, not across the full XP total.
export const getLevelProgress = (totalXp: number): LevelProgress => {
  const safeTotalXp = normalizeXp(totalXp);
  const currentLevel = calculateLevelFromTotalXp(safeTotalXp);
  const levelStartTotalXp = getTotalXpRequiredForLevel(currentLevel);
  const nextLevelTotalXp = getTotalXpRequiredForLevel(currentLevel + 1);
  const xpForNextLevel = nextLevelTotalXp - levelStartTotalXp;
  const currentLevelXp = safeTotalXp - levelStartTotalXp;

  return {
    currentLevel,
    currentLevelXp,
    xpForNextLevel,
    levelStartTotalXp,
    nextLevelTotalXp,
    remainingXpForNextLevel: Math.max(0, xpForNextLevel - currentLevelXp),
    progressPercentage: Math.min(100, Math.round((currentLevelXp / xpForNextLevel) * 100)),
    totalXp: safeTotalXp
  };
};
