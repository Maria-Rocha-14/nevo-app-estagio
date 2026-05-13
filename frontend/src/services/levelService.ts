const BASE_XP_PER_LEVEL = 100;
const XP_LEVEL_MULTIPLIER = 1.35;

export type LevelProgress = {
  currentLevel: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  progressPercentage: number;
  totalXp: number;
};

const normalizeXp = (xp: number): number => Math.max(0, Math.floor(xp || 0));

// Calculates the XP needed to advance from this level to the next one.
export const getXpRequiredForLevel = (level: number): number => {
  const safeLevel = Math.max(1, Math.floor(level || 1));
  return Math.round(BASE_XP_PER_LEVEL * Math.pow(XP_LEVEL_MULTIPLIER, safeLevel - 1));
};

// Walks through level thresholds so large XP gains can skip multiple levels.
export const calculateLevelFromTotalXp = (totalXp: number): number => {
  let remainingXp = normalizeXp(totalXp);
  let level = 1;

  while (remainingXp >= getXpRequiredForLevel(level)) {
    remainingXp -= getXpRequiredForLevel(level);
    level += 1;
  }

  return level;
};

// Returns progress inside the current level, not across the full XP total.
export const getLevelProgress = (totalXp: number): LevelProgress => {
  const safeTotalXp = normalizeXp(totalXp);
  let currentLevel = 1;
  let currentLevelXp = safeTotalXp;
  let xpForNextLevel = getXpRequiredForLevel(currentLevel);

  while (currentLevelXp >= xpForNextLevel) {
    currentLevelXp -= xpForNextLevel;
    currentLevel += 1;
    xpForNextLevel = getXpRequiredForLevel(currentLevel);
  }

  return {
    currentLevel,
    currentLevelXp,
    xpForNextLevel,
    progressPercentage: Math.min(100, Math.round((currentLevelXp / xpForNextLevel) * 100)),
    totalXp: safeTotalXp
  };
};

